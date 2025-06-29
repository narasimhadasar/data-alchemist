"use client";

import { useDataStore } from "@/lib/dataStore";
import { saveAs } from "file-saver";

function toCSV(data: any[]) {
  if (!data.length) return "";
  const keys = Object.keys(data[0]);
  const lines = [
    keys.join(","),
    ...data.map((row) =>
      keys.map((k) => JSON.stringify(row[k] ?? "")).join(",")
    ),
  ];
  return lines.join("\n");
}

export default function ExportButton() {
  const { data, rules } = useDataStore();

  const handleExport = () => {
    // Export rules.json
    const rulesBlob = new Blob(
      [JSON.stringify(rules, null, 2)],
      { type: "application/json" }
    );
    saveAs(rulesBlob, "rules.json");

    // Export clients.csv
    const clientsCSV = toCSV(data.clients);
    saveAs(new Blob([clientsCSV], { type: "text/csv" }), "clients.csv");

    // Export workers.csv
    const workersCSV = toCSV(data.workers);
    saveAs(new Blob([workersCSV], { type: "text/csv" }), "workers.csv");

    // Export tasks.csv
    const tasksCSV = toCSV(data.tasks);
    saveAs(new Blob([tasksCSV], { type: "text/csv" }), "tasks.csv");
  };

  return (
    <div className="mt-8">
      <button
        onClick={handleExport}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
         Export Cleaned Data 
         & Rules
      </button>
    </div>
  );
}
