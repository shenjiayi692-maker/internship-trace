import { prototypeStore } from "../../services/prototype-store";

Page({
  data: { checked: true },
  onLoad() {
    if (prototypeStore.snapshot().privacyAccepted) wx.switchTab({ url: "/apps/wechat-miniprogram/pages/today/index" });
  },
  toggleConsent() { this.setData({ checked: !this.data.checked }); },
  enterApp() {
    if (!this.data.checked) {
      wx.showToast({ title: "请先确认隐私说明", icon: "none" });
      return;
    }
    prototypeStore.acceptPrivacy();
    wx.switchTab({ url: "/apps/wechat-miniprogram/pages/today/index" });
  }
});
