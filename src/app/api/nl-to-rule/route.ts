// src/app/api/nl-to-rule/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { instruction } = await req.json();

    if (!instruction || instruction.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a meaningful instruction." },
        { status: 400 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: `You are an assistant that converts natural language instructions into rule objects. 
Return a JSON object with the following keys:
{
  "type": "string",
  "entity": "clients" | "workers" | "tasks",
  "field": "string",
  "validate": "JavaScript code as string",
  "message": "string shown when validation fails",
  "weight": number,
  "active": boolean
}`
          },
          {
            role: "user",
            content: instruction
          }
        ],
        temperature: 0.3,
        stream: false
      })
    });

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 500 });
    }

    let rule;
    try {
      rule = JSON.parse(content);
    } catch (e) {
      console.error("Parsing error:", e, content);
      return NextResponse.json({ error: "AI response is not valid JSON." }, { status: 500 });
    }

    return NextResponse.json({ rule });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Rule conversion failed", details: err.message },
      { status: 500 }
    );
  }
}
