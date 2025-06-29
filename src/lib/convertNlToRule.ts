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
      console.error(" Rule conversion failed:", json);
      return null;
    }

    const rule = json.rule;

    //  Dynamically compile validate function
    if (typeof rule.validate === "string") {
      try {
        // Use arrow function wrapper to avoid "Function statements require a function name" error
        const fnBody = rule.validate.trim().replace(/^function\s*\([^\)]*\)\s*{/, "").replace(/}$/, "");
        rule.validate = new Function("value", "row", "fullData", fnBody);
      } catch (err: unknown) {
        console.error(" Failed to create validate function:", err.message);
        return null;
      }
    }

    rule.id = uuidv4();
    return rule as Rule;
  } catch (err: unknown) {
    console.error(" convertNlToRule (frontend) failed:", err.message);
    return null;
  }
}
