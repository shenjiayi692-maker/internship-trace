import type {
  AiGateway,
  CoachInsight,
  DailyEntry,
  EvidenceCard,
  GeneratedArtifact,
  JobDescription,
  Language,
  RequirementMatch
} from "../../../packages/contracts/src/index";
import { matchRequirements, scoreEvidence } from "../../../packages/core/src/index";

const DEMO_JD = "产品运营实习生｜负责用户行为数据分析、活动运营与竞品研究；熟练使用 Excel，掌握 SQL；能够跨团队沟通并将分析结论转化为产品优化建议。";

export class MockAiGateway implements AiGateway {
  createFollowUps(text: string): string[] {
    const questions: string[] = [];
    if (!/影响|采用|结果|提升|降低|节省|进入/.test(text)) questions.push("这项工作最终被用于什么，带来了什么可观察的结果？");
    if (!/独立|负责|我|协作|和.+一起/.test(text)) questions.push("其中哪一部分是你独立负责的？");
    if (!/\d/.test(text) && questions.length < 2) questions.push("有没有可以确认的规模、数量或时间变化？");
    return questions.slice(0, 2);
  }

  createEvidence(entry: DailyEntry): EvidenceCard {
    const provided = entry.followUps.filter((item) => !item.skipped && item.answer.trim());
    const answers = provided.map((item) => item.answer);
    const text = [entry.redactedText, ...answers].join(" ");
    const hasMetric = /\d/.test(text);
    const resultAnswer = provided.find((item) => /结果|用于|影响|变化/.test(item.question));
    const contributionAnswer = provided.find((item) => /独立|负责/.test(item.question));
    const result = resultAnswer?.answer || "";
    const detectedTools = ["SQL", "Excel", "PowerPoint", "Python"].filter((tool) => text.toLowerCase().includes(tool.toLowerCase()));
    const hasCollaboration = /协作|团队|同步|汇报|产品经理|运营/.test(text);
    const output = text.includes("周报") ? "周报" : text.includes("PPT") ? "PPT" : text.includes("模板") ? "模板" : text.includes("分析") ? "分析结果" : "";
    const base: Omit<EvidenceCard, "score"> = {
      id: `evidence-${entry.createdAt}`,
      title: text.includes("流失") ? "分析用户流失并定位关键节点" : "完成当日重点工作并沉淀产出",
      date: entry.date,
      context: "",
      actions: [entry.redactedText, contributionAnswer?.answer || ""].filter(Boolean),
      tools: detectedTools,
      collaboration: hasCollaboration ? "记录中提到了团队协作或结论同步" : "",
      output,
      result,
      metrics: hasMetric ? [{ label: "记录中的量化信息", value: text.match(/(?:约)?\d+[万%条小时个]*/)?.[0] || "待确认", confirmed: false }] : [],
      competencyTags: text.includes("分析") ? ["数据分析", "问题定位"] : ["运营执行", "沟通协作"],
      missingFields: ["业务背景", !output ? "明确产出" : "", !result ? "工作结果" : "", hasMetric ? "确认量化口径" : "可量化信息"].filter(Boolean),
      sourceEntryIds: [entry.id],
      sourceCleared: false,
      confirmed: false
    };
    return { ...base, score: scoreEvidence(base) };
  }

  createWeekly(cards: EvidenceCard[], language: Language, tone: "formal" | "concise"): GeneratedArtifact {
    const selected = cards.slice(0, tone === "concise" ? 2 : 3);
    const zh = [
      "本周完成事项",
      ...selected.map((card, index) => `${index + 1}. ${card.title}：${card.result || card.output}`),
      "下周计划",
      "继续跟进分析结论的采用情况，并补充可量化结果。"
    ];
    const en = [
      "Weekly highlights",
      ...selected.map((card, index) => `${index + 1}. ${card.title}: ${card.result || card.output}`),
      "Next week",
      "Follow up on how the recommendations are adopted and confirm measurable outcomes."
    ];
    return {
      id: `weekly-${Date.now()}-${language}-${tone}`,
      kind: "weekly",
      language,
      title: language === "zh" ? "实习周报" : "Internship Weekly Update",
      content: language === "zh" ? zh : en,
      sourceEvidenceIds: selected.map((card) => card.id),
      riskFlags: selected.flatMap((card) => card.metrics.filter((metric) => !metric.confirmed).map((metric) => `“${metric.value}”需要确认口径`)),
      createdAt: Date.now()
    };
  }

