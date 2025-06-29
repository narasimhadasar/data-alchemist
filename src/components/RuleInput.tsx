"use client";

import { useEffect, useState } from "react";
import { useDataStore } from "@/lib/dataStore";
import type { Rule } from "@/lib/dataStore";
import { defaultRules } from "@/lib/validationRules";
import { profiles } from "@/lib/presets";
import { convertNlToRule } from "@/lib/convertNlToRule";
import { fetchRuleSuggestions } from "@/lib/aiSuggestRules";

export default function RuleInput() {
  const rules = useDataStore((s) => s.rules);
  const toggleRule = useDataStore((s) => s.toggleRule);
  const setRules = useDataStore((s) => s.setRules);
  const addRule = useDataStore((s) => s.addRule);

  const [weights, setWeights] = useState<Record<string, number>>({});
  const [nlText, setNlText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  useEffect(() => {
    const initialWeights = Object.fromEntries(
      rules.map((r) => [r.id, r.weight ?? 1])
    );
    setWeights(initialWeights);
  }, [rules]);

  const loadSuggestions = async () => {
    setSuggestionLoading(true);
    const aiSuggestions = await fetchRuleSuggestions();
    setSuggestions(aiSuggestions);
    setSuggestionLoading(false);
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleWeightChange = (id: string, value: number) => {
    setWeights((prev) => ({ ...prev, [id]: value }));
    const updated = rules.map((r) =>
      r.id === id ? { ...r, weight: value } : r
    );
    setRules(updated);
  };

  const handleResetToDefault = () => {
    setRules(defaultRules);
  };

  const handleConvertRule = async (text?: string) => {
    const instruction = text ?? nlText;
    if (!instruction.trim()) return;
    setLoading(true);
    const newRule = await convertNlToRule(instruction);
    setLoading(false);
    if (newRule) {
      addRule(newRule);
      if (!text) setNlText("");
    } else {
      alert("❌ Failed to convert the rule. Try rephrasing.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Natural Language Rule Input */}
      <div className="border border-gray-300 p-4 rounded bg-gray-50">
        <label className="block font-medium text-sm mb-1">
          🧠 Add a Rule in Natural Language
        </label>
        <textarea
          value={nlText}
          onChange={(e) => setNlText(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="e.g. Ensure all tasks with duration over 2 phases are co-run with T12"
        />
        <button
          disabled={loading}
          onClick={() => handleConvertRule()}
          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {loading ? "Converting..." : "Convert to Rule"}
        </button>
      </div>

      {/* AI Rule Suggestions Panel */}
      <div className="border border-yellow-400 bg-yellow-50 p-4 rounded">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium mb-1 text-yellow-900">
            💡 AI Rule Suggestions
          </h3>
          <button
            onClick={loadSuggestions}
            disabled={suggestionLoading}
            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
          >
            {suggestionLoading ? "Regenerating..." : "🔁 Regenerate"}
          </button>
        </div>
        {suggestionLoading ? (
          <p className="text-sm text-yellow-800 mt-2">Thinking...</p>
        ) : (
          <ul className="list-disc pl-5 text-sm text-yellow-900 space-y-2 mt-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex justify-between items-start">
                <span className="mr-2 flex-1">{s}</span>
                <button
                  onClick={() => handleConvertRule(s)}
                  className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600"
                >
                  ➕ Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Preset Profile Selector */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Validation Rules</h2>
        <select
          onChange={(e) => {
            const selected = e.target.value;
            if (profiles[selected]) {
              setRules(profiles[selected]);
            }
          }}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="">Load Preset Profile</option>
          {Object.keys(profiles).map((profile) => (
            <option key={profile} value={profile}>
              {profile}
            </option>
          ))}
        </select>
      </div>

      {/* Rule Cards */}
      {rules.map((rule: Rule) => (
        <div
          key={rule.id}
          className="border border-gray-300 rounded p-4 shadow-sm bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex-1">
            <div className="text-sm text-gray-600">
              <strong>{rule.entity}.{rule.field}</strong>: {rule.message}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={rule.active}
                onChange={() => toggleRule(rule.id)}
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-1">
              <span className="text-sm">Weight:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={weights[rule.id] ?? 1}
                onChange={(e) =>
                  handleWeightChange(rule.id, Number(e.target.value))
                }
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
