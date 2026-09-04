import { prototypeStore } from "../../services/prototype-store";
import { MockAiGateway } from "../../services/mock-ai";

const ai = new MockAiGateway();

Page({
  data: {
    todayLabel: "",
    entryCount: 0,
    skillCount: 0,
    averageScore: 0,
    pendingCard: null as any,
    coach: null as any,
    recentCards: [] as any[]
  },
  onShow() {
    const state = prototypeStore.snapshot();
    if (!state.privacyAccepted) {
      wx.reLaunch({ url: "/apps/wechat-miniprogram/pages/onboarding/index" });
      return;
    }
    const tags = new Set(state.evidenceCards.flatMap((card) => card.competencyTags));
    const averageScore = state.evidenceCards.length
      ? Math.round(state.evidenceCards.reduce((sum, card) => sum + card.score, 0) / state.evidenceCards.length)
      : 0;
    this.setData({
      todayLabel: formatToday(),
      entryCount: state.entries.length,
      skillCount: tags.size,
      averageScore,
      pendingCard: state.evidenceCards.find((card) => card.missingFields.length > 0) || null,
      coach: state.coachInsights[0] || ai.createCoachInsight(state.evidenceCards),
      recentCards: state.evidenceCards.slice(0, 2)
    });
  },
  startText() { wx.navigateTo({ url: "/apps/wechat-miniprogram/pages/capture/index?mode=text" }); },
  startVoice() { wx.navigateTo({ url: "/apps/wechat-miniprogram/pages/capture/index?mode=voice" }); },
  openPending() {
    if (this.data.pendingCard) wx.navigateTo({ url: `/apps/wechat-miniprogram/pages/evidence-detail/index?id=${this.data.pendingCard.id}` });
  },
  openCard(event: any) { wx.navigateTo({ url: `/apps/wechat-miniprogram/pages/evidence-detail/index?id=${event.currentTarget.dataset.id}` }); },
  openAssets() { wx.switchTab({ url: "/apps/wechat-miniprogram/pages/assets/index" }); }
});

function formatToday(): string {
  const date = new Date();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekdays[date.getDay()]}`;
}
