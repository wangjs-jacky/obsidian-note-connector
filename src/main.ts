import { Notice, Plugin, TFile, TAbstractFile, MarkdownView } from "obsidian";
import {
  PluginSettings,
  DEFAULT_SETTINGS,
  PublishedNote,
  PluginData,
  Platform,
} from "./types";
import { FeishuProvider } from "./providers/feishu";
import { YuqueProvider } from "./providers/yuque";
import { NoteProvider } from "./providers/base";
import { NoteConnectorSettingTab } from "./settings";
import { PlatformSelectModal, ConfirmModal } from "./modals";

export default class NoteConnectorPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  publishedNotes: Record<string, PublishedNote> = {};

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addRibbonIcon("upload-cloud", "上传笔记", () => {
      void this.uploadActiveNote();
    });

    this.addCommand({
      id: "upload-to-feishu",
      name: "上传到飞书",
      checkCallback: (checking) => {
        if (!this.getActiveMarkdownFile()) return false;
        if (!this.settings.feishu.enabled) return false;
        if (!checking) void this.uploadActiveNote("feishu");
        return true;
      },
    });

    this.addCommand({
      id: "upload-to-yuque",
      name: "上传到语雀",
      checkCallback: (checking) => {
        if (!this.getActiveMarkdownFile()) return false;
        if (!this.settings.yuque.enabled) return false;
        if (!checking) void this.uploadActiveNote("yuque");
        return true;
      },
    });

    this.addCommand({
      id: "copy-link",
      name: "复制已上传的链接",
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile();
        if (!file) return false;
        const published = this.publishedNotes[file.path];
        if (!published) return false;
        if (!checking) {
          void navigator.clipboard.writeText(published.url);
          new Notice("链接已复制到剪贴板");
        }
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;

        const published = this.publishedNotes[file.path];

        if (this.settings.feishu.enabled) {
          menu.addItem((item) => {
            item
              .setTitle(published?.platform === "feishu" ? "重新上传到飞书" : "上传到飞书")
              .setIcon("upload-cloud")
              .onClick(() => this.uploadFile(file, "feishu"));
          });
        }

        if (this.settings.yuque.enabled) {
          menu.addItem((item) => {
            item
              .setTitle(published?.platform === "yuque" ? "重新上传到语雀" : "上传到语雀")
              .setIcon("book-open")
              .onClick(() => this.uploadFile(file, "yuque"));
          });
        }

        if (published) {
          menu.addItem((item) => {
            item
              .setTitle("复制链接")
              .setIcon("link")
              .onClick(() => {
                void navigator.clipboard.writeText(published.url);
                new Notice("链接已复制到剪贴板");
              });
          });

          menu.addItem((item) => {
            item
              .setTitle("移除上传记录")
              .setIcon("trash")
              .onClick(() => this.removePublished(file));
          });
        }
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", (file: TAbstractFile, oldPath: string) => {
        if (!(file instanceof TFile)) return;
        const published = this.publishedNotes[oldPath];
        if (published) {
          this.publishedNotes[file.path] = published;
          delete this.publishedNotes[oldPath];
          void this.saveSettings();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file: TAbstractFile) => {
        if (!(file instanceof TFile)) return;
        if (this.publishedNotes[file.path]) {
          delete this.publishedNotes[file.path];
          void this.saveSettings();
        }
      })
    );

    this.addSettingTab(new NoteConnectorSettingTab(this.app, this));
  }

  private getActiveMarkdownFile(): TFile | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view?.file) return view.file;
    const file = this.app.workspace.getActiveFile?.();
    return file instanceof TFile && file.extension === "md" ? file : null;
  }

  private async uploadActiveNote(platform?: Platform): Promise<void> {
    const file = this.getActiveMarkdownFile();
    if (!file) {
      new Notice("没有打开的 Markdown 文件");
      return;
    }
    await this.uploadFile(file, platform);
  }

  async uploadFile(file: TFile, platform?: Platform): Promise<void> {
    const enabledPlatforms = this.getEnabledPlatforms();

    if (enabledPlatforms.length === 0) {
      new Notice("请在设置中启用至少一个平台（飞书或语雀）");
      return;
    }

    if (!platform) {
      platform = await this.selectPlatform(enabledPlatforms);
      if (!platform) return;
    }

    const provider = this.getProvider(platform);
    const existing = this.publishedNotes[file.path];
    const existingDocId =
      existing?.platform === platform ? existing.docId : undefined;

    const action = existingDocId ? "更新" : "上传";
    new Notice(`正在${action}到${provider.name}...`);

    try {
      const content = await this.app.vault.read(file);
      const title = file.basename;

      const result = await provider.publish(title, content, existingDocId);

      this.publishedNotes[file.path] = {
        platform,
        url: result.url,
        docId: result.docId,
        publishedAt: new Date().toISOString(),
      };
      await this.saveSettings();

      if (this.settings.storeFrontmatter) {
        await this.writeFrontmatter(file, platform, result.url);
      }

      await navigator.clipboard.writeText(result.url);
      new Notice(
        `${action}成功！链接已复制到剪贴板\n${result.url}`,
        8000
      );
    } catch (e) {
      new Notice(
        `${e instanceof Error ? e.message : "未知错误"}`,
        10000
      );
    }
  }

  private selectPlatform(platforms: Platform[]): Promise<Platform | undefined> {
    if (platforms.length === 1) return Promise.resolve(platforms[0]);

    const defaultPlatform = this.settings.defaultPlatform;
    if (defaultPlatform !== "ask" && platforms.includes(defaultPlatform)) {
      return Promise.resolve(defaultPlatform);
    }

    return new Promise((resolve) => {
      new PlatformSelectModal(this.app, platforms, (p) => resolve(p)).open();
    });
  }

  private getEnabledPlatforms(): Platform[] {
    const platforms: Platform[] = [];
    if (this.settings.feishu.enabled) platforms.push("feishu");
    if (this.settings.yuque.enabled) platforms.push("yuque");
    return platforms;
  }

  private getProvider(platform: Platform): NoteProvider {
    if (platform === "feishu") {
      return new FeishuProvider(this.settings.feishu);
    }
    return new YuqueProvider(this.settings.yuque);
  }

  private removePublished(file: TFile): void {
    new ConfirmModal(
      this.app,
      `移除"${file.basename}"的上传记录？（不会删除远端文档）`,
      async () => {
        delete this.publishedNotes[file.path];
        await this.saveSettings();
        await this.clearFrontmatter(file);
        new Notice("上传记录已移除");
      }
    ).open();
  }

  private async writeFrontmatter(
    file: TFile,
    platform: Platform,
    url: string
  ): Promise<void> {
    const key = platform === "feishu" ? "feishu_link" : "yuque_link";
    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (fm: Record<string, unknown>) => {
          fm[key] = url;
        }
      );
    } catch (e) {
      console.warn("Note Connector: 写入 frontmatter 失败", e);
    }
  }

  private async clearFrontmatter(file: TFile): Promise<void> {
    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (fm: Record<string, unknown>) => {
          delete fm["feishu_link"];
          delete fm["yuque_link"];
        }
      );
    } catch (e) {
      console.warn("Note Connector: 清除 frontmatter 失败", e);
    }
  }

  async loadSettings(): Promise<void> {
    const data = ((await this.loadData()) as Partial<PluginData> | null) ?? {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
    // 深合并子对象，避免覆盖默认字段
    this.settings.feishu = Object.assign(
      {},
      DEFAULT_SETTINGS.feishu,
      data.settings?.feishu
    );
    this.settings.yuque = Object.assign(
      {},
      DEFAULT_SETTINGS.yuque,
      data.settings?.yuque
    );
    this.publishedNotes = data.publishedNotes ?? {};
  }

  async saveSettings(): Promise<void> {
    const data: PluginData = {
      settings: this.settings,
      publishedNotes: this.publishedNotes,
    };
    await this.saveData(data);
  }
}
