import { App, PluginSettingTab, Setting } from "obsidian";
import type NoteConnectorPlugin from "./main";

export class NoteConnectorSettingTab extends PluginSettingTab {
  plugin: NoteConnectorPlugin;

  constructor(app: App, plugin: NoteConnectorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Note Connector 设置" });

    // ──────────────── 飞书 ────────────────
    containerEl.createEl("h3", { text: "飞书文档" });

    new Setting(containerEl)
      .setName("启用飞书上传")
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.feishu.enabled)
          .onChange(async (v) => {
            this.plugin.settings.feishu.enabled = v;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.feishu.enabled) {
      new Setting(containerEl)
        .setName("lark-cli 路径")
        .setDesc("lark-cli 可执行文件的路径，默认 lark-cli（需在 PATH 中）")
        .addText((t) =>
          t
            .setPlaceholder("lark-cli")
            .setValue(this.plugin.settings.feishu.cliPath)
            .onChange(async (v) => {
              this.plugin.settings.feishu.cliPath = v.trim() || "lark-cli";
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("目标文件夹 Token")
        .setDesc("飞书云盘中目标文件夹的 folder_token，留空则上传到根目录")
        .addText((t) =>
          t
            .setPlaceholder("fldcnXXXXXX")
            .setValue(this.plugin.settings.feishu.folderId)
            .onChange(async (v) => {
              this.plugin.settings.feishu.folderId = v.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("飞书域名")
        .setDesc("你的飞书租户域名，如 https://xxx.feishu.cn 或 https://feishu.cn")
        .addText((t) =>
          t
            .setPlaceholder("https://feishu.cn")
            .setValue(this.plugin.settings.feishu.baseUrl)
            .onChange(async (v) => {
              this.plugin.settings.feishu.baseUrl = v.trim() || "https://feishu.cn";
              await this.plugin.saveSettings();
            })
        );

      containerEl.createEl("p", {
        text: "⚠️ 需要提前运行 lark-cli config init 完成认证配置",
        cls: "note-connector-published-info",
      });
    }

    // ──────────────── 语雀 ────────────────
    containerEl.createEl("h3", { text: "语雀知识库" });

    new Setting(containerEl)
      .setName("启用语雀上传")
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.yuque.enabled)
          .onChange(async (v) => {
            this.plugin.settings.yuque.enabled = v;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.yuque.enabled) {
      new Setting(containerEl)
        .setName("语雀 Token")
        .setDesc("从 https://www.yuque.com/settings/tokens 获取")
        .addText((t) => {
          t
            .setPlaceholder("your-token")
            .setValue(this.plugin.settings.yuque.token)
            .onChange(async (v) => {
              this.plugin.settings.yuque.token = v.trim();
              await this.plugin.saveSettings();
            });
          const input = t.inputEl;
          input.type = "password";
          return t;
        });

      new Setting(containerEl)
        .setName("知识库路径")
        .setDesc("格式：用户名/知识库slug，如 zhangsan/my-notes")
        .addText((t) =>
          t
            .setPlaceholder("username/book-slug")
            .setValue(this.plugin.settings.yuque.namespace)
            .onChange(async (v) => {
              this.plugin.settings.yuque.namespace = v.trim();
              await this.plugin.saveSettings();
            })
        );
    }

    // ──────────────── 通用 ────────────────
    containerEl.createEl("h3", { text: "通用设置" });

    new Setting(containerEl)
      .setName("默认平台")
      .setDesc("点击工具栏图标时的默认行为")
      .addDropdown((d) => {
        d.addOption("ask", "每次询问");
        if (this.plugin.settings.feishu.enabled) d.addOption("feishu", "飞书");
        if (this.plugin.settings.yuque.enabled) d.addOption("yuque", "语雀");
        d.setValue(this.plugin.settings.defaultPlatform);
        d.onChange(async (v) => {
          this.plugin.settings.defaultPlatform = v as "feishu" | "yuque" | "ask";
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("保存链接到 Frontmatter")
      .setDesc("上传后将文档链接写入笔记的 frontmatter 属性")
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.storeFrontmatter)
          .onChange(async (v) => {
            this.plugin.settings.storeFrontmatter = v;
            await this.plugin.saveSettings();
          })
      );
  }
}
