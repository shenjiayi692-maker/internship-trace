import type { DailyEntry, EvidenceCard, FollowUpAnswer } from "../../../../packages/contracts/src/index";
import { createDailyEntry, redactSensitiveText } from "../../../../packages/core/src/index";
import { MockAiGateway } from "../../services/mock-ai";
import { capturePort } from "../../services/platform";
import { prototypeStore } from "../../services/prototype-store";

const ai = new MockAiGateway();
const MOCK_TRANSCRIPT = "今天分析了新用户的首周流失，清洗了约2万条埋点数据，发现注册和首次创建任务之间掉得最多。";

Page({
  data: {
    mode: "text" as "text" | "voice",
    step: "input" as "input" | "followup" | "review" | "saved",
    inputText: "",
    isRecording: false,
    recordSeconds: 0,
    questions: [] as string[],
    currentQuestion: 0,
    currentAnswer: "",
    answers: [] as FollowUpAnswer[],
    redactedText: "",
    sensitiveChanged: false,
    previewCard: null as EvidenceCard | null,
    savedCardId: ""
  },
  timer: null as any,
  onLoad(query: any) { this.setData({ mode: query.mode === "voice" ? "voice" : "text" }); },
  onUnload() { if (this.timer) clearInterval(this.timer); },
  onInput(event: any) { this.setData({ inputText: event.detail.value }); },
  switchMode(event: any) { this.setData({ mode: event.currentTarget.dataset.mode }); },
  async startRecording() {
    const allowed = await capturePort.requestVoicePermission();
    if (!allowed) {
      wx.showModal({ title: "无法使用麦克风", content: "原型需要麦克风权限来演示按住说话交互。你仍可以切换为文字记录。", showCancel: false });
      return;
    }
    this.setData({ isRecording: true, recordSeconds: 0 });
    this.timer = setInterval(() => this.setData({ recordSeconds: Math.min(60, this.data.recordSeconds + 1) }), 1000);
  },
  stopRecording() {
    if (!this.data.isRecording) return;
    clearInterval(this.timer);
    this.timer = null;
    this.setData({ isRecording: false, inputText: MOCK_TRANSCRIPT });
    wx.showToast({ title: "模拟转写完成", icon: "none" });
  },
  submitInput() {
    const text = this.data.inputText.trim();
    if (!text) { wx.showToast({ title: "先记录一句今天的工作", icon: "none" }); return; }
    const redacted = redactSensitiveText(text);
    const questions = ai.createFollowUps(redacted.text);
    this.setData({
      redactedText: redacted.text,
      sensitiveChanged: redacted.changed,
      questions,
      currentQuestion: 0,
      currentAnswer: "",
      answers: [],
      step: questions.length ? "followup" : "review"
    });
    if (!questions.length) this.buildPreview([]);
  },
  onAnswerInput(event: any) { this.setData({ currentAnswer: event.detail.value }); },
  submitAnswer() { this.finishQuestion(false); },
  skipAnswer() { this.finishQuestion(true); },
  finishQuestion(skipped: boolean) {
    const index = this.data.currentQuestion;
    const answer = this.data.currentAnswer.trim();
    if (!skipped && !answer) { wx.showToast({ title: "写一句回答，或选择跳过", icon: "none" }); return; }
    const answers = [...this.data.answers, { question: this.data.questions[index], answer: skipped ? "" : answer, skipped }];
    if (index + 1 < this.data.questions.length && index + 1 < 2) {
      this.setData({ answers, currentQuestion: index + 1, currentAnswer: "" });
      return;
    }
    this.setData({ answers, step: "review" });
    this.buildPreview(answers);
  },
  buildPreview(answers: FollowUpAnswer[]) {
    const draft = createDailyEntry({ text: this.data.inputText, mode: this.data.mode, followUps: answers });
    this.setData({ previewCard: ai.createEvidence(draft) });
  },
  editInput() { this.setData({ step: "input" }); },
  saveRecord() {
    const entry: DailyEntry = createDailyEntry({ text: this.data.inputText, mode: this.data.mode, followUps: this.data.answers });
    const card = ai.createEvidence(entry);
    prototypeStore.addEntry(entry);
    prototypeStore.addEvidence(card);
    this.setData({ step: "saved", savedCardId: card.id, previewCard: card });
  },
  openSavedCard() { wx.redirectTo({ url: `/apps/wechat-miniprogram/pages/evidence-detail/index?id=${this.data.savedCardId}` }); },
  backHome() { wx.switchTab({ url: "/apps/wechat-miniprogram/pages/today/index" }); },
  cancelFlow() {
    wx.showModal({ title: "放弃本次记录？", content: "尚未保存的内容会被清除。", confirmText: "放弃", confirmColor: "#B64B46", success: (result: any) => { if (result.confirm) wx.navigateBack(); } });
  }
});
