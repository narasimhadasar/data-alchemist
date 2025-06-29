// src/lib/aiSuggestRules.ts
import { useDataStore } from "./dataStore";

export async function fetchRuleSuggestions(): Promise<string[]> {
  const data = useDataStore.getState().data;

  try {
    const res = await fetch("/api/suggest-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("❌ Suggestion failed:", json);
      return [];
    }

    return json.suggestions || [];
  } catch (err: unknown) {
    console.error("❌ fetchRuleSuggestions failed:", err.message);
    return [];
  }
}
