import type {
  DailyEntry,
  EvidenceCard,
  GeneratedArtifact,
  JobDescription,
  Language,
  RequirementMatch
} from "../../contracts/src/index";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_FOLLOW_UPS = 2;

const sensitivePatterns: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /(?:客户|公司)(?:名称)?[：:]\s*[\u4e00-\u9fa5A-Za-z0-9·_-]{2,20}/g, replacement: "公司名称：[已隐藏]" },
  { pattern: /1[3-9]\d{9}/g, replacement: "[手机号已隐藏]" },
  { pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: "[邮箱已隐藏]" }
];

export function redactSensitiveText(text: string): { text: string; changed: boolean } {
  let redacted = text.trim();
  sensitivePatterns.forEach(({ pattern, replacement }) => {
    redacted = redacted.replace(pattern, replacement);
  });
  return { text: redacted, changed: redacted !== text.trim() };
}

export function createDailyEntry(input: {
  text: string;
  mode: "text" | "voice";
  followUps?: DailyEntry["followUps"];
  now?: number;
  retentionDays?: number;
}): DailyEntry {
  const now = input.now ?? Date.now();
  const redacted = redactSensitiveText(input.text);
  return {
    id: `entry-${now}`,
    date: formatDate(now),
    mode: input.mode,
    originalText: input.text.trim(),
    redactedText: redacted.text,
    followUps: (input.followUps ?? []).slice(0, MAX_FOLLOW_UPS),
    createdAt: now,
    expiresAt: now + (input.retentionDays ?? 90) * DAY_MS
  };
}

export function scoreEvidence(card: Omit<EvidenceCard, "score"> | EvidenceCard): number {
  let score = 18;
  if (card.context.trim()) score += 12;
  if (card.actions.length) score += Math.min(22, card.actions.length * 8);
  if (card.output.trim()) score += 12;
  if (card.result.trim()) score += 16;
  if (card.tools.length) score += 6;
  if (card.collaboration.trim()) score += 6;
  if (card.metrics.some((metric) => metric.confirmed)) score += 12;
  score -= card.missingFields.length * 6;
  return Math.max(0, Math.min(100, score));
}

export function cleanupExpiredEntries(
  entries: DailyEntry[],
  cards: EvidenceCard[],
  now = Date.now()
): { entries: DailyEntry[]; cards: EvidenceCard[]; removedEntryIds: string[] } {
  const removedEntryIds = entries.filter((entry) => entry.expiresAt <= now).map((entry) => entry.id);
  const removed = new Set(removedEntryIds);
  return {
    entries: entries.filter((entry) => !removed.has(entry.id)),
    cards: cards.map((card) => {
      const hasClearedSource = card.sourceEntryIds.some((id) => removed.has(id));
      return hasClearedSource ? { ...card, sourceCleared: true } : card;
    }),
    removedEntryIds
  };
}

export function evidenceNeedsRetentionReminder(entry: DailyEntry, now = Date.now()): boolean {
  const daysLeft = Math.ceil((entry.expiresAt - now) / DAY_MS);
  return daysLeft > 0 && daysLeft <= 7;
}

export function filterCards(cards: EvidenceCard[], filter: "all" | "confirmed" | "incomplete"): EvidenceCard[] {
  if (filter === "confirmed") return cards.filter((card) => card.confirmed);
  if (filter === "incomplete") return cards.filter((card) => !card.confirmed || card.missingFields.length > 0);
  return cards;
}

export function confirmedFactTokens(cards: EvidenceCard[]): string[] {
  return cards.flatMap((card) => [
    card.title,
    card.context,
    ...card.actions,
    card.output,
    card.result,
    ...card.metrics.filter((metric) => metric.confirmed).map((metric) => metric.value)
  ]).filter(Boolean);
}

export function verifyArtifactTraceability(artifact: GeneratedArtifact, cards: EvidenceCard[]): boolean {
  const cardIds = new Set(cards.map((card) => card.id));
  return artifact.sourceEvidenceIds.length > 0 && artifact.sourceEvidenceIds.every((id) => cardIds.has(id));
}

export function matchRequirements(job: JobDescription, cards: EvidenceCard[]): RequirementMatch[] {
  return job.requirements.map((requirement) => {
    const keywords = requirement.keywords.map((item) => item.toLowerCase());
    const scored = cards.map((card) => {
      const haystack = [card.title, card.context, card.result, ...card.actions, ...card.tools, ...card.competencyTags]
        .join(" ")
        .toLowerCase();
      return { card, hits: keywords.filter((keyword) => haystack.includes(keyword)).length };
    }).filter((item) => item.hits > 0).sort((a, b) => b.hits - a.hits);
    const top = scored.slice(0, 2);
    const strength = top.length === 0 ? "gap" : top[0].hits >= Math.min(2, keywords.length) ? "strong" : "partial";
    return {
      requirementId: requirement.id,
      requirementLabel: requirement.label,
      evidenceCardIds: top.map((item) => item.card.id),
      strength,
      explanation: strength === "strong"
        ? "已有明确、可追溯的经历支持"
        : strength === "partial"
          ? "有相关经历，但结果或个人贡献仍需补充"
          : "当前证据库中尚未找到直接支持"
    };
  });
}

export function languageLabel(language: Language): string {
  return language === "zh" ? "中文" : "English";
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shortDate(value: string): string {
  const parts = value.split("-");
  return parts.length === 3 ? `${Number(parts[1])}月${Number(parts[2])}日` : value;
}
