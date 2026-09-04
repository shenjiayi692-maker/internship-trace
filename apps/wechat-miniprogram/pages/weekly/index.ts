import type { GeneratedArtifact, Language } from "../../../../packages/contracts/src/index";
import { MockAiGateway } from "../../services/mock-ai";
import { exportPort } from "../../services/platform";
import { prototypeStore } from "../../services/prototype-store";

const ai = new MockAiGateway();

Page({
  data: {
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    tone: "formal" as "formal" | "concise",
    language: "zh" as Language,
    generated: false,
    artifact: null as GeneratedArtifact | null,
    sourceCards: [] as any[],
    exporting: false
  },
  onLoad() {
    const today = new Date();
    const day = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + 1);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    this.setData({ startDate: toDateValue(monday), endDate: toDateValue(friday) });
  },
  onStartChange(event: any) { this.setData({ startDate: event.detail.value, generated: false }); },
  onEndChange(event: any) { this.setData({ endDate: event.detail.value, generated: false }); },
  setTone(event: any) { this.setData({ tone: event.currentTarget.dataset.value, generated: false }); },
  setLanguage(event: any) { this.setData({ language: event.currentTarget.dataset.value, generated: false }); },
  generate() {
    const state = prototypeStore.snapshot();
    const cards = state.evidenceCards.filter((card) => card.date >= this.data.startDate && card.date <= this.data.endDate);
    const selected = cards.length ? cards : state.evidenceCards;
    const artifact = ai.createWeekly(selected, this.data.language, this.data.tone);
    prototypeStore.addArtifacts([artifact]);
    this.setData({ generated: true, artifact, sourceCards: selected.filter((card) => artifact.sourceEvidenceIds.includes(card.id)) });
  },
  async copy() {
    if (!this.data.artifact) return;
    await exportPort.copy([this.data.artifact.title, ...this.data.artifact.content].join("\n\n"));
  },
  async exportImage() {
    if (!this.data.artifact || this.data.exporting) return;
    this.setData({ exporting: true });
    try {
      const path = await exportPort.saveReportImage("reportCanvas", this, this.data.artifact.title, this.data.artifact.content);
      await new Promise((resolve, reject) => wx.saveImageToPhotosAlbum({ filePath: path, success: resolve, fail: reject }));
      wx.showToast({ title: "长图已保存", icon: "success" });
    } catch (error) {
      wx.showModal({ title: "无法保存长图", content: "请在微信设置中允许访问相册。你也可以先使用“复制文字”。", confirmText: "知道了", showCancel: false });
    } finally { this.setData({ exporting: false }); }
  },
  openSource(event: any) { wx.navigateTo({ url: `/apps/wechat-miniprogram/pages/evidence-detail/index?id=${event.currentTarget.dataset.id}` }); }
});

function toDateValue(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
