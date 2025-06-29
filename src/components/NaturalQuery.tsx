"use client";

import { useState } from "react";
import { useDataStore } from "@/lib/dataStore";
import type { OpenAIStreamPayload } from "@/lib/openai";

export default function NaturalQuery() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, setData } = useDataStore();

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResult([]);
    setError(null);

    const payload: OpenAIStreamPayload = {
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        {
          role: "system",
          content: `You are a helpful data assistant. Given a user query and structured data, return a filtered array of rows (clients, workers, or tasks) in JSON only.
If the query is unclear or not about clients, workers, or tasks, return this JSON exactly:
[{ "error": "Unclear query. Please provide a task-related prompt." }]`,
        },
        {
          role: "user",
          content: `DATA:\n${JSON.stringify(data).slice(0, 10000)}\n\nQUERY:\n${query}`,
        },
      ],
      temperature: 0.2,
      stream: false,
    };

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        const resultData = json.data || [];

        // Handle gibberish or unrelated queries
        if (
          resultData.length === 1 &&
          typeof resultData[0] === "object" &&
          "error" in resultData[0]
        ) {
          setError(resultData[0].error);
        } else {
          setResult(resultData);

          const keys = resultData[0] ? Object.keys(resultData[0]) : [];
          if (keys.includes("ClientID")) setData("clients", resultData);
          else if (keys.includes("WorkerID")) setData("workers", resultData);
          else if (keys.includes("TaskID")) setData("tasks", resultData);
        }
      } else {
        setError(json.error || "Unknown error");
      }
    } catch (err) {
      setError("Failed to reach the AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 p-4 border rounded bg-gray-50 space-y-3">
      <h2 className="text-lg font-semibold"> Ask a Natural Language Query</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Show all tasks requiring devops"
        className="w-full border p-2 rounded"
      />
      <button
        onClick={handleQuery}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Ask AI
      </button>

      {loading && <p className="text-sm text-gray-500">Thinking...</p>}
      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      {result.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2"> Results (filtered data also applied to the grid):</h3>
          <pre className="text-sm bg-white p-3 rounded border max-h-96 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
