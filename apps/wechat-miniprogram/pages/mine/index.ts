import { prototypeStore } from "../../services/prototype-store";

Page({
  data: { settings: null as any, entryCount: 0, evidenceCount: 0, dataSize: "0 KB" },
  onShow() { this.refresh(); },
  refresh() {
    const state = prototypeStore.snapshot();
    const bytes = encodeURIComponent(prototypeStore.exportData()).replace(/%[A-F\d]{2}/g, "U").length;
    this.setData({ settings: state.settings, entryCount: state.entries.length, evidenceCount: state.evidenceCards.length, dataSize: `${Math.max(1, Math.round(bytes / 1024))} KB` });
  },
  toggleReminder(event: any) {
    prototypeStore.updateSettings({ reminderEnabled: event.detail.value });
    this.refresh();
    wx.showToast({ title: "原型仅保存设置", icon: "none" });
  },
  changeTime(event: any) { prototypeStore.updateSettings({ reminderTime: event.detail.value }); this.refresh(); },
  exportData() {
    wx.setClipboardData({ data: prototypeStore.exportData(), success: () => wx.showToast({ title: "数据已复制", icon: "success" }) });
  },
  previewCleanup() {
    wx.showModal({ title: "90天保留策略", content: "原始日记将在90天后清理；第83天开始提醒确认资产卡。已确认的职业证据会继续保留，直到你主动删除。", showCancel: false, confirmText: "知道了" });
  },
  resetDemo() {
    wx.showModal({ title: "恢复示例数据？", content: "你在原型中的新增记录会被替换为初始示例。", confirmColor: "#1F8A7A", success: (result: any) => {
      if (result.confirm) { prototypeStore.reset(); this.refresh(); wx.showToast({ title: "已恢复", icon: "success" }); }
    } });
  },
  clearAll() {
    wx.showModal({ title: "彻底删除本地数据？", content: "所有原始记录、职业证据和生成结果都会从本机删除，且无法恢复。", confirmText: "彻底删除", confirmColor: "#B64B46", success: (result: any) => {
      if (result.confirm) { prototypeStore.clearAll(); wx.reLaunch({ url: "/apps/wechat-miniprogram/pages/onboarding/index" }); }
    } });
  }
});
