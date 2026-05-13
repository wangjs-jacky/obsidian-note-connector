import { requestUrl } from "obsidian";
import { YuqueConfig, PublishResult } from "../types";
import { NoteProvider } from "./base";

interface YuqueDocData {
  id: number;
  slug: string;
  title: string;
}

interface YuqueResponse {
  data: YuqueDocData;
}

export class YuqueProvider implements NoteProvider {
  readonly name = "语雀";

  constructor(private config: YuqueConfig) {}

  private get headers(): Record<string, string> {
    return {
      "X-Auth-Token": this.config.token,
      "Content-Type": "application/json",
      "User-Agent": "obsidian-note-connector/0.1.0",
    };
  }

  private get apiBase(): string {
    return this.config.apiBase.replace(/\/$/, "");
  }

  async publish(
    title: string,
    content: string,
    existingDocId?: string
  ): Promise<PublishResult> {
    if (!this.config.token) throw new Error("请在设置中配置语雀 Token");
    if (!this.config.namespace) throw new Error("请在设置中配置语雀知识库路径（如 username/repo）");

    const body = JSON.stringify({
      title,
      body: content,
      format: "markdown",
      status: 1,
    });

    if (existingDocId) {
      const res = await requestUrl({
        url: `${this.apiBase}/repos/${this.config.namespace}/docs/${existingDocId}`,
        method: "PUT",
        headers: this.headers,
        body,
        throw: false,
      });
      assertOk(res.status, res.json as Record<string, unknown>, "更新语雀文档");
      const data = (res.json as YuqueResponse).data;
      return {
        url: `https://www.yuque.com/${this.config.namespace}/${data.slug}`,
        docId: String(data.id),
      };
    } else {
      const res = await requestUrl({
        url: `${this.apiBase}/repos/${this.config.namespace}/docs`,
        method: "POST",
        headers: this.headers,
        body,
        throw: false,
      });
      assertOk(res.status, res.json as Record<string, unknown>, "创建语雀文档");
      const data = (res.json as YuqueResponse).data;
      return {
        url: `https://www.yuque.com/${this.config.namespace}/${data.slug}`,
        docId: String(data.id),
      };
    }
  }
}

function assertOk(
  status: number,
  json: Record<string, unknown>,
  context: string
): void {
  if (status >= 400) {
    const msg =
      typeof json?.message === "string"
        ? json.message
        : `请求失败，状态码 ${status}`;
    throw new Error(`${context}: ${msg}`);
  }
}
