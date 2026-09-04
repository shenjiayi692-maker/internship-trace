import { prototypeStore } from "./apps/wechat-miniprogram/services/prototype-store";

App({
  globalData: { prototype: true },
  onLaunch() {
    prototypeStore.bootstrap();
    prototypeStore.cleanupExpired();
  }
});
