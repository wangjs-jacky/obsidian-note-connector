import { exec } from "child_process";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { FeishuConfig, PublishResult } from "../types";
import { NoteProvider } from "./base";

export class FeishuProvider implements NoteProvider {
  readonly name = "飞书";

  constructor(private config: FeishuConfig) {}

  async publish(title: string, content: string): Promise<PublishResult> {
    const tmpFile = path.join(os.tmpdir(), `note-connector-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, content, "utf-8");

    try {
      const cli = this.config.cliPath || "lark-cli";
      const tmpFileName = path.basename(tmpFile);
      // drive +import 创建原生 docx，支持在飞书中直接编辑
      let cmd = `"${cli}" drive +import --file "./${tmpFileName}" --type docx --name "${title}" --as user`;
      if (this.config.folderId) {
        cmd += ` --folder-token "${this.config.folderId}"`;
      }

      const output = await execPromise(cmd, os.tmpdir());
      const fileToken = parseFileToken(output);

      if (!fileToken) {
        throw new Error(`无法从输出中提取文档 Token。\n原始输出:\n${output}`);
      }

      const baseUrl = this.config.baseUrl.replace(/\/$/, "");

      if (this.config.wikiEnabled) {
        const spaceId = this.config.wikiSpaceId || "my_library";
        let moveCmd = `"${cli}" wiki +move --obj-token "${fileToken}" --obj-type docx --target-space-id "${spaceId}" --as user`;
        if (this.config.wikiParentToken) {
          moveCmd += ` --target-parent-token "${this.config.wikiParentToken}"`;
        }
        const moveOutput = await execPromise(moveCmd);
        const wikiNodeToken = parseWikiNodeToken(moveOutput);
        if (wikiNodeToken) {
          const url = `${baseUrl}/wiki/${wikiNodeToken}`;
          return { url, docId: wikiNodeToken };
        }
      }

      const url = `${baseUrl}/docx/${fileToken}`;
      return { url, docId: fileToken };
    } finally {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // 忽略临时文件清理失败
      }
    }
  }
}

function extractJson(output: string): Record<string, unknown> | null {
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) return null;
  try {
    return JSON.parse(output.slice(jsonStart)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseFileToken(output: string): string {
  const parsed = extractJson(output);
  if (parsed) {
    const data = parsed.data as Record<string, unknown> | undefined;
    const token =
      (data?.token as string) ||       // drive +import 响应
      (data?.file_token as string) ||  // markdown +create 响应
      (parsed.file_token as string) ||
      (parsed.token as string);
    if (token) return token;
  }
  const match = output.match(/(?:file_token|"token")["\s:]+([A-Za-z0-9_-]{8,})/);
  return match ? match[1] : "";
}

function parseWikiNodeToken(output: string): string {
  const parsed = extractJson(output);
  if (parsed) {
    const data = parsed.data as Record<string, unknown> | undefined;
    const nodeToken =
      (data?.wiki_token as string) ||
      (data?.node_token as string) ||
      (parsed.wiki_token as string) ||
      (parsed.node_token as string);
    if (nodeToken) return nodeToken;
  }
  const match = output.match(/wiki_token["\s:]+([A-Za-z0-9_-]{8,})/);
  return match ? match[1] : "";
}

function execPromise(cmd: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      { maxBuffer: 10 * 1024 * 1024, cwd, env: { ...process.env, LARK_CLI_NO_PROXY: "1" } },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`执行失败: ${error.message}\n${stderr || stdout || ""}`));
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}