  analyzeJob(rawText: string): JobDescription {
    const text = rawText.trim() || DEMO_JD;
    return {
      id: `job-${Date.now()}`,
      title: /产品/.test(text) ? "产品运营实习生" : "运营实习生",
      company: "目标公司",
      rawText: text,
      createdAt: Date.now(),
      requirements: [
        { id: "req-analysis", label: "数据分析与问题定位", keywords: ["数据分析", "SQL", "问题定位"], importance: "must" },
        { id: "req-operation", label: "活动与用户运营", keywords: ["活动", "运营", "渠道"], importance: "must" },
        { id: "req-collaboration", label: "跨团队沟通", keywords: ["跨团队", "沟通", "协作"], importance: "must" },
        { id: "req-research", label: "用户或竞品研究", keywords: ["竞品", "用户体验", "研究"], importance: "preferred" }
      ]
    };
  }

  matchJob(job: JobDescription, cards: EvidenceCard[]): RequirementMatch[] {
    return matchRequirements(job, cards);
  }

  createJobArtifacts(job: JobDescription, cards: EvidenceCard[], language: Language): GeneratedArtifact[] {
    const selected = cards.filter((card) => card.confirmed || card.score >= 75).slice(0, 2);
    const cvZh = selected.map((card) => toChineseBullet(card));
    const cvEn = selected.map((card) => toEnglishBullet(card));
    const interviewZh = selected.flatMap((card) => [
      `请介绍“${card.title}”的背景、目标和你的具体行动。`,
      card.metrics.length ? `${card.metrics[0].value}的口径是什么？你如何验证这个数字？` : `这项工作的结果如何衡量？为什么目前没有量化数据？`
    ]);
    const interviewEn = selected.flatMap((card) => [
      `Walk me through the context, goal, and your individual contribution to “${card.title}”.`,
      card.metrics.length ? `How was “${card.metrics[0].value}” defined and validated?` : "How did you measure the outcome, and why is no metric recorded yet?"
    ]);
    const common = {
      language,
      sourceEvidenceIds: selected.map((card) => card.id),
      createdAt: Date.now()
    };
    return [
      {
        ...common,
        id: `cv-${Date.now()}`,
        kind: "cv",
        title: language === "zh" ? `${job.title} · CV要点` : `${job.title} · CV bullets`,
        content: language === "zh" ? cvZh : cvEn,
        riskFlags: selected.flatMap((card) => card.metrics.filter((metric) => !metric.confirmed).map((metric) => `“${metric.value}”尚未确认，不应作为确定结果`))
      },
      {
        ...common,
        id: `interview-${Date.now()}`,
        kind: "interview",
        title: language === "zh" ? "针对性面试准备" : "Evidence-based interview prep",
        content: language === "zh" ? interviewZh : interviewEn,
        riskFlags: selected.length ? ["回答时需区分个人贡献与团队贡献"] : ["当前没有可用于面试准备的证据卡"]
      }
    ];
  }

  createCoachInsight(cards: EvidenceCard[]): CoachInsight {
    return {
      id: `coach-${Date.now()}`,
      period: "最近4周",
      observation: `你已沉淀 ${cards.length} 条职业证据，数据分析能力最突出。`,
      gap: "影响决策的结果证据仍然偏少。",
      suggestedAction: "下次完成分析后，主动询问结论会如何被采用，并记录后续变化。",
      evidenceCardIds: cards.slice(0, 2).map((card) => card.id)
    };
  }
}

function toChineseBullet(card: EvidenceCard): string {
  const action = card.actions.join("；");
  const result = card.result ? `，${card.result}` : "";
  return `${action}${result}。`;
}

function toEnglishBullet(card: EvidenceCard): string {
  if (card.id === "evidence-retention") {
    return "Analyzed approximately 20,000 user behavior records using SQL and Excel, identifying two onboarding drop-off points that informed the product optimization roadmap.";
  }
  if (card.id === "evidence-campaign") {
    return "Standardized data definitions across three acquisition channels and built a reusable reporting template, reducing weekly preparation time from three hours to two (percentage improvement pending confirmation).";
  }
  return `${card.title}: ${card.actions.join("; ")}${card.result ? `; outcome: ${card.result}` : ""}.`;
}

export const MOCK_JD_TEXT = DEMO_JD;
