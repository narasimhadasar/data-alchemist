"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/dataStore";
import RuleInput from "@/components/RuleInput";
import { defaultRules } from "@/lib/validationRules";

export default function RuleEditorPage() {
  const rules = useDataStore((s) => s.rules);
  const setRules = useDataStore((s) => s.setRules);
  const revalidate = useDataStore((s) => s.revalidate);
  const errors = useDataStore((s) => s.errors);

  const validationRef = useRef<HTMLDivElement>(null);

  // Initialize default rules if empty
  useEffect(() => {
    if (rules.length === 0) {
      setRules(defaultRules);
    }
  }, [rules.length]);

  const handleRevalidate = () => {
    revalidate();
    setTimeout(() => {
      validationRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sortedErrors = [...errors].sort(
    (a, b) => (b.weight ?? 1) - (a.weight ?? 1)
  );

  return (
    <div className="p-6 space-y-6">
      {/*  Header: Title + Grid Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold"> Rule Configuration</h1>
        <Link href="/grid">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
             Go to Grid Page
          </button>
        </Link>
      </div>

      {/*  Rule Input */}
      <RuleInput />

      {/*  Re-Validate Button */}
      <button
        onClick={handleRevalidate}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Re-Validate Data
      </button>

      {/*  Validation Errors Section */}
      <div ref={validationRef}>
        {sortedErrors.length > 0 ? (
          <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-md mt-6">
            <h2 className="font-semibold mb-2">⚠ Validation Issues</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {sortedErrors.map((err, idx) => (
                <li key={idx}>
                  <strong>{err.entity}</strong> [Row {err.row + 1}] <em>{err.field}</em>: {err.message}
                  {typeof err.weight !== "undefined" && (
                    <span className="ml-2 text-xs text-gray-600">(Weight: {err.weight})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-green-600 mt-4">✅ No validation errors</p>
        )}
      </div>
    </div>
  );
}
