import type { AppState, EvidenceCard, DailyEntry, CoachInsight } from "./index";

const day = 24 * 60 * 60 * 1000;
const createdAt = new Date("2026-08-11T18:20:00+08:00").getTime();

export const sampleEntries: DailyEntry[] = [
  {
    id: "entry-retention",
    date: "2026-08-11",
    mode: "text",
    originalText: "今天分析了新用户首周流失，清洗了约2万条埋点数据，发现注册和首次创建任务之间掉得最多。",
    redactedText: "今天分析了新用户首周流失，清洗了约2万条埋点数据，发现注册和首次创建任务之间掉得最多。",
    followUps: [
      { question: "你的分析最后影响了什么？", answer: "两个流失节点被写入下周产品优化方案。" },
      { question: "你独立负责了哪部分？", answer: "独立完成SQL提取、清洗和初步结论汇报。" }
    ],
    createdAt,
    expiresAt: createdAt + 90 * day
  },
  {
    id: "entry-campaign",
    date: "2026-08-08",
    mode: "voice",
    originalText: "整理暑期活动三个渠道的数据并更新周报。",
    redactedText: "整理暑期活动三个渠道的数据并更新周报。",
    followUps: [{ question: "这项工作带来了什么可观察的结果？", answer: "自动化模板让每周整理时间从3小时降到2小时。" }],
    createdAt: createdAt - 3 * day,
    expiresAt: createdAt + 87 * day
  },
  {
    id: "entry-competitor",
    date: "2026-08-06",
    mode: "text",
    originalText: "做了5个竞品的新手引导对比，整理成PPT。",
    redactedText: "做了5个竞品的新手引导对比，整理成PPT。",
    followUps: [{ question: "结论被用于什么决策？", answer: "暂时还不知道。", skipped: true }],
    createdAt: createdAt - 5 * day,
    expiresAt: createdAt + 85 * day
  }
];

export const sampleEvidenceCards: EvidenceCard[] = [
  {
    id: "evidence-retention",
    title: "定位新用户关键流失节点",
    date: "2026-08-11",
    context: "运营团队发现新用户首周留存下降，需要定位问题环节。",
    actions: ["使用SQL提取并清洗约2万条埋点数据", "拆解注册至首次创建任务的转化漏斗", "向产品团队汇报两个主要流失节点"],
    tools: ["SQL", "Excel"],
    collaboration: "与产品经理、运营团队同步结论",
    output: "用户流失分析与优化建议",
    result: "两个流失节点进入下周产品优化方案",
    metrics: [{ label: "分析数据量", value: "约20,000条", confirmed: true }],
    competencyTags: ["数据分析", "问题定位", "跨团队沟通"],
    missingFields: [],
    sourceEntryIds: ["entry-retention"],
    sourceCleared: false,
    confirmed: true,
    score: 100
  },
  {
    id: "evidence-campaign",
    title: "优化渠道数据周报流程",
    date: "2026-08-08",
    context: "暑期活动需要每周汇总三个获客渠道表现。",
    actions: ["统一三个渠道的数据字段", "制作可复用的Excel周报模板"],
    tools: ["Excel"],
    collaboration: "与渠道运营核对口径",
    output: "标准化渠道周报模板",
    result: "周报整理耗时由3小时降至2小时",
    metrics: [{ label: "节省时间", value: "约33%", confirmed: false }],
    competencyTags: ["流程优化", "数据整理", "运营执行"],
    missingFields: ["确认效率提升比例"],
    sourceEntryIds: ["entry-campaign"],
    sourceCleared: false,
    confirmed: false,
    score: 80
  },
  {
    id: "evidence-competitor",
    title: "完成新手引导竞品分析",
    date: "2026-08-06",
    context: "团队希望了解同类产品的新用户引导方式。",
    actions: ["体验并对比5个同类产品", "按流程、文案和关键触点整理差异"],
    tools: ["PowerPoint"],
    collaboration: "向产品团队分享初步发现",
    output: "15页竞品分析PPT",
    result: "",
    metrics: [{ label: "竞品数量", value: "5个", confirmed: true }],
    competencyTags: ["竞品分析", "用户体验", "信息表达"],
    missingFields: ["结论如何影响决策"],
    sourceEntryIds: ["entry-competitor"],
    sourceCleared: false,
    confirmed: false,
    score: 76
  }
];

export const sampleCoachInsight: CoachInsight = {
  id: "coach-impact",
  period: "最近4周",
  observation: "你已经积累了多条数据整理与分析经历。",
  gap: "目前只有一条记录能证明分析影响了团队决策。",
  suggestedAction: "下周完成分析后，主动询问结论会如何被采用，并记录一次建议被采纳的过程。",
  evidenceCardIds: ["evidence-retention", "evidence-campaign"]
};

export function createInitialState(): AppState {
  return {
    version: 1,
    privacyAccepted: false,
    entries: sampleEntries.map((item) => ({ ...item, followUps: item.followUps.map((answer) => ({ ...answer })) })),
    evidenceCards: sampleEvidenceCards.map((item) => ({
      ...item,
      actions: [...item.actions],
      tools: [...item.tools],
      metrics: item.metrics.map((metric) => ({ ...metric })),
      competencyTags: [...item.competencyTags],
      missingFields: [...item.missingFields],
      sourceEntryIds: [...item.sourceEntryIds]
    })),
    artifacts: [],
    coachInsights: [{ ...sampleCoachInsight, evidenceCardIds: [...sampleCoachInsight.evidenceCardIds] }],
    settings: {
      reminderEnabled: true,
      reminderTime: "20:30",
      workdaysOnly: true,
      rawRetentionDays: 90,
      generationLanguage: "zh"
    }
  };
}

export function createEmptyState(): AppState {
  return {
    version: 1,
    privacyAccepted: false,
    entries: [],
    evidenceCards: [],
    artifacts: [],
    coachInsights: [],
    settings: {
      reminderEnabled: true,
      reminderTime: "20:30",
      workdaysOnly: true,
      rawRetentionDays: 90,
      generationLanguage: "zh"
    }
  };
}
