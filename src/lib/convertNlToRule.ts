import { Rule } from "@/lib/dataStore";
import { v4 as uuidv4 } from "uuid";

export async function convertNlToRule(nlText: string): Promise<Rule | null> {
  try {
    const res = await fetch("/api/nl-to-rule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: nlText }),
    });

    const json = await res.json();

    if (!res.ok || !json.rule) {
      console.error("❌ Rule conversion failed:", json);
      return null;
    }

    const rule = json.rule;

    // Dynamically compile validate function
    if (typeof rule.validate === "string") {
      try {
        const fnBody = rule.validate
          .trim()
          .replace(/^function\s*\([^\)]*\)\s*{/, "")
          .replace(/}$/, "");

        rule.validate = new Function("value", "row", "fullData", fnBody);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("❌ Failed to create validate function:", err.message);
        } else {
          console.error("❌ Failed to create validate function:", err);
        }
        return null;
      }
    }

    rule.id = uuidv4();
    return rule as Rule;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ convertNlToRule (frontend) failed:", err.message);
    } else {
      console.error("❌ convertNlToRule (frontend) failed:", err);
    }
    return null;
  }
}
