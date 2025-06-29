// src/app/api/suggest-rules/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        temperature: 0.3,
        stream: false,
        messages: [
          {
            role: "system",
            content: `You are an assistant that analyzes structured datasets (clients, workers, tasks) and recommends useful validation rules in natural language.\n\nReturn 3–5 rules that could help ensure clean and efficient data, based on patterns you see.\n\nExample format:\n[\n  "Tasks T12 and T14 always run together — consider a co-run rule.",\n  "Client group 'Sales' appears overloaded — suggest a slot restriction.",\n  ...\n]`,
          },
          {
            role: "user",
            content: `DATA:\n${JSON.stringify(data)}`,
          },
        ],
      }),
    });

    const result = await response.json();
    const suggestionsText = result?.choices?.[0]?.message?.content;

    if (!suggestionsText) {
      return NextResponse.json(
        { error: "No suggestions returned." },
        { status: 500 }
      );
    }

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(suggestionsText);
    } catch {
      suggestions = suggestionsText
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line);
    }

    return NextResponse.json({ suggestions });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";

    return NextResponse.json(
      { error: "Suggestion generation failed", details: message },
      { status: 500 }
    );
  }
}
