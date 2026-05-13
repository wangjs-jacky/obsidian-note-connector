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
      // 配置向导
      const guideEl = containerEl.createDiv({ cls: "note-connector-guide" });
      guideEl.createEl("p", {
        text: "📋 首次配置请按以下步骤操作（终端中执行）：",
        cls: "note-connector-guide-title",
      });

      const steps = [
        {
          step: "第一步：安装 lark-cli",
          cmd: "npm install -g @larksuite/cli",
          note: "",
        },
        {
          step: "第二步：配置应用（App ID / Secret）",
          cmd: "lark-cli config init",
          note: "在飞书开发者后台创建自建应用后获取",
        },
        {
          step: "第三步：OAuth 用户登录（必须！）",
          cmd: "lark-cli auth login --domain markdown,wiki,drive",
          note: "会打开浏览器授权页，完成后才能上传",
        },
      ];

      steps.forEach(({ step, cmd, note }) => {
        const stepEl = guideEl.createDiv({ cls: "note-connector-step" });
        stepEl.createEl("span", { text: step, cls: "note-connector-step-title" });
        const codeEl = stepEl.createEl("code", { text: cmd, cls: "note-connector-step-cmd" });
        codeEl.style.display = "block";
        codeEl.style.margin = "4px 0";
        codeEl.style.padding = "4px 8px";
        codeEl.style.background = "var(--background-secondary)";
        codeEl.style.borderRadius = "4px";
        codeEl.style.fontSize = "0.85em";
        codeEl.style.userSelect = "all";
        if (note) {
          stepEl.createEl("span", { text: `（${note}）`, cls: "note-connector-step-note" });
        }
      });

      guideEl.createEl("p", {
        text: "⚠️ 注意：步骤二和步骤三缺一不可。config init 只注册应用，auth login 才是用户授权登录。",
        cls: "note-connector-warn",
      });

      // lark-cli 路径
      new Setting(containerEl)
        .setName("lark-cli 路径")
        .setDesc(
          createFragment((f) => {
            f.appendText("lark-cli 可执行文件的完整路径。");
            f.createEl("br");
            f.appendText("Obsidian 不继承 shell 的 PATH，必须填绝对路径。");
            f.createEl("br");
            f.appendText("查找路径：终端执行 ");
            f.createEl("code", { text: "which lark-cli" });
            f.appendText("，将结果粘贴到此处。");
            f.createEl("br");
            f.appendText("使用 nvm 的常见路径：");
            f.createEl("code", { text: "~/.nvm/versions/node/v24.x.x/bin/lark-cli" });
          })
        )
        .addText((t) =>
          t
            .setPlaceholder("/usr/local/bin/lark-cli")
            .setValue(this.plugin.settings.feishu.cliPath)
            .onChange(async (v) => {
              this.plugin.settings.feishu.cliPath = v.trim() || "lark-cli";
              await this.plugin.saveSettings();
            })
        );

      // 飞书域名
      new Setting(containerEl)
        .setName("飞书域名")
        .setDesc(
          createFragment((f) => {
            f.appendText("打开飞书网页版，从浏览器地址栏复制域名部分。");
            f.createEl("br");
            f.appendText("个人版飞书（feishu.cn）：");
            f.createEl("code", { text: "https://my.feishu.cn" });
            f.createEl("br");
            f.appendText("企业版飞书：");
            f.createEl("code", { text: "https://公司名.feishu.cn" });
            f.createEl("br");
            f.appendText("Lark（国际版）：");
            f.createEl("code", { text: "https://www.larksuite.com" });
          })
        )
        .addText((t) =>
          t
            .setPlaceholder("https://my.feishu.cn")
            .setValue(this.plugin.settings.feishu.baseUrl)
            .onChange(async (v) => {
              this.plugin.settings.feishu.baseUrl = v.trim() || "https://my.feishu.cn";
              await this.plugin.saveSettings();
            })
        );

      // Wiki 开关
      new Setting(containerEl)
        .setName("上传到知识库（Wiki）")
        .setDesc("启用后：先在云盘创建文档，再自动移入飞书知识库。关闭则仅上传到云盘。")
        .addToggle((t) =>
          t
            .setValue(this.plugin.settings.feishu.wikiEnabled)
            .onChange(async (v) => {
              this.plugin.settings.feishu.wikiEnabled = v;
              await this.plugin.saveSettings();
              this.display();
            })
        );

      if (this.plugin.settings.feishu.wikiEnabled) {
        new Setting(containerEl)
          .setName("Wiki Space ID")
          .setDesc(
            createFragment((f) => {
              f.appendText("知识库空间 ID。");
              f.createEl("br");
              f.appendText("个人知识库直接填：");
              f.createEl("code", { text: "my_library" });
              f.createEl("br");
              f.appendText("企业知识库：在飞书知识库页面按 F12 → 网络请求中查找 space_id。");
            })
          )
          .addText((t) =>
            t
              .setPlaceholder("my_library")
              .setValue(this.plugin.settings.feishu.wikiSpaceId)
              .onChange(async (v) => {
                this.plugin.settings.feishu.wikiSpaceId = v.trim() || "my_library";
                await this.plugin.saveSettings();
              })
          );

        new Setting(containerEl)
          .setName("Wiki 父节点 Token")
          .setDesc(
            createFragment((f) => {
              f.appendText("文档上传后放入哪个知识库节点，留空则放到根目录。");
              f.createEl("br");
              f.appendText("获取方式：打开目标知识库页面，URL 最后一段即为 token。");
              f.createEl("br");
              f.appendText("例：");
              f.createEl("code", {
                text: "https://my.feishu.cn/wiki/Ay7rwYV5Sib... → Ay7rwYV5Sib...",
              });
            })
          )
          .addText((t) =>
            t
              .setPlaceholder("Ay7rwYV5SibzZ8k1PQ8cIxL3nlg")
              .setValue(this.plugin.settings.feishu.wikiParentToken)
              .onChange(async (v) => {
                this.plugin.settings.feishu.wikiParentToken = v.trim();
                await this.plugin.saveSettings();
              })
          );
      }

      if (!this.plugin.settings.feishu.wikiEnabled) {
        new Setting(containerEl)
          .setName("云盘目标文件夹 Token")
          .setDesc(
            createFragment((f) => {
              f.appendText("上传到哪个云盘文件夹，留空则上传到我的云盘根目录。");
              f.createEl("br");
              f.appendText("⚠️ Bot 身份无法访问个人文件夹，如报 forbidden 请留空或切换到知识库模式。");
            })
          )
          .addText((t) =>
            t
              .setPlaceholder("fldcnXXXXXX（留空即可）")
              .setValue(this.plugin.settings.feishu.folderId)
              .onChange(async (v) => {
                this.plugin.settings.feishu.folderId = v.trim();
                await this.plugin.saveSettings();
              })
          );
      }
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
        .setDesc(
          createFragment((f) => {
            f.appendText("个人访问 Token，前往 ");
            f.createEl("a", {
              text: "yuque.com/settings/tokens",
              href: "https://www.yuque.com/settings/tokens",
            });
            f.appendText(" 创建。");
          })
        )
        .addText((t) => {
          t
            .setPlaceholder("your-token")
            .setValue(this.plugin.settings.yuque.token)
            .onChange(async (v) => {
              this.plugin.settings.yuque.token = v.trim();
              await this.plugin.saveSettings();
            });
          t.inputEl.type = "password";
          return t;
        });

      new Setting(containerEl)
        .setName("知识库路径")
        .setDesc(
          createFragment((f) => {
            f.appendText("格式：");
            f.createEl("code", { text: "用户名/知识库slug" });
            f.createEl("br");
            f.appendText("从知识库 URL 中获取：");
            f.createEl("code", { text: "yuque.com/zhangsan/my-notes → zhangsan/my-notes" });
          })
        )
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
