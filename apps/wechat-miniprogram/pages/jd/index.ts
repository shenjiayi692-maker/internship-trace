import { MockAiGateway, MOCK_JD_TEXT } from "../../services/mock-ai";
import { capturePort } from "../../services/platform";
import { prototypeStore } from "../../services/prototype-store";
import { workflowSession } from "../../services/workflow-session";

const ai = new MockAiGateway();

Page({
  data: {
    step: "input" as "input" | "analyzed",
    rawText: "",
    screenshotPath: "",
    screenshotReleased: false,
    job: null as any,
    matches: [] as any[],
    matchedCount: 0,
    gapCount: 0,
    target: "cv"
  },
  onLoad(query: any) { this.setData({ target: query.target === "interview" ? "interview" : "cv" }); },
  onInput(event: any) { this.setData({ rawText: event.detail.value }); },
  fillExample() { this.setData({ rawText: MOCK_JD_TEXT, screenshotPath: "" }); },
  async chooseScreenshot() {
    try {
      const result = await capturePort.chooseJobScreenshot();
      this.setData({ screenshotPath: result.tempPath, rawText: result.mockRecognizedText, screenshotReleased: false });
      wx.showToast({ title: "已模拟识别文字", icon: "none" });
    } catch (error) {
      wx.showModal({ title: "未能读取截图", content: "你可以重新选择，或直接粘贴JD文字继续。", showCancel: false });
    }
  },
  removeScreenshot() { this.setData({ screenshotPath: "", screenshotReleased: true }); },
  analyze() {
    if (!this.data.rawText.trim()) { wx.showToast({ title: "请粘贴JD或选择截图", icon: "none" }); return; }
    const state = prototypeStore.snapshot();
    const job = ai.analyzeJob(this.data.rawText);
    const matches = ai.matchJob(job, state.evidenceCards);
    workflowSession.job = job;
    workflowSession.matches = matches;
    this.setData({
      step: "analyzed",
      job,
      matches,
      matchedCount: matches.filter((item) => item.strength !== "gap").length,
      gapCount: matches.filter((item) => item.strength === "gap").length,
      screenshotPath: "",
      screenshotReleased: this.data.screenshotPath ? true : this.data.screenshotReleased
    });
  },
  backToInput() { this.setData({ step: "input" }); },
  generate() {
    const state = prototypeStore.snapshot();
    const artifacts = ai.createJobArtifacts(this.data.job, state.evidenceCards, state.settings.generationLanguage);
    prototypeStore.addArtifacts(artifacts);
    workflowSession.artifacts = artifacts;
    wx.navigateTo({ url: `/apps/wechat-miniprogram/pages/job-result/index?tab=${this.data.target}` });
  }
});
