# Obsidian Note Connector

> 一键将 Obsidian 笔记上传到飞书知识库或语雀。

[English](./README.md)

## 功能特性

- **飞书文档** — 通过官方 `lark-cli` 上传，支持直接写入飞书知识库（Wiki）
- **语雀** — 通过 REST API 使用个人 Token 上传
- **多平台支持** — 可同时启用两个平台，点击时弹出选择框
- **自动写入 Frontmatter** — 上传成功后自动写入 `feishu_link` / `yuque_link`
- **更新支持** — 语雀支持更新已有文档；飞书重新上传会创建新文档

---

## 一、安装插件

1. 从 [Releases](../../releases) 下载 `main.js`、`manifest.json`、`styles.css`
2. 在 Vault 中创建目录 `.obsidian/plugins/obsidian-note-connector/`
3. 将三个文件放入该目录
4. 在 Obsidian → 设置 → 第三方插件 中启用 **Note Connector**

---

## 二、配置飞书上传

### 2.1 安装 lark-cli

```bash
npm install -g @larksuite/cli
```

安装完成后确认版本：

```bash
lark-cli --version
```

### 2.2 在飞书开发者后台创建应用

1. 打开 [飞书开发者后台](https://open.feishu.cn/app)
2. 点击「创建企业自建应用」
3. 进入应用后记录 **App ID** 和 **App Secret**
4. 在「权限管理」中开启以下权限并发布：
   - `drive:file:upload`（上传文件）
   - `wiki:node:move`（移动到知识库，如需 Wiki 功能）

### 2.3 注册应用到 lark-cli

```bash
lark-cli config init
```

按提示输入 App ID 和 App Secret。

> **这一步只是注册应用，还不能上传文档。必须继续执行第 2.4 步。**

### 2.4 完成用户 OAuth 登录（必须！）

```bash
lark-cli auth login --domain markdown,wiki,drive
```

执行后会打开浏览器，登录飞书账号并授权。**此步骤是实际上传权限的来源，缺少此步会报 `need_user_authorization` 错误。**

验证登录状态：

```bash
lark-cli auth status
```

看到你的飞书账号名则表示成功。

---

## 三、在 Obsidian 中配置插件

打开 **设置 → Note Connector → 飞书文档**，启用飞书上传后按以下说明填写：

### lark-cli 路径

> ⚠️ Obsidian 不继承系统 PATH（尤其是使用 nvm 时），**必须填写完整绝对路径**。

在终端执行以下命令，将输出结果粘贴到插件设置中：

```bash
which lark-cli
# 常见结果示例：
# /usr/local/bin/lark-cli
# /Users/你的用户名/.nvm/versions/node/v24.x.x/bin/lark-cli
```

### 飞书域名

从浏览器地址栏复制域名部分（不要复制路径）：

| 版本 | 域名 |
|------|------|
| 个人版飞书 | `https://my.feishu.cn` |
| 企业版飞书 | `https://公司名.feishu.cn` |
| Lark 国际版 | `https://www.larksuite.com` |

### 上传到知识库（Wiki）

**强烈建议开启此选项。** 关闭时文档仅上传到云盘，Bot 身份可能因权限问题报 `forbidden` 错误。

开启后需填写：

**Wiki Space ID**

- 个人知识库：直接填 `my_library`
- 企业知识库：在知识库页面按 F12，在网络请求中找 `space_id`

**Wiki 父节点 Token**

从知识库页面 URL 中获取，URL 最后一段即为 token：

```
https://my.feishu.cn/wiki/Ay7rwYV5SibzZ8k1PQ8cIxL3nlg
                               ↑ 这段就是父节点 Token
```

留空则上传到知识库根目录。

---

## 四、配置语雀上传

1. 打开 [语雀个人 Token 设置页](https://www.yuque.com/settings/tokens)
2. 创建 Token，权限勾选「读取与写入」
3. 在插件设置中填入 Token 和知识库路径

知识库路径格式为 `用户名/知识库slug`，从 URL 中获取：

```
https://www.yuque.com/zhangsan/my-notes
                      ↑ 用户名  ↑ 知识库slug
```

---

## 五、使用方式

| 操作 | 说明 |
|------|------|
| **工具栏图标** ☁️ | 上传当前打开的笔记 |
| **命令面板** | 搜索「上传到飞书」/「上传到语雀」/「复制已上传链接」 |
| **文件右键菜单** | 在文件浏览器中右键任意 `.md` 文件 |

上传成功后链接自动复制到剪贴板，并（可选）写入 frontmatter：

```yaml
---
feishu_link: https://my.feishu.cn/wiki/XxXxXxXx
yuque_link: https://www.yuque.com/username/book/slug
---
```

---

## 六、常见错误排查

### `lark-cli: command not found`

Obsidian 不继承 shell 的 PATH。解决：在终端运行 `which lark-cli`，将完整路径填入「lark-cli 路径」设置项。

### `need_user_authorization`

仅执行了 `lark-cli config init` 但没有执行用户登录。解决：

```bash
lark-cli auth login --domain markdown,wiki,drive
```

### `App scope not enabled: drive:file:upload`

飞书应用未开通上传权限。解决：在飞书开发者后台 → 权限管理 → 申请并发布 `drive:file:upload` 权限。

### `upload failed: forbidden`

通常是使用了云盘文件夹 Token 但 Bot 无访问权限。解决：在插件设置中开启「上传到知识库（Wiki）」，或将云盘文件夹 Token 清空（上传到根目录）。

### 上传成功但 URL 打不开

飞书域名填写错误。解决：打开飞书网页版，从地址栏复制正确的域名填入设置。

---

## License

MIT
