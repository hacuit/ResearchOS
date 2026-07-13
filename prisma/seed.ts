import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function day(offset: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

function monthDay(monthOffset: number, dayOfMonth: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() + monthOffset, dayOfMonth));
}

async function main() {
  // idempotent re-seed: wipe in FK-safe order
  await db.habitLog.deleteMany();
  await db.habit.deleteMany();
  await db.conditionLog.deleteMany();
  await db.planItem.deleteMany();
  await db.libraryItem.deleteMany();
  await db.paper.deleteMany();
  await db.idea.deleteMany();
  await db.researchLog.deleteMany();
  await db.milestone.deleteMany();
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.expenseItem.deleteMany();
  await db.recurringExpense.deleteMany();
  await db.tripReport.deleteMany();
  await db.proposalDoc.deleteMany();

  // ---------- Projects / Tasks / Milestones ----------
  const p1 = await db.project.create({
    data: {
      title: "온디바이스 LLM 경량화 연구",
      description: "모바일 환경을 위한 LLM 양자화 및 지식 증류 기법 연구",
      status: "IN_PROGRESS",
      color: "#4f46e5",
      startDate: monthDay(-3, 2),
      targetDate: monthDay(6, 28),
      tags: ["quantization", "distillation", "on-device"],
      sortOrder: 0,
      tasks: {
        create: [
          { title: "관련 논문 서베이 (양자화 최신 동향)", status: "DONE", priority: "HIGH", progress: 100, startDate: monthDay(-3, 2), dueDate: monthDay(-2, 15), sortOrder: 0 },
          { title: "베이스라인 모델 벤치마크 구축", status: "DONE", priority: "HIGH", progress: 100, startDate: monthDay(-2, 10), dueDate: monthDay(-1, 5), sortOrder: 1 },
          { title: "INT4 양자화 실험 및 성능 분석", status: "IN_PROGRESS", priority: "URGENT", progress: 65, startDate: monthDay(-1, 6), dueDate: day(10), sortOrder: 2 },
          { title: "지식 증류 파이프라인 구현", status: "IN_PROGRESS", priority: "HIGH", progress: 30, startDate: day(-14), dueDate: monthDay(1, 20), sortOrder: 3 },
          { title: "논문 초안 작성", status: "TODO", priority: "MEDIUM", progress: 0, startDate: monthDay(2, 1), dueDate: monthDay(3, 15), sortOrder: 4 },
        ],
      },
      milestones: {
        create: [
          { title: "중간 발표", kind: "발표", dueDate: monthDay(-1, 25), done: true },
          { title: "1차 실험 결과 정리", kind: "보고서", dueDate: day(14), done: false },
          { title: "학회 논문 제출 (NeurIPS)", kind: "논문", dueDate: monthDay(4, 15), done: false },
        ],
      },
    },
  });

  const p2 = await db.project.create({
    data: {
      title: "연합학습 프라이버시 보호 기법",
      description: "차분 프라이버시 기반 연합학습 프레임워크 개선",
      status: "IN_PROGRESS",
      color: "#8b5cf6",
      startDate: monthDay(-1, 5),
      targetDate: monthDay(8, 30),
      tags: ["federated-learning", "privacy"],
      sortOrder: 1,
      tasks: {
        create: [
          { title: "기존 프레임워크 코드 분석", status: "DONE", priority: "MEDIUM", progress: 100, startDate: monthDay(-1, 5), dueDate: day(-10), sortOrder: 0 },
          { title: "DP-SGD 노이즈 스케줄 실험", status: "IN_PROGRESS", priority: "HIGH", progress: 40, startDate: day(-7), dueDate: day(21), sortOrder: 1 },
          { title: "통신 효율 최적화 방안 조사", status: "TODO", priority: "LOW", progress: 0, dueDate: monthDay(2, 10), sortOrder: 2 },
        ],
      },
      milestones: {
        create: [
          { title: "프로토타입 구현", kind: "프로토타입", dueDate: monthDay(2, 28), done: false },
        ],
      },
    },
  });

  const p3 = await db.project.create({
    data: {
      title: "멀티모달 센서 융합 사이드 프로젝트",
      description: "IMU + 카메라 융합 기반 행동 인식",
      status: "ON_HOLD",
      color: "#a5b4fc",
      startDate: monthDay(-5, 10),
      targetDate: monthDay(3, 30),
      tags: ["multimodal", "sensor"],
      sortOrder: 2,
      tasks: {
        create: [
          { title: "데이터셋 수집 및 전처리", status: "DONE", priority: "MEDIUM", progress: 100, startDate: monthDay(-5, 10), dueDate: monthDay(-4, 1), sortOrder: 0 },
          { title: "융합 모델 아키텍처 설계", status: "ON_HOLD", priority: "MEDIUM", progress: 20, dueDate: monthDay(-2, 15), sortOrder: 1 },
        ],
      },
    },
  });

  // ---------- Research logs (3 weeks of daily reports) ----------
  const logBodies = [
    "## 오늘 한 일\n- INT4 양자화 커널 디버깅\n- perplexity 측정 스크립트 정리\n\n## 이슈\n- 특정 레이어에서 오버플로우 발생, clipping 범위 조정 필요\n\n## 내일 할 일\n- GPTQ 비교 실험 시작",
    "## 오늘 한 일\n- GPTQ vs AWQ 비교 실험 (3개 모델)\n- 실험 결과 시트 업데이트\n\n## 메모\n- AWQ가 소형 모델에서 일관되게 우세",
    "## 오늘 한 일\n- 지식 증류 teacher 모델 학습 시작\n- 서버 GPU 스케줄 조정\n\n## 이슈\n- A100 노드 대기열 길어짐, 실험 우선순위 재조정",
    "## 오늘 한 일\n- DP-SGD 노이즈 스케줄 1차 실험\n- 관련 논문 2편 리뷰\n\n## 내일 할 일\n- epsilon 값별 정확도 곡선 정리",
    "## 오늘 한 일\n- 중간 발표 자료 준비\n- 벤치마크 표 정리\n\n## 메모\n- 발표 피드백: 실험 셋업 설명 보강 필요",
  ];
  for (let i = 0; i < 21; i++) {
    const d = day(-i);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // weekdays only
    const dateStr = d.toISOString().slice(0, 10);
    await db.researchLog.create({
      data: {
        projectId: i % 3 === 0 ? p2.id : p1.id,
        date: d,
        title: `Daily Report ${dateStr}`,
        bodyMd: logBodies[i % logBodies.length],
        source: "sync",
        sourceFile: `Daily_Report_${dateStr}.md`,
        contentHash: `seed-${dateStr}`,
      },
    });
  }
  await db.researchLog.create({
    data: {
      projectId: p1.id,
      date: day(-1),
      title: "양자화 실험 아이디어 메모",
      bodyMd: "레이어별 mixed-precision 적용 시 민감도 기반 자동 비트 할당 방식을 시도해볼 것.\n\n- Hessian 기반 민감도 측정\n- 온도 스케일링과의 상호작용 확인",
      source: "manual",
    },
  });

  // ---------- Ideas ----------
  await db.idea.createMany({
    data: [
      { title: "LoRA 어댑터 양자화 민감도 분석", body: "어댑터만 고정밀로 유지하고 백본을 극단적으로 양자화하면 어떨까? 메모리-성능 트레이드오프 곡선을 그려보자.", status: "EXPLORING", tags: ["quantization", "lora"] },
      { title: "연구실 GPU 사용량 대시보드", body: "slurm 로그를 파싱해서 주간 사용률 리포트 자동화.", status: "EXPLORING", tags: ["tooling"] },
      { title: "센서 데이터 자기지도 사전학습", body: "IMU 시계열에 masked autoencoder 적용. 사이드 프로젝트 재개 시 검토.", status: "ON_HOLD", tags: ["multimodal", "ssl"] },
      { title: "양자화 인식 증류 (QAD)", body: "증류 과정에서 student의 양자화를 미리 시뮬레이션. → 온디바이스 LLM 프로젝트에 편입됨.", status: "PROMOTED", tags: ["quantization", "distillation"], promotedProjectId: p1.id },
      { title: "프롬프트 압축 벤치마크", body: "기존 벤치마크가 이미 포화 상태라 novelty 부족.", status: "DISCARDED", tags: ["llm"] },
    ],
  });

  // ---------- Papers ----------
  await db.paper.createMany({
    data: [
      { title: "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers", authors: "Frantar et al.", venue: "ICLR", year: 2023, url: "https://arxiv.org/abs/2210.17323", status: "DONE", rating: 5, tags: ["quantization"], category: "양자화", summaryMd: "**핵심**: 2차 정보(Hessian) 기반 레이어별 가중치 양자화. 3-4bit에서도 성능 유지.\n\n**의의**: PTQ의 사실상 표준. 우리 베이스라인으로 사용." },
      { title: "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration", authors: "Lin et al.", venue: "MLSys", year: 2024, url: "https://arxiv.org/abs/2306.00978", status: "DONE", rating: 5, tags: ["quantization"], category: "양자화", summaryMd: "활성값 분포 기반으로 중요 채널을 보호하는 양자화. 소형 모델에서 GPTQ보다 안정적." },
      { title: "Distilling the Knowledge in a Neural Network", authors: "Hinton et al.", venue: "NeurIPS Workshop", year: 2015, url: "https://arxiv.org/abs/1503.02531", status: "DONE", rating: 4, tags: ["distillation"], category: "증류", summaryMd: "지식 증류의 시조. soft target + temperature." },
      { title: "SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models", authors: "Xiao et al.", venue: "ICML", year: 2023, url: "https://arxiv.org/abs/2211.10438", status: "READING", rating: null, tags: ["quantization"], category: "양자화", notes: "활성값 outlier를 가중치로 이전하는 아이디어. 우리 세팅에 적용 가능한지 확인 중." },
      { title: "The Era of 1-bit LLMs: All Large Language Models are in 1.58 Bits", authors: "Ma et al.", venue: "arXiv", year: 2024, url: "https://arxiv.org/abs/2402.17764", status: "TO_READ", tags: ["quantization", "extreme"], category: "양자화" },
      { title: "Communication-Efficient Learning of Deep Networks from Decentralized Data", authors: "McMahan et al.", venue: "AISTATS", year: 2017, url: "https://arxiv.org/abs/1602.05629", status: "SKIMMED", rating: 4, tags: ["federated-learning"], category: "연합학습", notes: "FedAvg 원 논문. 배경 지식용." },
      { title: "Deep Learning with Differential Privacy", authors: "Abadi et al.", venue: "CCS", year: 2016, url: "https://arxiv.org/abs/1607.00133", status: "READING", tags: ["privacy", "dp"], category: "연합학습", notes: "DP-SGD 원 논문. moments accountant 부분 정독 필요." },
    ],
  });

  // ---------- Library ----------
  await db.libraryItem.createMany({
    data: [
      { title: "Papers with Code - Quantization", url: "https://paperswithcode.com/task/quantization", category: "리서치", tags: ["quantization"], pinned: true },
      { title: "lm-evaluation-harness", url: "https://github.com/EleutherAI/lm-evaluation-harness", snippet: "LLM 벤치마크 표준 도구. --tasks 옵션으로 태스크 선택.", category: "도구", tags: ["benchmark"], pinned: true },
      { title: "연구실 서버 예약 시트", url: "https://docs.google.com/spreadsheets/example", category: "연구실", tags: ["gpu"] },
      { title: "NeurIPS 2026 CFP", url: "https://neurips.cc/Conferences/2026/CallForPapers", snippet: "Abstract 마감 5월, Full paper 마감 5월 말 예상", category: "학회", tags: ["deadline"], pinned: true },
      { title: "CUDA 커널 프로파일링 치트시트", snippet: "nsys profile -o out ./run.sh\nncu --set full --kernel-name regex:gemm ./bin\n메모리 바운드 판단: SM 활용률 < 40% && DRAM 처리량 > 70%", category: "도구", tags: ["cuda", "profiling"] },
      { title: "장학금/연구비 규정 모음", url: "https://example.university.ac.kr/rules", category: "행정", tags: ["행정"] },
    ],
  });

  // ---------- Planner ----------
  await db.planItem.createMany({
    data: [
      { title: "랩미팅 발표 준비", kind: "TODO", date: day(1), priority: "HIGH", done: false, progress: 40 },
      { title: "랩미팅", kind: "EVENT", date: day(2), priority: "MEDIUM", done: false },
      { title: "INT4 실험 결과 정리", kind: "TODO", date: day(3), priority: "URGENT", done: false, progress: 10 },
      { title: "지도교수 면담", kind: "EVENT", date: day(4), priority: "HIGH", done: false, notes: "실험 방향 논의" },
      { title: "논문 리뷰 2편 (SmoothQuant, DP 논문)", kind: "TODO", date: day(5), priority: "MEDIUM", done: false },
      { title: "서버 백업 확인", kind: "TODO", date: day(-1), priority: "LOW", done: true, progress: 100 },
      { title: "주간 보고서 작성", kind: "TODO", date: day(-2), priority: "MEDIUM", done: true, progress: 100 },
      { title: "출장 정산 서류 제출", kind: "TODO", date: day(7), priority: "HIGH", done: false },
      { title: "GPU 서버 정기 점검", kind: "EVENT", date: day(10), priority: "LOW", done: false },
    ],
  });

  // ---------- Routine: condition logs (3 weeks) ----------
  for (let i = 0; i < 21; i++) {
    const base = 3 + Math.sin(i / 3) * 1.2;
    await db.conditionLog.create({
      data: {
        date: day(-i),
        mood: Math.max(1, Math.min(5, Math.round(base + ((i * 7) % 3) - 1))),
        energy: Math.max(1, Math.min(5, Math.round(base + ((i * 5) % 3) - 1))),
        sleepHours: Math.round((6 + ((i * 3) % 5) * 0.5) * 10) / 10,
        sleepQuality: Math.max(1, Math.min(5, Math.round(base))),
        note: i === 0 ? "실험 잘 풀려서 컨디션 좋음" : null,
      },
    });
  }

  // ---------- Habits ----------
  const habits = await Promise.all([
    db.habit.create({ data: { name: "논문 1편 읽기", icon: "book", daysOfWeek: [1, 2, 3, 4, 5], sortOrder: 0 } }),
    db.habit.create({ data: { name: "운동 30분", icon: "dumbbell", daysOfWeek: [], sortOrder: 1 } }),
    db.habit.create({ data: { name: "연구일지 작성", icon: "pen", daysOfWeek: [1, 2, 3, 4, 5], sortOrder: 2 } }),
    db.habit.create({ data: { name: "7시간 이상 수면", icon: "moon", daysOfWeek: [], sortOrder: 3 } }),
  ]);
  for (let i = 0; i < 21; i++) {
    for (const [idx, habit] of habits.entries()) {
      // pseudo-random but deterministic completion pattern (~70%)
      if ((i * 31 + idx * 17) % 10 < 7) {
        await db.habitLog.create({ data: { habitId: habit.id, date: day(-i), done: true } });
      }
    }
  }

  // ---------- Docs: expenses ----------
  const claude = await db.recurringExpense.create({
    data: { item: "Claude Code 구독", amount: 30000, category: "SW 구독", vendor: "Anthropic", dayOfMonth: 5, active: true },
  });
  const gpu = await db.recurringExpense.create({
    data: { item: "클라우드 GPU 크레딧", amount: 150000, category: "클라우드", vendor: "AWS", dayOfMonth: 1, active: true },
  });
  await db.expenseItem.createMany({
    data: [
      { date: monthDay(0, 1), item: "클라우드 GPU 크레딧", amount: 150000, category: "클라우드", vendor: "AWS", receiptFiled: true, recurringId: gpu.id },
      { date: monthDay(0, 5), item: "Claude Code 구독", amount: 30000, category: "SW 구독", vendor: "Anthropic", receiptFiled: true, recurringId: claude.id },
      { date: monthDay(0, 8), item: "실험용 SSD 2TB", amount: 189000, category: "장비", vendor: "쿠팡", receiptFiled: false },
      { date: monthDay(0, 10), item: "학회 사전등록비", amount: 450000, category: "학회", vendor: "NeurIPS", receiptFiled: false, note: "환율 기준일 확인 필요" },
      { date: monthDay(-1, 5), item: "Claude Code 구독", amount: 30000, category: "SW 구독", vendor: "Anthropic", receiptFiled: true, recurringId: claude.id },
      { date: monthDay(-1, 1), item: "클라우드 GPU 크레딧", amount: 150000, category: "클라우드", vendor: "AWS", receiptFiled: true, recurringId: gpu.id },
      { date: monthDay(-1, 18), item: "도서 (통계적 학습 이론)", amount: 52000, category: "도서", vendor: "교보문고", receiptFiled: true },
    ],
  });

  // ---------- Docs: trips & proposals ----------
  await db.tripReport.create({
    data: {
      title: "국내 학회 참석 (한국정보과학회)",
      destination: "부산 BEXCO",
      startDate: monthDay(-1, 20),
      endDate: monthDay(-1, 22),
      purpose: "논문 발표 및 최신 연구 동향 조사",
      outcomesMd: "## 주요 성과\n- 포스터 발표 1건 완료, 질의 5건 대응\n- 양자화 관련 세션 3개 청취\n- 타 연구실 2곳과 협력 논의 시작\n\n## 후속 조치\n- 협력 논의 이메일 발송\n- 발표 피드백 반영하여 실험 추가",
      expenses: 385000,
    },
  });
  await db.proposalDoc.createMany({
    data: [
      {
        title: "차세대 온디바이스 AI 원천기술 개발",
        agency: "한국연구재단",
        program: "신진연구자지원사업",
        deadline: monthDay(2, 15),
        budget: "연 1.5억 x 3년",
        durationMonths: 36,
        abstractMd: "모바일·엣지 환경에서 대규모 언어모델을 실시간 구동하기 위한 초경량화 원천기술 개발. 양자화-증류 통합 프레임워크와 하드웨어 인지형 최적화를 통해 기존 대비 10배 이상의 효율 개선을 목표로 함.",
        status: "draft",
      },
      {
        title: "프라이버시 보존 분산학습 플랫폼",
        agency: "IITP",
        program: "정보통신방송기술개발",
        deadline: monthDay(1, 30),
        budget: "연 3억 x 2년 (공동)",
        durationMonths: 24,
        abstractMd: "의료 데이터 활용을 위한 차분 프라이버시 기반 연합학습 플랫폼 구축.",
        status: "submitted",
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
