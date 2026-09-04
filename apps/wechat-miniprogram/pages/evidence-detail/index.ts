import { scoreEvidence } from "../../../../packages/core/src/index";
import { prototypeStore } from "../../services/prototype-store";

Page({
  data: { card: null as any, editableResult: "", sourceEntry: null as any },
  onLoad(query: any) { this.load(query.id); },
  load(id: string) {
    const state = prototypeStore.snapshot();
    const card = state.evidenceCards.find((item) => item.id === id);
    if (!card) return;
    const sourceEntry = state.entries.find((entry) => card.sourceEntryIds.includes(entry.id)) || null;
    this.setData({ card, editableResult: card.result, sourceEntry });
  },
  onResultInput(event: any) { this.setData({ editableResult: event.detail.value }); },
  saveAndConfirm() {
    const card = { ...this.data.card, result: this.data.editableResult.trim(), confirmed: true };
    card.missingFields = card.missingFields.filter((item: string) => item !== "工作结果" && item !== "结论如何影响决策");
    card.score = scoreEvidence(card);
    prototypeStore.updateEvidence(card.id, card);
    this.setData({ card });
    wx.showToast({ title: "事实已确认", icon: "success" });
  },
  copySource() {
    if (!this.data.sourceEntry) return;
    wx.setClipboardData({ data: this.data.sourceEntry.redactedText });
  }
});
