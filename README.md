# Obsidian Note Connector

> One-click upload of Obsidian notes to Feishu Docs or Yuque knowledge base.

[中文文档](./README_CN.md)

## Features

- **Feishu Docs** — Upload via official `lark-cli`, stores the doc link in frontmatter
- **Yuque** — Upload via REST API using your personal token
- **Multi-platform** — Enable one or both platforms; a selector modal appears when both are active
- **Auto frontmatter** — Saves `feishu_link` / `yuque_link` in the note's YAML front matter after upload
- **Update support** — Re-uploading updates the existing Yuque document (Feishu creates a new version)
- **Desktop only** — Requires the Obsidian desktop app (uses Node.js child_process for CLI calls)

## Requirements

| Platform | Requirement |
|----------|-------------|
| Feishu   | `npm install -g @larksuite/cli` + `lark-cli config init` (OAuth login) |
| Yuque    | Personal access token from [yuque.com/settings/tokens](https://www.yuque.com/settings/tokens) |

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from [Releases](../../releases)
2. Create folder `.obsidian/plugins/obsidian-note-connector/`
3. Place the three files into that folder
4. Enable the plugin in Obsidian → Settings → Community plugins

## Configuration

Open **Settings → Note Connector**:

### Feishu

| Field | Description |
|-------|-------------|
| Enable Feishu | Toggle to activate |
| lark-cli path | Path to executable (default: `lark-cli`) |
| Folder Token | Target folder token in Feishu Drive (leave blank for root) |
| Feishu Domain | Your tenant URL, e.g. `https://xxx.feishu.cn` |

> Run `lark-cli config init` once to complete OAuth authentication before using.

### Yuque

| Field | Description |
|-------|-------------|
| Enable Yuque | Toggle to activate |
| Token | Personal access token |
| Repo path | `username/book-slug`, e.g. `zhangsan/my-notes` |

### General

| Field | Description |
|-------|-------------|
| Default platform | Which platform to use when clicking the toolbar icon |
| Store frontmatter | Whether to save the published URL in the note's YAML |

## Usage

- **Toolbar icon** (☁️) — Upload active note; shows platform selector if both enabled
- **Command palette** — `Upload to Feishu` / `Upload to Yuque` / `Copy uploaded link`
- **File context menu** — Right-click any `.md` file in the explorer

After a successful upload the link is automatically copied to your clipboard and (optionally) saved to frontmatter:

```yaml
---
feishu_link: https://feishu.cn/docx/XxXxXxXx
yuque_link: https://www.yuque.com/username/book/slug
---
```

## License

MIT
