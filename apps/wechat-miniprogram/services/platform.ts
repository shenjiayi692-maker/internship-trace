import type { CapturePort, ExportPort } from "../../../packages/contracts/src/index";

export class WechatCapturePort implements CapturePort {
  async requestVoicePermission(): Promise<boolean> {
    return new Promise((resolve) => {
      wx.authorize({
        scope: "scope.record",
        success: () => resolve(true),
        fail: () => resolve(false)
      });
    });
  }

  async chooseJobScreenshot(): Promise<{ tempPath: string; mockRecognizedText: string }> {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (result: any) => resolve({
          tempPath: result.tempFiles[0].tempFilePath,
          mockRecognizedText: "产品运营实习生｜负责用户行为数据分析、活动运营与竞品研究；熟练使用 Excel，掌握 SQL；能够跨团队沟通并将分析结论转化为产品优化建议。"
        }),
        fail: reject
      });
    });
  }
}

export class WechatExportPort implements ExportPort {
  async copy(text: string): Promise<void> {
    return new Promise((resolve, reject) => wx.setClipboardData({ data: text, success: resolve, fail: reject }));
  }

  async saveReportImage(canvasId: string, page: unknown, title: string, lines: string[]): Promise<string> {
    const query = wx.createSelectorQuery().in(page);
    return new Promise((resolve, reject) => {
      query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((result: any[]) => {
        const canvas = result?.[0]?.node;
        if (!canvas) return reject(new Error("canvas unavailable"));
        const width = 690;
        const height = Math.max(900, 300 + lines.length * 90);
        const ratio = wx.getSystemInfoSync().pixelRatio || 2;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        const context = canvas.getContext("2d");
        context.scale(ratio, ratio);
        context.fillStyle = "#F5F7F9";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#142B4A";
        context.font = "bold 34px sans-serif";
        context.fillText(title, 40, 72);
        context.font = "22px sans-serif";
        context.fillStyle = "#5E6B78";
        context.fillText("实习迹 · 原型模拟生成", 40, 112);
        let y = 170;
        lines.forEach((line) => {
          context.fillStyle = line.length < 12 ? "#142B4A" : "#354454";
          context.font = line.length < 12 ? "bold 26px sans-serif" : "22px sans-serif";
          const chunks = wrapText(line, 27);
          chunks.forEach((chunk) => {
            context.fillText(chunk, 40, y);
            y += 38;
          });
          y += 22;
        });
        wx.canvasToTempFilePath({
          canvas,
          fileType: "png",
          success: (file: any) => resolve(file.tempFilePath),
          fail: reject
        });
      });
    });
  }
}

function wrapText(text: string, limit: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += limit) chunks.push(text.slice(index, index + limit));
  return chunks.length ? chunks : [""];
}

export const capturePort = new WechatCapturePort();
export const exportPort = new WechatExportPort();
