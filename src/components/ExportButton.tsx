"use client";

import { useDataStore } from "@/lib/dataStore";
import { saveAs } from "file-saver";

function toCSV(data: unknown[]) {
  if (!data.length) return "";

  // Narrow type
  const firstRow = data[0] as Record<string, unknown>;
  const keys = Object.keys(firstRow);

  const lines = [
    keys.join(","), // header
    ...data.map((row) => {
      const safeRow = row as Record<string, unknown>;
      return keys.map((k) => JSON.stringify(safeRow[k] ?? "")).join(",");
    }),
  ];

  return lines.join("\n");
}

export default function ExportButton() {
  const { data, rules } = useDataStore();

  const handleExport = () => {
    // Export rules.json
    const rulesBlob = new Blob([JSON.stringify(rules, null, 2)], {
      type: "application/json",
    });
    saveAs(rulesBlob, "rules.json");

    // Export each dataset as CSV
    const exportData = [
      { filename: "clients.csv", content: toCSV(data.clients) },
      { filename: "workers.csv", content: toCSV(data.workers) },
      { filename: "tasks.csv", content: toCSV(data.tasks) },
    ];

    exportData.forEach(({ filename, content }) => {
      const blob = new Blob([content], { type: "text/csv" });
      saveAs(blob, filename);
    });
  };

  return (
    <div className="mt-8">
      <button
        onClick={handleExport}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Export Cleaned Data & Rules
      </button>
    </div>
  );
}
