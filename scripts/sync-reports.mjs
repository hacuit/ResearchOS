#!/usr/bin/env node
/**
 * ResearchOS local sync script.
 *
 * Scans a reports directory for Daily_Report_YYYY-MM-DD.md files and uploads
 * them to the ResearchOS API. Safe to re-run: unchanged files are skipped
 * locally (hash state file) and deduplicated again server-side.
 *
 * Usage:
 *   node scripts/sync-reports.mjs [--dir <path>] [--api <url>] [--all] [--dry-run]
 *
 * Config resolution (later wins):
 *   1. sync.config.json next to this script
 *      { "reportsDir": "C:\\Research\\07_reports",
 *        "apiUrl": "https://your-app.vercel.app",
 *        "apiToken": "ros_..." }
 *   2. env vars: ROS_REPORTS_DIR, ROS_API_URL, ROS_API_TOKEN
 *   3. CLI flags: --dir, --api
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(SCRIPT_DIR, "sync.config.json");
const STATE_PATH = path.join(SCRIPT_DIR, ".sync-state.json");
const FILE_PATTERN = /^Daily_Report_(\d{4}-\d{2}-\d{2})\.md$/;
const BATCH_SIZE = 20;

function parseArgs(argv) {
  const args = { all: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") args.all = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--dir") args.dir = argv[++i];
    else if (a === "--api") args.api = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log("usage: node sync-reports.mjs [--dir <path>] [--api <url>] [--all] [--dry-run]");
      process.exit(0);
    }
  }
  return args;
}

function loadConfig(args) {
  let fileConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch {
      console.error(`! sync.config.json 파싱 실패: ${CONFIG_PATH}`);
      process.exit(1);
    }
  }
  const config = {
    reportsDir: args.dir ?? process.env.ROS_REPORTS_DIR ?? fileConfig.reportsDir,
    apiUrl: args.api ?? process.env.ROS_API_URL ?? fileConfig.apiUrl,
    apiToken: process.env.ROS_API_TOKEN ?? fileConfig.apiToken,
  };
  const missing = [];
  if (!config.reportsDir) missing.push("reportsDir (--dir / ROS_REPORTS_DIR)");
  if (!config.apiUrl) missing.push("apiUrl (--api / ROS_API_URL)");
  if (!config.apiToken) missing.push("apiToken (ROS_API_TOKEN / sync.config.json)");
  if (missing.length) {
    console.error("! 설정이 없습니다:\n  - " + missing.join("\n  - "));
    console.error(`\nsync.config.json 예시 (${CONFIG_PATH}):`);
    console.error(JSON.stringify(
      { reportsDir: "C:\\Research\\07_reports", apiUrl: "https://your-app.vercel.app", apiToken: "ros_..." },
      null, 2
    ));
    process.exit(1);
  }
  config.apiUrl = config.apiUrl.replace(/\/+$/, "");
  return config;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

/** First markdown H1, else "Daily Report <date>". */
function extractTitle(body, date) {
  for (const line of body.split(/\r?\n/)) {
    const m = /^#\s+(.+)/.exec(line.trim());
    if (m) return m[1].trim().slice(0, 300);
  }
  return `Daily Report ${date}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig(args);

  if (!fs.existsSync(config.reportsDir)) {
    console.error(`! 리포트 폴더가 없습니다: ${config.reportsDir}`);
    process.exit(1);
  }

  const state = args.all ? {} : loadState();
  const entries = fs
    .readdirSync(config.reportsDir)
    .filter((f) => FILE_PATTERN.test(f))
    .sort();

  const reports = [];
  let unchanged = 0;
  for (const fileName of entries) {
    const date = FILE_PATTERN.exec(fileName)[1];
    const body = fs.readFileSync(path.join(config.reportsDir, fileName), "utf8");
    const hash = sha256(body);
    if (state[fileName] === hash) {
      unchanged++;
      continue;
    }
    reports.push({
      fileName,
      date,
      title: extractTitle(body, date),
      bodyMd: body,
      contentHash: hash,
    });
  }

  console.log(`발견 ${entries.length}개 / 변경 ${reports.length}개 / 로컬 스킵 ${unchanged}개`);
  if (reports.length === 0) {
    console.log("업로드할 변경사항이 없습니다.");
    return;
  }
  if (args.dryRun) {
    for (const r of reports) console.log(`  [dry-run] ${r.fileName}`);
    return;
  }

  const totals = { created: 0, updated: 0, skipped: 0 };
  const newState = { ...loadState() };
  for (let i = 0; i < reports.length; i += BATCH_SIZE) {
    const batch = reports.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${config.apiUrl}/api/sync/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify({ reports: batch }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`! 업로드 실패 (HTTP ${res.status}): ${text.slice(0, 300)}`);
      process.exit(1);
    }
    const result = await res.json();
    totals.created += result.created;
    totals.updated += result.updated;
    totals.skipped += result.skipped;
    for (const err of result.errors ?? []) console.error(`  ! ${err}`);
    for (const r of batch) newState[r.fileName] = r.contentHash;
    fs.writeFileSync(STATE_PATH, JSON.stringify(newState, null, 2));
  }

  console.log(
    `완료: 생성 ${totals.created} / 갱신 ${totals.updated} / 서버 스킵 ${totals.skipped}`
  );
}

main().catch((e) => {
  console.error(`! 오류: ${e.message}`);
  process.exit(1);
});
