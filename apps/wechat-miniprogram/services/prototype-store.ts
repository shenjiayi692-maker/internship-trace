import type { AppState, DailyEntry, EvidenceCard, GeneratedArtifact, UserSettings } from "../../../packages/contracts/src/index";
import { createEmptyState, createInitialState } from "../../../packages/contracts/src/mock-data";
import { cleanupExpiredEntries } from "../../../packages/core/src/index";

const STORAGE_KEY = "shixiji.prototype.state.v1";
const INITIALIZED_KEY = "shixiji.prototype.initialized.v1";

class PrototypeStore {
  private state: AppState = createInitialState();

  bootstrap(): void {
    const stored = wx.getStorageSync(STORAGE_KEY);
    const initialized = wx.getStorageSync(INITIALIZED_KEY);
    this.state = stored && stored.version === 1 ? stored : initialized ? createEmptyState() : createInitialState();
    wx.setStorageSync(INITIALIZED_KEY, true);
    this.persist();
  }

  snapshot(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  acceptPrivacy(): void {
    this.state.privacyAccepted = true;
    this.persist();
  }

  addEntry(entry: DailyEntry): void {
    this.state.entries.unshift(entry);
    this.persist();
  }

  addEvidence(card: EvidenceCard): void {
    this.state.evidenceCards.unshift(card);
    this.persist();
  }

  updateEvidence(cardId: string, patch: Partial<EvidenceCard>): void {
    this.state.evidenceCards = this.state.evidenceCards.map((card) => card.id === cardId ? { ...card, ...patch } : card);
    this.persist();
  }

  addArtifacts(artifacts: GeneratedArtifact[]): void {
    this.state.artifacts = [...artifacts, ...this.state.artifacts];
    this.persist();
  }

  updateSettings(patch: Partial<UserSettings>): void {
    this.state.settings = { ...this.state.settings, ...patch };
    this.persist();
  }

  cleanupExpired(now = Date.now()): string[] {
    const result = cleanupExpiredEntries(this.state.entries, this.state.evidenceCards, now);
    this.state.entries = result.entries;
    this.state.evidenceCards = result.cards;
    if (result.removedEntryIds.length) this.persist();
    return result.removedEntryIds;
  }

  exportData(): string {
    return JSON.stringify({ exportedAt: new Date().toISOString(), product: "实习迹", ...this.state }, null, 2);
  }

  reset(): void {
    this.state = createInitialState();
    this.state.privacyAccepted = true;
    wx.setStorageSync(INITIALIZED_KEY, true);
    this.persist();
  }

  clearAll(): void {
    this.state = createEmptyState();
    wx.removeStorageSync(STORAGE_KEY);
    wx.setStorageSync(INITIALIZED_KEY, true);
  }

  private persist(): void {
    wx.setStorageSync(STORAGE_KEY, this.state);
  }
}

export const prototypeStore = new PrototypeStore();
