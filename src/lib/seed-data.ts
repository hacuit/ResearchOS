import type { PrismaClient } from "@prisma/client";

function day(offset: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

/** Date in the seed's reference year (2026). */
function ymd(month: number, dayOfMonth: number, year = 2026): Date {
  return new Date(Date.UTC(year, month - 1, dayOfMonth));
}

/** Wipes all data and inserts the 2026 research-plan sample dataset. */
export async function runSeed(db: PrismaClient) {
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

  // ---------- Projects / Tasks / Milestones (2026 연구 계획) ----------
  const p1 = await db.project.create({
    data: {
      title: "Timing-Aware MLSD Calibration Linked with CDR Dynamics",
      description:
        "CDR 동특성과 연동되는 타이밍 인지형 MLSD 캘리브레이션 기법. Duo-MLSD 구조의 RTL 구현과 FPGA 검증, 연말 테이프아웃까지가 올해 목표.",
      status: "IN_PROGRESS",
      color: "#4f46e5",
      startDate: ymd(1, 5),
      targetDate: ymd(12, 20),
      tags: ["MLSD", "CDR", "SerDes"],
      sortOrder: 0,
      tasks: {
        create: [
          { title: "Duo-MLSD Matlab 시뮬레이션", status: "DONE", priority: "URGENT", progress: 100, startDate: ymd(1, 5), dueDate: ymd(2, 28), sortOrder: 0 },
          { title: "Duo-MLSD RTL 설계", status: "IN_PROGRESS", priority: "URGENT", progress: 75, startDate: ymd(2, 10), dueDate: ymd(7, 31), sortOrder: 1 },
          { title: "제안 기법 검증 (behavioral + RTL 교차검증)", status: "IN_PROGRESS", priority: "HIGH", progress: 40, startDate: ymd(4, 1), dueDate: ymd(8, 15), sortOrder: 2 },
          { title: "FPGA 프로토타이핑", status: "TODO", priority: "HIGH", progress: 0, startDate: ymd(8, 1), dueDate: ymd(9, 30), sortOrder: 3 },
          { title: "테이프아웃", status: "TODO", priority: "MEDIUM", progress: 0, startDate: ymd(10, 1), dueDate: ymd(11, 30), sortOrder: 4 },
        ],
      },
      milestones: {
        create: [
          { title: "Parallelized MLSD RTL", kind: "RTL", dueDate: ymd(3, 31), done: true },
          { title: "제안 MLSD 검증 완료", kind: "Verification", dueDate: ymd(8, 15), done: false },
          { title: "ISCAS 논문 제출", kind: "논문", dueDate: ymd(9, 30), done: false },
          { title: "메인 논문 제출", kind: "논문", dueDate: ymd(11, 30), done: false },
        ],
      },
    },
  });

  const p2 = await db.project.create({
    data: {
      title: "Per-Phase MLSD Adaptation for Time-Interleaved RX",
      description:
        "타임 인터리브 수신기에서 위상별 특성 편차를 반영하는 per-phase MLSD 적응 기법. RX 시스템 시뮬레이션과 TRX 논문 리뷰를 병행.",
      status: "IN_PROGRESS",
      color: "#8b5cf6",
      startDate: ymd(2, 2),
      targetDate: ymd(10, 30),
      tags: ["MLSD", "time-interleaved", "adaptation"],
      sortOrder: 1,
      tasks: {
        create: [
          { title: "TRX 시스템 논문 리뷰 (연중)", status: "IN_PROGRESS", priority: "MEDIUM", progress: 55, startDate: ymd(1, 5), dueDate: ymd(12, 20), sortOrder: 0 },
          { title: "RX 시스템 시뮬레이션", status: "IN_PROGRESS", priority: "HIGH", progress: 50, startDate: ymd(1, 12), dueDate: ymd(9, 30), sortOrder: 1 },
          { title: "위상별 적응 알고리즘 정식화", status: "TODO", priority: "HIGH", progress: 0, startDate: ymd(8, 1), dueDate: ymd(10, 15), sortOrder: 2 },
        ],
      },
      milestones: {
        create: [
          { title: "RX 시뮬레이션 프레임워크 v1", kind: "Prototype", dueDate: ymd(6, 30), done: true },
        ],
      },
    },
  });

  const p3 = await db.project.create({
    data: {
      title: "FEC-Aware MLSD Optimization via Error-Pattern Shaping",
      description:
        "FEC(KP4 RS-FEC) 디코더 특성을 고려해 MLSD의 에러 패턴을 성형하는 최적화 연구. FEC 기초 스터디 후 behavioral 모델링 진행 중.",
      status: "IN_PROGRESS",
      color: "#0ea5e9",
      startDate: ymd(2, 16),
      targetDate: ymd(9, 30),
      tags: ["MLSD", "FEC", "error-shaping"],
      sortOrder: 2,
      tasks: {
        create: [
          { title: "FEC 기초 스터디 (RS-FEC, KP4)", status: "DONE", priority: "HIGH", progress: 100, startDate: ymd(1, 12), dueDate: ymd(3, 31), sortOrder: 0 },
          { title: "MLSD-FEC behavioral 모델링", status: "IN_PROGRESS", priority: "URGENT", progress: 60, startDate: ymd(3, 15), dueDate: ymd(8, 31), sortOrder: 1 },
          { title: "에러 패턴 통계 분석", status: "IN_PROGRESS", priority: "MEDIUM", progress: 30, startDate: ymd(6, 1), dueDate: ymd(9, 15), sortOrder: 2 },
        ],
      },
      milestones: {
        create: [
          { title: "FEC behavioral 모델", kind: "Prototype", dueDate: ymd(3, 31), done: true },
          { title: "FEC-MLSD 통합 프로토타입", kind: "Prototype", dueDate: ymd(9, 30), done: false },
        ],
      },
    },
  });

  await db.project.create({
    data: {
      title: "On-Device Robot AI Optimization",
      description:
        "로봇 인터페이스용 온디바이스 AI 경량화 사이드 프로젝트. 서베이 완료 후 아이디어 구체화 단계에서 잠시 보류.",
      status: "ON_HOLD",
      color: "#f59e0b",
      startDate: ymd(1, 5),
      targetDate: ymd(12, 20),
      tags: ["robot", "on-device", "side-project"],
      sortOrder: 3,
      tasks: {
        create: [
          { title: "로봇 인터페이스 서베이", status: "DONE", priority: "MEDIUM", progress: 100, startDate: ymd(1, 5), dueDate: ymd(3, 31), sortOrder: 0 },
          { title: "아이디어 구체화", status: "ON_HOLD", priority: "LOW", progress: 25, startDate: ymd(3, 15), dueDate: ymd(6, 30), sortOrder: 1 },
        ],
      },
      milestones: {
        create: [
          { title: "서베이 리포트", kind: "Report", dueDate: ymd(3, 31), done: true },
          { title: "RA-L 논문", kind: "논문", dueDate: ymd(6, 30), done: false },
        ],
      },
    },
  });

  // ---------- Research logs (최근 3주 일일보고서) ----------
  const logBodies = [
    "## 오늘 한 일\n- Duo-MLSD RTL: 브랜치 메트릭 유닛 파이프라이닝 수정\n- 합성 타이밍 리포트 확인 (setup slack -12ps → +8ps)\n\n## 이슈\n- 인터리브 경계에서 survivor path 병합 버그 의심, 파형 덤프 분석 필요\n\n## 내일 할 일\n- survivor memory 트레이스백 로직 재검토",
    "## 오늘 한 일\n- RX 시스템 시뮬레이션: CTLE + FFE 조합 스윕 돌림 (32케이스)\n- per-phase offset이 BER에 미치는 영향 정리\n\n## 메모\n- 위상별 gain mismatch 1dB 이상이면 MLSD 이득이 눈에 띄게 감소",
    "## 오늘 한 일\n- FEC behavioral 모델: KP4 RS(544,514) 심볼 에러 카운팅 검증\n- MLSD 출력 에러 버스트 길이 히스토그램 추출\n\n## 내일 할 일\n- 버스트 길이별 post-FEC BER 매핑 테이블 생성",
    "## 오늘 한 일\n- CDR 루프 대역폭 변화에 따른 MLSD 캘리브레이션 수렴 시간 측정\n- 랩미팅 발표자료 초안 작성\n\n## 이슈\n- 저대역폭 설정에서 수렴 시간이 목표 대비 2배 초과",
    "## 오늘 한 일\n- ISCAS 논문 아웃라인 작성\n- Duo-MLSD 결과 그림 3종 초안\n\n## 메모\n- 비교 대상: conventional MLSD, 2-tap DFE 기준선 추가하기로",
  ];
  for (let i = 0; i < 21; i++) {
    const d = day(-i);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // weekdays only
    const dateStr = d.toISOString().slice(0, 10);
    await db.researchLog.create({
      data: {
        projectId: [p1.id, p2.id, p3.id][i % 3],
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
      title: "CDR-MLSD 공동 적응 아이디어 메모",
      bodyMd:
        "CDR 위상 오차 신호를 MLSD 브랜치 메트릭 가중치에 직접 반영하면 별도 캘리브레이션 루프 없이도 타이밍 드리프트를 따라갈 수 있지 않을까.\n\n- 루프 안정성 조건 먼저 유도\n- behavioral 모델에서 위상 스텝 응답 실험",
      source: "manual",
    },
  });

  // ---------- Ideas ----------
  await db.idea.createMany({
    data: [
      { title: "CDR 위상오차 기반 MLSD 메트릭 가중", body: "CDR 루프의 위상 오차 신호를 MLSD 브랜치 메트릭에 실시간 반영. 별도 캘리브레이션 루프 제거 가능성.", status: "EXPLORING", tags: ["MLSD", "CDR"] },
      { title: "MLSD survivor depth 적응 제어", body: "채널 ISI 길이 추정에 따라 트레이스백 깊이를 동적으로 줄여 전력 절감. 저손실 채널에서 30% 이상 절감 예상.", status: "EXPLORING", tags: ["MLSD", "low-power"] },
      { title: "FEC-Aware MLSD (에러 패턴 성형)", body: "KP4 FEC가 버스트 에러에 강한 점을 역이용해 MLSD 에러를 버스트로 몰아주는 방향. → 정식 프로젝트로 승격됨.", status: "PROMOTED", tags: ["MLSD", "FEC"], promotedProjectId: p3.id },
      { title: "로봇 관절 제어용 경량 추론 파이프라인", body: "서베이는 끝났고 회로 쪽 메인 과제 일정상 하반기까지 보류.", status: "ON_HOLD", tags: ["robot", "on-device"] },
      { title: "ADC 비선형성 보상 NN 등화기", body: "관련 연구가 이미 포화 상태. ISSCC 2026 세션에서도 유사 작업 다수 확인되어 폐기.", status: "DISCARDED", tags: ["ADC", "NN-EQ"] },
    ],
  });

  // ---------- Papers ----------
  await db.paper.createMany({
    data: [
      { title: "A 112-Gb/s PAM-4 ADC-Based Receiver with MLSD in 7-nm FinFET", authors: "ISSCC 발표 논문", venue: "ISSCC", year: 2024, url: "https://ieeexplore.ieee.org", status: "DONE", rating: 5, tags: ["MLSD", "ADC-based"], category: "SerDes RX", summaryMd: "**핵심**: ADC 기반 수신단에서 1-tap MLSD로 DFE 대비 BER 마진 확보.\n\n**우리 연구와의 관계**: Duo-MLSD 비교 기준선. 타이밍 캘리브레이션은 별도 루프로 처리 — 우리가 파고들 틈." },
      { title: "Maximum Likelihood Sequence Estimation for High-Speed Wireline Links (튜토리얼)", authors: "A. Sheikholeslami", venue: "ISSCC Tutorial", year: 2023, status: "DONE", rating: 5, tags: ["MLSD", "tutorial"], category: "SerDes RX", summaryMd: "MLSD 기초부터 구현 트레이드오프까지. 토론토 방문 논의의 베이스라인 자료." },
      { title: "A 224-Gb/s PAM-4 Transceiver in 3-nm with FEC-Aware Equalization", authors: "JSSC 논문", venue: "JSSC", year: 2025, url: "https://ieeexplore.ieee.org", status: "READING", tags: ["FEC", "224G"], category: "SerDes RX", notes: "FEC-aware 등화라는 표현을 쓰지만 실제로는 pre-FEC BER 최적화. 우리 error-pattern shaping과 차별점 정리 필요." },
      { title: "Clock and Data Recovery Circuits for Multi-Standard SerDes", authors: "리뷰 논문", venue: "TCAS-I", year: 2022, status: "SKIMMED", rating: 3, tags: ["CDR"], category: "CDR", notes: "CDR 루프 대역폭 설계 관행 파트만 참고." },
      { title: "Reed-Solomon FEC (KP4) Performance over Burst-Error Channels", authors: "OIF 기고", venue: "OIF", year: 2021, status: "DONE", rating: 4, tags: ["FEC", "KP4"], category: "FEC", summaryMd: "KP4 RS(544,514)의 버스트 에러 허용 특성 정량화. error-pattern shaping의 이론적 근거." },
      { title: "Time-Interleaved ADC Calibration Techniques: A Survey", authors: "서베이 논문", venue: "TCAS-II", year: 2023, status: "READING", tags: ["time-interleaved", "calibration"], category: "ADC", notes: "per-phase mismatch 종류별 캘리브레이션 분류 참고 중." },
      { title: "Lightweight Neural Inference on Robot MCUs: A Survey", authors: "서베이 논문", venue: "RA-L", year: 2024, status: "TO_READ", tags: ["robot", "on-device"], category: "Robot AI" },
    ],
  });

  // ---------- Library ----------
  await db.libraryItem.createMany({
    data: [
      { title: "ISSCC 2027 저자 안내 (마감 9월 초)", url: "https://www.isscc.org/authors", category: "학회", tags: ["deadline", "ISSCC"], pinned: true },
      { title: "IEEE Xplore - JSSC 최신호", url: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=4", category: "리서치", tags: ["JSSC"] },
      { title: "연구실 서버 EDA 라이선스 현황판", url: "https://docs.google.com/spreadsheets/example", category: "연구실", tags: ["EDA"], pinned: true },
      { title: "SystemVerilog 랜덤 검증 치트시트", snippet: "constraint 안에서 dist 가중치:\nx dist {0:=60, [1:7]:/40};\ncovergroup은 posedge 말고 샘플 이벤트로 트리거할 것.", category: "도구", tags: ["SV", "verification"] },
      { title: "Matlab-Python 시뮬레이션 브리지 스니펫", snippet: "matlab.engine 대신 .mat 덤프 + scipy.io.loadmat이 클러스터에서 안정적.", category: "도구", tags: ["matlab", "sim"] },
      { title: "출장 정산 규정 요약 (학교 행정)", url: "https://example.university.ac.kr/rules", category: "행정", tags: ["출장", "정산"] },
      { title: "A-SSCC 2026 CFP", url: "https://www.a-sscc.org", snippet: "제출 마감 5월, 개최 11월 (예정). 국내 개최 여부 확인.", category: "학회", tags: ["deadline", "A-SSCC"] },
    ],
  });

  // ---------- Planner ----------
  await db.planItem.createMany({
    data: [
      { title: "랩미팅 발표자료 마무리", kind: "TODO", date: day(1), priority: "HIGH", done: false, progress: 60 },
      { title: "랩미팅", kind: "EVENT", date: day(2), priority: "MEDIUM", done: false },
      { title: "Duo-MLSD RTL 코드리뷰 반영", kind: "TODO", date: day(3), priority: "URGENT", done: false, progress: 20 },
      { title: "지도교수 면담 (테이프아웃 일정)", kind: "EVENT", date: day(4), priority: "HIGH", done: false, notes: "MPW 셔틀 일정 확정 논의" },
      { title: "ISCAS 논문 아웃라인 리뷰", kind: "TODO", date: day(5), priority: "MEDIUM", done: false },
      { title: "시뮬레이션 서버 스토리지 정리", kind: "TODO", date: day(-1), priority: "LOW", done: true, progress: 100 },
      { title: "주간 보고서 작성", kind: "TODO", date: day(-2), priority: "MEDIUM", done: true, progress: 100 },
      { title: "스위스 공동연구 후속 화상미팅", kind: "EVENT", date: day(7), priority: "HIGH", done: false, notes: "로잔 팀과 측정 셋업 논의" },
      { title: "FPGA 보드 발주", kind: "TODO", date: day(9), priority: "HIGH", done: false },
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
        note: i === 0 ? "RTL 버그 잡혀서 컨디션 좋음" : null,
      },
    });
  }

  // ---------- Habits (색상 + 이모지) ----------
  const habits = await Promise.all([
    db.habit.create({ data: { name: "기상 7시", icon: "⏰", color: "#93c5fd", daysOfWeek: [], sortOrder: 0 } }),
    db.habit.create({ data: { name: "논문 1편 읽기", icon: "📖", color: "#c4b5fd", daysOfWeek: [1, 2, 3, 4, 5], sortOrder: 1 } }),
    db.habit.create({ data: { name: "연구일지 작성", icon: "✍️", color: "#fdba74", daysOfWeek: [1, 2, 3, 4, 5], sortOrder: 2 } }),
    db.habit.create({ data: { name: "운동 30분", icon: "💪", color: "#86efac", daysOfWeek: [], sortOrder: 3 } }),
    db.habit.create({ data: { name: "7시간 이상 수면", icon: "🌙", color: "#f9a8d4", daysOfWeek: [], sortOrder: 4 } }),
  ]);
  for (let i = 0; i < 45; i++) {
    const d = day(-i);
    for (const [idx, habit] of habits.entries()) {
      const scheduled =
        habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(d.getUTCDay());
      // pseudo-random but deterministic completion pattern (~72%)
      if (scheduled && (i * 31 + idx * 17) % 10 < 7.2) {
        await db.habitLog.create({ data: { habitId: habit.id, date: d, done: true } });
      }
    }
  }

  // ---------- Docs: expenses ----------
  const claude = await db.recurringExpense.create({
    data: { item: "Claude Code 구독", amount: 30000, category: "SW 구독", vendor: "Anthropic", dayOfMonth: 5, active: true },
  });
  const sim = await db.recurringExpense.create({
    data: { item: "시뮬레이션 클라우드 (합성/검증)", amount: 180000, category: "클라우드", vendor: "AWS", dayOfMonth: 1, active: true },
  });
  await db.expenseItem.createMany({
    data: [
      { date: day(-12), item: "시뮬레이션 클라우드 (합성/검증)", amount: 180000, category: "클라우드", vendor: "AWS", receiptFiled: true, recurringId: sim.id },
      { date: day(-8), item: "Claude Code 구독", amount: 30000, category: "SW 구독", vendor: "Anthropic", receiptFiled: true, recurringId: claude.id },
      { date: day(-5), item: "FPGA 개발보드 (VCU118 중고)", amount: 2450000, category: "장비", vendor: "장비몰", receiptFiled: false, note: "학과 장비심의 서류 별도" },
      { date: day(-3), item: "ISCAS 사전등록비", amount: 620000, category: "학회", vendor: "IEEE", receiptFiled: false, note: "환율 기준일 확인" },
      { date: day(-40), item: "Claude Code 구독", amount: 30000, category: "SW 구독", vendor: "Anthropic", receiptFiled: true, recurringId: claude.id },
      { date: day(-42), item: "시뮬레이션 클라우드 (합성/검증)", amount: 180000, category: "클라우드", vendor: "AWS", receiptFiled: true, recurringId: sim.id },
      { date: day(-35), item: "도서 (Digital Communications, Proakis)", amount: 78000, category: "도서", vendor: "교보문고", receiptFiled: true },
    ],
  });

  // ---------- Docs: trips & proposals ----------
  await db.tripReport.create({
    data: {
      title: "ISSCC 2026 학회 참석 (샌프란시스코)",
      destination: "미국 샌프란시스코",
      startDate: ymd(2, 15),
      endDate: ymd(2, 20),
      purpose: "ISSCC 2026 학회 참석 및 최신 SerDes/MLSD 연구 동향 조사",
      outcomesMd:
        "## 주요 성과\n- Plenary·technical session 및 student research preview 참석\n- 112G/224G 수신단 세션 집중 청취, MLSD 관련 발표 4건 정리\n- Univ. of Toronto Sheikholeslami 교수 등 연구자들과 교류\n\n## 후속 조치\n- 세션 노트 랩 세미나 공유\n- 토론토 그룹과 MLSD 캘리브레이션 주제 후속 논의",
      expenses: 4850000,
    },
  });
  await db.tripReport.create({
    data: {
      title: "스위스 공동연구 방문 (로잔·취리히)",
      destination: "스위스 로잔·취리히",
      startDate: ymd(3, 10),
      endDate: ymd(3, 16),
      purpose: "공동연구 킥오프 미팅 및 측정 인프라 협의",
      outcomesMd:
        "## 주요 성과\n- 로잔 팀과 FEC-MLSD 공동 실험 범위 합의\n- 취리히 랩 고속 측정 셋업 견학, 칩 측정 협력 가능성 확인\n\n## 후속 조치\n- 공동 실험 계획서 초안 작성 (7월)\n- 정기 화상미팅 격주 운영",
      expenses: 3620000,
    },
  });
  await db.proposalDoc.createMany({
    data: [
      {
        title: "차세대 초고속 유선 링크용 지능형 수신단 원천기술",
        agency: "한국연구재단",
        program: "신진연구자지원사업",
        deadline: day(45),
        budget: "연 1.5억 x 3년",
        durationMonths: 36,
        abstractMd:
          "224Gb/s급 유선 링크를 위한 타이밍 인지형 MLSD 수신단 원천기술 개발. CDR 동특성과 결합된 캘리브레이션, FEC 인지형 에러 성형을 통해 기존 대비 전력 효율과 BER 마진을 동시 개선.",
        status: "draft",
      },
      {
        title: "AI 기반 고속 인터커넥트 신호처리 플랫폼",
        agency: "IITP",
        program: "정보통신방송기술개발",
        deadline: day(17),
        budget: "연 3억 x 2년 (공동)",
        durationMonths: 24,
        abstractMd: "데이터센터 인터커넥트를 위한 학습 기반 등화·검출 통합 플랫폼 구축 (공동과제).",
        status: "submitted",
      },
    ],
  });

}
