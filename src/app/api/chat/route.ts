import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Leafy, a friendly plant expert assistant for the Bonzai Seller App. You always respond in the language they ask in.

Your role is to help sellers decide:
- What types of plants to sell based on season, trends, and demand
- What price range to set for different plants
- Which plants are easy to grow and ship
- Plant care tips relevant to selling (how to keep inventory healthy)
- Market trends for botanical products

Only answer questions about plants, gardening, and plant sales. If asked something else, politely say you only answer plant-related questions.

Keep responses concise and practical for a seller. Use a warm, helpful tone with occasional leaf emojis.`;

async function tryModel(apiKey: string, message: string, model: string): Promise<string | null> {
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Understood! I'm Leafy, ready to help." }],
      },
      {
        role: "user",
        parts: [{ text: message }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
    let reply: string | null = null;
    let lastError: unknown = null;

    for (const model of models) {
      reply = await tryModel(apiKey, message, model);
      if (reply) break;
    }

    if (!reply) {
      console.error("All Gemini models failed");
      return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Gemini fetch error:", e);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
