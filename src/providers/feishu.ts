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
      // lark-cli 使用 @content 语法读取文件内容
      let cmd = `"${cli}" markdown +create --name "${title}.md" --content @"${tmpFile}"`;
      if (this.config.folderId) {
        cmd += ` --folder-token "${this.config.folderId}"`;
      }

      const output = await execPromise(cmd);
      const fileToken = parseFileToken(output);

      if (!fileToken) {
        throw new Error(`无法从输出中提取文档 Token。\n原始输出:\n${output}`);
      }

      const baseUrl = this.config.baseUrl.replace(/\/$/, "");
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

function parseFileToken(output: string): string {
  // 尝试 JSON 解析
  try {
    const parsed = JSON.parse(output) as Record<string, unknown>;
    const token =
      (parsed.file_token as string) ||
      (parsed.token as string) ||
      ((parsed.data as Record<string, unknown>)?.file_token as string);
    if (token) return token;
  } catch {
    // 非 JSON 输出，尝试正则提取
  }

  // 从文本输出中提取 file_token
  const match = output.match(/file_token["\s:]+([A-Za-z0-9_-]{8,})/);
  return match ? match[1] : "";
}

function execPromise(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`执行失败: ${error.message}\n${stderr || ""}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}
