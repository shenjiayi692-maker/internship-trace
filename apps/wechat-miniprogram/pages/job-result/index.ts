import type { GeneratedArtifact, Language } from "../../../../packages/contracts/src/index";
import { MockAiGateway } from "../../services/mock-ai";
import { exportPort } from "../../services/platform";
import { prototypeStore } from "../../services/prototype-store";
import { workflowSession } from "../../services/workflow-session";

const ai = new MockAiGateway();

Page({
  data: {
    tab: "cv" as "cv" | "interview",
    language: "zh" as Language,
    job: null as any,
    cv: null as GeneratedArtifact | null,
    cvItems: [] as Array<{ content: string; sourceTitle: string }>,
    interview: null as GeneratedArtifact | null,
    sourceCards: [] as any[],
    expandedQuestion: -1
  },
  onLoad(query: any) {
    if (!workflowSession.job) { wx.redirectTo({ url: "/apps/wechat-miniprogram/pages/jd/index" }); return; }
    const state = prototypeStore.snapshot();
    const language = state.settings.generationLanguage;
    const artifacts = workflowSession.artifacts.length ? workflowSession.artifacts : ai.createJobArtifacts(workflowSession.job, state.evidenceCards, language);
    this.setData({ tab: query.tab === "interview" ? "interview" : "cv", language, job: workflowSession.job });
    this.applyArtifacts(artifacts);
  },
  applyArtifacts(artifacts: GeneratedArtifact[]) {
    const state = prototypeStore.snapshot();
    const cv = artifacts.find((item) => item.kind === "cv") || null;
    const interview = artifacts.find((item) => item.kind === "interview") || null;
    const ids = new Set([...(cv?.sourceEvidenceIds || []), ...(interview?.sourceEvidenceIds || [])]);
    const sourceCards = state.evidenceCards.filter((card) => ids.has(card.id));
    const cvItems = (cv?.content || []).map((content, index) => ({
      content,
      sourceTitle: sourceCards[index]?.title || sourceCards[0]?.title || ""
    }));
    this.setData({ cv, cvItems, interview, sourceCards });
  },
  setTab(event: any) { this.setData({ tab: event.currentTarget.dataset.value }); },
  setLanguage(event: any) {
    const language = event.currentTarget.dataset.value as Language;
    const state = prototypeStore.snapshot();
    prototypeStore.updateSettings({ generationLanguage: language });
    const artifacts = ai.createJobArtifacts(this.data.job, state.evidenceCards, language);
    prototypeStore.addArtifacts(artifacts);
    workflowSession.artifacts = artifacts;
    this.setData({ language });
    this.applyArtifacts(artifacts);
  },
  async copy() {
    const artifact = this.data.tab === "cv" ? this.data.cv : this.data.interview;
    if (artifact) await exportPort.copy([artifact.title, ...artifact.content].join("\n\n"));
  },
  openSource(event: any) { wx.navigateTo({ url: `/apps/wechat-miniprogram/pages/evidence-detail/index?id=${event.currentTarget.dataset.id}` }); },
  toggleQuestion(event: any) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({ expandedQuestion: this.data.expandedQuestion === index ? -1 : index });
  },
  backGenerate() { wx.switchTab({ url: "/apps/wechat-miniprogram/pages/generate/index" }); }
});
