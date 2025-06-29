import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model || "mistralai/mistral-7b-instruct:free",
        messages: body.messages,
        temperature: body.temperature || 0.2,
        stream: false,
      }),
    });

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;

    console.log(" Full OpenRouter response:", JSON.stringify(result, null, 2));
    console.log(" OpenRouter Raw Content:", content);

    let parsedData: any[] = [];

    try {
      // Extract anything inside a ```json ... ``` block OR plain array
      const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
      const match = content?.match(jsonBlockRegex);
      const jsonString = match ? match[1] : content;

      parsedData = JSON.parse(jsonString || "[]");

      // Ensure it's an array
      if (!Array.isArray(parsedData)) {
        parsedData = [{ error: "Response is not a valid array. Try a different prompt." }];
      }
    } catch (err) {
      console.error(" Failed to parse content as JSON:", err);
      parsedData = [{ error: "AI response was not in valid JSON format." }];
    }

    return NextResponse.json({ data: parsedData });
  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    return NextResponse.json(
      { error: "AI processing failed", details: error.message },
      { status: 500 }
    );
  }
}
