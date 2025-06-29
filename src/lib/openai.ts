// lib/openai.ts
export interface OpenAIStreamPayload {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature: number;
  stream?: boolean;
}

export type Message = OpenAIStreamPayload["messages"][number];
