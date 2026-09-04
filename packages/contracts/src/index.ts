export type Language = "zh" | "en";
export type EntryMode = "text" | "voice";
export type ArtifactKind = "weekly" | "cv" | "interview";
export type MatchStrength = "strong" | "partial" | "gap";

export interface FollowUpAnswer {
  question: string;
  answer: string;
  skipped?: boolean;
}

export interface DailyEntry {
  id: string;
  date: string;
  mode: EntryMode;
  originalText: string;
  redactedText: string;
  followUps: FollowUpAnswer[];
  createdAt: number;
  expiresAt: number;
}

export interface Metric {
  label: string;
  value: string;
  confirmed: boolean;
}

export interface EvidenceCard {
  id: string;
  title: string;
  date: string;
  context: string;
  actions: string[];
  tools: string[];
  collaboration: string;
  output: string;
  result: string;
  metrics: Metric[];
  competencyTags: string[];
  missingFields: string[];
  sourceEntryIds: string[];
  sourceCleared: boolean;
  confirmed: boolean;
  score: number;
}

export interface JobRequirement {
  id: string;
  label: string;
  keywords: string[];
  importance: "must" | "preferred";
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  rawText: string;
  requirements: JobRequirement[];
  createdAt: number;
}

export interface RequirementMatch {
  requirementId: string;
  requirementLabel: string;
  evidenceCardIds: string[];
  strength: MatchStrength;
  explanation: string;
}

export interface GeneratedArtifact {
  id: string;
  kind: ArtifactKind;
  language: Language;
  title: string;
  content: string[];
  sourceEvidenceIds: string[];
  riskFlags: string[];
  createdAt: number;
}

export interface CoachInsight {
  id: string;
  period: string;
  observation: string;
  gap: string;
  suggestedAction: string;
  evidenceCardIds: string[];
}

export interface UserSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  workdaysOnly: boolean;
  rawRetentionDays: number;
  generationLanguage: Language;
}

export interface AppState {
  version: number;
  privacyAccepted: boolean;
  entries: DailyEntry[];
  evidenceCards: EvidenceCard[];
  artifacts: GeneratedArtifact[];
  coachInsights: CoachInsight[];
  settings: UserSettings;
}

export interface StoragePort {
  load(): AppState | null;
  save(state: AppState): void;
  migrate(raw: unknown): AppState;
  exportData(): string;
  clearAll(): void;
  cleanupExpired(now: number): { removedEntryIds: string[]; state: AppState };
}

export interface AiGateway {
  createFollowUps(text: string): string[];
  createEvidence(entry: DailyEntry): EvidenceCard;
  createWeekly(cards: EvidenceCard[], language: Language, tone: "formal" | "concise"): GeneratedArtifact;
  analyzeJob(rawText: string): JobDescription;
  matchJob(job: JobDescription, cards: EvidenceCard[]): RequirementMatch[];
  createJobArtifacts(job: JobDescription, cards: EvidenceCard[], language: Language): GeneratedArtifact[];
  createCoachInsight(cards: EvidenceCard[]): CoachInsight;
}

export interface CapturePort {
  requestVoicePermission(): Promise<boolean>;
  chooseJobScreenshot(): Promise<{ tempPath: string; mockRecognizedText: string }>;
}

export interface ExportPort {
  copy(text: string): Promise<void>;
  saveReportImage(canvasId: string, page: unknown, title: string, lines: string[]): Promise<string>;
}
