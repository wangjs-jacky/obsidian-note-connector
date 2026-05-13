# Obsidian Note Connector

> 一键将 Obsidian 笔记上传到飞书文档或语雀知识库。

[English](./README.md)

## 功能特性

- **飞书文档** — 通过官方 `lark-cli` 上传，自动将文档链接写入 frontmatter
- **语雀** — 通过 REST API 使用个人 Token 上传
- **多平台支持** — 可同时启用两个平台，点击时弹出选择框
- **自动写入 Frontmatter** — 上传成功后自动写入 `feishu_link` / `yuque_link`
- **更新支持** — 语雀支持更新已有文档；飞书重新上传会创建新文档
- **仅桌面端** — 需要 Obsidian 桌面版（使用 Node.js child_process 调用 CLI）

## 环境要求

| 平台 | 要求 |
|------|------|
| 飞书 | `npm install -g @larksuite/cli` + `lark-cli config init`（OAuth 登录） |
| 语雀 | 在 [yuque.com/settings/tokens](https://www.yuque.com/settings/tokens) 获取个人 Token |

## 安装方式

1. 从 [Releases](../../releases) 下载 `main.js`、`manifest.json`、`styles.css`
2. 在 Obsidian Vault 中创建目录 `.obsidian/plugins/obsidian-note-connector/`
3. 将三个文件放入该目录
4. 在 Obsidian → 设置 → 第三方插件 中启用 Note Connector

## 配置说明

打开 **设置 → Note Connector**：

### 飞书设置

| 字段 | 说明 |
|------|------|
| 启用飞书上传 | 开关 |
| lark-cli 路径 | 可执行文件路径，默认 `lark-cli`（需在 PATH 中） |
| 目标文件夹 Token | 飞书云盘中目标文件夹的 folder_token，留空则上传到根目录 |
| 飞书域名 | 你的租户域名，如 `https://xxx.feishu.cn` |

> 首次使用前需运行 `lark-cli config init` 完成 OAuth 认证。

### 语雀设置

| 字段 | 说明 |
|------|------|
| 启用语雀上传 | 开关 |
| 语雀 Token | 个人访问 Token |
| 知识库路径 | `用户名/知识库slug`，如 `zhangsan/my-notes` |

### 通用设置

| 字段 | 说明 |
|------|------|
| 默认平台 | 点击工具栏图标时的默认平台 |
| 保存到 Frontmatter | 上传后是否将链接写入笔记 YAML |

## 使用方式

- **工具栏图标**（☁️）— 上传当前笔记；两个平台都启用时弹出选择框
- **命令面板** — `上传到飞书` / `上传到语雀` / `复制已上传链接`
- **文件右键菜单** — 在文件浏览器中右键任意 `.md` 文件

上传成功后链接自动复制到剪贴板，并（可选）写入 frontmatter：

```yaml
---
feishu_link: https://feishu.cn/docx/XxXxXxXx
yuque_link: https://www.yuque.com/username/book/slug
---
```

## License

MIT
