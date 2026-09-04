# 实习迹 · 微信小程序高保真原型

“实习迹”帮助正在实习的用户把每天零散的工作沉淀为可验证、可复用的职业证据，并进一步生成周报、匹配JD、整理CV要点与准备面试追问。

**Internship Trace** — a high-fidelity WeChat Mini Program prototype that turns scattered daily internship work into verifiable, reusable career evidence, then generates weekly reports, JD matches, CV bullets and interview follow-ups from it.

| | |
|---|---|
| 形态 | 微信小程序原生开发（WXML / WXSS / TypeScript），无框架 |
| 结构 | monorepo：页面层 `apps/` + 平台无关内核 `packages/core` + 领域契约 `packages/contracts` |
| 数据 | 全部本地存储，零网络请求、零账号、零云函数 |
| AI | 确定性模拟（追问、整理、生成、OCR），便于评审交互而不引入模型不确定性 |
| 测试 | `node --test` 8 个用例，覆盖证据评分 / 追问上限 / 脱敏 / 90 天清理 / JD 匹配 / 来源追溯 |
| 状态 | 高保真原型，**不是可上线产品**，边界见下方「原型边界」 |

设计上把「能不能换端」当作硬约束：`packages/core` 与 `packages/contracts` 不允许依赖 `wx`、浏览器 API 或任何模型 SDK，未来做海外 PWA 时只重写页面层。

## 直接体验

1. 打开微信开发者工具，选择“导入项目”。
2. 项目目录选择本仓库根目录。
3. AppID可使用测试号；项目已配置 `touristappid`。
4. 编译后从隐私引导页开始体验。

建议依次体验：

1. “今日”使用文字或按住说话记录。
2. 回答或跳过最多两个追问，生成事实卡。
3. 在“资产”中补充结果并确认事实。
4. 在“生成”中输出周报，或粘贴/截图模拟分析JD。
5. 查看CV要点的证据来源和针对性面试问题。
6. 在“我的”中导出、恢复示例数据或彻底删除。

## 原型边界

- 没有网络请求、账号、云数据库或支付。
- AI追问、整理、生成与OCR结果均为确定性模拟。
- 语音路径只申请麦克风权限并模拟转写，不启动录音、不保存音频。
- JD截图使用微信临时路径预览，模拟识别后从页面状态释放。
- 所有产品数据使用微信本地存储。
- 长图由本地Canvas生成，保存相册需要用户授权。

## 目录结构

```text
apps/wechat-miniprogram/  原生小程序页面、样式、组件和微信适配
packages/core/            平台无关的评分、脱敏、保留和匹配规则
packages/contracts/       领域类型、可替换接口和连贯示例数据
scripts/                  工程完整性检查
```

未来海外PWA应重新实现页面层，只复用 `packages/core` 和 `packages/contracts`。核心包不得依赖 `wx`、浏览器API或具体模型SDK。

## 本地验证

导入微信开发者工具体验不需要安装第三方依赖。若要运行完整的自动测试与类型检查，请使用Node.js 22及以上并先安装开发依赖：

```sh
npm install
npm test
npm run typecheck
npm run check
```

测试覆盖证据评分、最多两次追问、敏感信息脱敏、90天清理、JD匹配和生成内容来源追溯。

## 数据规则

- 原始记录默认90天到期，第83天进入提醒窗口。
- 原始记录到期只清除源记录；事实卡保留并标记来源已清理。
- 未确认的数字会进入风险提示，不会被当作已验证结果。
- 所有生成结果必须带有事实卡ID，可返回资产库核对。

## 接入真实MVP前

真实AI必须通过服务端代理接入，禁止把模型API密钥放进小程序。还需另行实现模型供应商的数据保留配置、匿名会话、请求脱敏、成本限额、真实语音转写/OCR、微信订阅消息和审核所需的隐私协议。
