import { App, Modal, Setting } from "obsidian";
import { Platform } from "./types";

export class PlatformSelectModal extends Modal {
  private onSelect: (platform: Platform) => void;
  private availablePlatforms: Platform[];

  constructor(
    app: App,
    availablePlatforms: Platform[],
    onSelect: (platform: Platform) => void
  ) {
    super(app);
    this.availablePlatforms = availablePlatforms;
    this.onSelect = onSelect;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("note-connector-platform-modal");
    contentEl.createEl("h3", { text: "选择上传平台" });
    contentEl.createEl("p", {
      text: "选择要将笔记上传到哪个平台：",
      cls: "note-connector-published-info",
    });

    const labels: Record<Platform, string> = {
      feishu: "📋 飞书文档",
      yuque: "📚 语雀知识库",
    };

    for (const platform of this.availablePlatforms) {
      const btn = contentEl.createEl("button", {
        text: labels[platform],
        cls: "note-connector-platform-btn",
      });
      btn.onclick = () => {
        this.close();
        this.onSelect(platform);
      };
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ConfirmModal extends Modal {
  private message: string;
  private onConfirm: () => void;

  constructor(app: App, message: string, onConfirm: () => void) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("取消").onClick(() => {
          this.close();
        })
      )
      .addButton((btn) =>
        btn
          .setButtonText("确认")
          .setCta()
          .setWarning()
          .onClick(() => {
            this.close();
            this.onConfirm();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
