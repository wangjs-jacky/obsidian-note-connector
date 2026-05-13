import { PublishResult } from "../types";

export interface NoteProvider {
  readonly name: string;
  publish(title: string, content: string, existingDocId?: string): Promise<PublishResult>;
}
