import { filterCards, shortDate } from "../../../../packages/core/src/index";
import { prototypeStore } from "../../services/prototype-store";

Page({
  data: {
    filter: "all" as "all" | "confirmed" | "incomplete",
    cards: [] as any[],
    empty: false
  },
  onShow() { this.refresh(); },
  setFilter(event: any) {
    this.setData({ filter: event.currentTarget.dataset.filter });
    this.refresh();
  },
  refresh() {
    const cards = filterCards(prototypeStore.snapshot().evidenceCards, this.data.filter).map((card) => ({ ...card, displayDate: shortDate(card.date) }));
    this.setData({ cards, empty: cards.length === 0 });
  },
  openCard(event: any) { wx.navigateTo({ url: `/apps/wechat-miniprogram/pages/evidence-detail/index?id=${event.currentTarget.dataset.id}` }); },
  addRecord() { wx.navigateTo({ url: "/apps/wechat-miniprogram/pages/capture/index?mode=text" }); }
});
