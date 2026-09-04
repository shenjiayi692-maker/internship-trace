import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanupExpiredEntries,
  createDailyEntry,
  evidenceNeedsRetentionReminder,
  languageLabel,
  matchRequirements,
  redactSensitiveText,
  scoreEvidence,
  verifyArtifactTraceability,
  DAY_MS
} from "./index.ts";
import { sampleEvidenceCards } from "../../contracts/src/mock-data.ts";

test("evidence score rewards complete, confirmed facts", () => {
  assert.ok(scoreEvidence(sampleEvidenceCards[0]) > scoreEvidence(sampleEvidenceCards[2]));
  assert.equal(scoreEvidence(sampleEvidenceCards[0]), 100);
});

test("daily entry stores at most two follow-ups and expires after 90 days", () => {
  const entry = createDailyEntry({
    text: "完成分析",
    mode: "text",
    now: 1000,
    followUps: [
      { question: "1", answer: "a" },
      { question: "2", answer: "b" },
      { question: "3", answer: "c" }
    ]
  });
  assert.equal(entry.followUps.length, 2);
  assert.equal(entry.expiresAt, 1000 + 90 * DAY_MS);
});

test("retention reminder begins during the final seven days", () => {
  const entry = createDailyEntry({ text: "完成分析", mode: "text", now: 1000 });
  assert.equal(evidenceNeedsRetentionReminder(entry, 1000 + 82 * DAY_MS), false);
  assert.equal(evidenceNeedsRetentionReminder(entry, 1000 + 83 * DAY_MS), true);
});

test("generation language state supports Chinese and English", () => {
  assert.equal(languageLabel("zh"), "中文");
  assert.equal(languageLabel("en"), "English");
});

test("sensitive identifiers are redacted before model processing", () => {
  const result = redactSensitiveText("客户名称：星河科技，联系人 13812345678");
  assert.equal(result.changed, true);
  assert.doesNotMatch(result.text, /星河科技|13812345678/);
});

test("expired raw entries are removed but evidence remains and marks source cleared", () => {
  const entry = createDailyEntry({ text: "完成分析", mode: "text", now: 1000, retentionDays: 1 });
  const card = { ...sampleEvidenceCards[0], sourceEntryIds: [entry.id], sourceCleared: false };
  const result = cleanupExpiredEntries([entry], [card], 1000 + 2 * DAY_MS);
  assert.equal(result.entries.length, 0);
  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].sourceCleared, true);
});

test("JD requirements map only to traceable evidence", () => {
  const job = {
    id: "job",
    title: "产品运营实习生",
    company: "示例公司",
    rawText: "SQL 数据分析",
    createdAt: 1,
    requirements: [{ id: "r1", label: "数据分析", keywords: ["数据分析", "SQL"], importance: "must" as const }]
  };
  const matches = matchRequirements(job, sampleEvidenceCards);
  assert.equal(matches[0].strength, "strong");
  assert.deepEqual(matches[0].evidenceCardIds, ["evidence-retention"]);
});

test("generated content must name existing evidence sources", () => {
  const artifact = {
    id: "a1",
    kind: "cv" as const,
    language: "en" as const,
    title: "CV",
    content: ["Analyzed user data"],
    sourceEvidenceIds: ["evidence-retention"],
    riskFlags: [],
    createdAt: 1
  };
  assert.equal(verifyArtifactTraceability(artifact, sampleEvidenceCards), true);
  assert.equal(verifyArtifactTraceability({ ...artifact, sourceEvidenceIds: ["missing"] }, sampleEvidenceCards), false);
});
