export type Platform = "feishu" | "yuque";

export interface FeishuConfig {
  enabled: boolean;
  cliPath: string;
  folderId: string;
  baseUrl: string;
  wikiEnabled: boolean;
  wikiSpaceId: string;
  wikiParentToken: string;
}

export interface YuqueConfig {
  enabled: boolean;
  token: string;
  namespace: string;
  apiBase: string;
}

export interface PluginSettings {
  feishu: FeishuConfig;
  yuque: YuqueConfig;
  storeFrontmatter: boolean;
  defaultPlatform: Platform | "ask";
}

export const DEFAULT_SETTINGS: PluginSettings = {
  feishu: {
    enabled: false,
    cliPath: "lark-cli",
    folderId: "",
    baseUrl: "https://my.feishu.cn",
    wikiEnabled: false,
    wikiSpaceId: "my_library",
    wikiParentToken: "",
  },
  yuque: {
    enabled: false,
    token: "",
    namespace: "",
    apiBase: "https://www.yuque.com/api/v2",
  },
  storeFrontmatter: true,
  defaultPlatform: "ask",
};

export interface PublishedNote {
  platform: Platform;
  url: string;
  docId: string;
  publishedAt: string;
}

export interface PluginData {
  settings: PluginSettings;
  publishedNotes: Record<string, PublishedNote>;
}

export interface PublishResult {
  url: string;
  docId: string;
}
