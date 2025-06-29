// src/lib/presets.ts

import { defaultRules } from "./validationRules";
import type { Rule } from "./dataStore";

export const profiles: Record<string, Rule[]> = {
  "Default Rules": defaultRules,

  "Maximize Fulfillment": defaultRules.map((r) => ({
    ...r,
    weight:
      r.field === "RequestedTaskIDs"
        ? 10
        : r.field === "PriorityLevel"
        ? 9
        : 3,
  })),

  "Fair Distribution": defaultRules.map((r) => ({
    ...r,
    weight:
      r.field === "MaxLoadPerPhase"
        ? 10
        : r.field === "AvailableSlots"
        ? 9
        : 4,
  })),

  "Minimize Workload": defaultRules.map((r) => ({
    ...r,
    weight:
      r.field === "Duration"
        ? 10
        : r.field === "CoRunTaskIDs"
        ? 8
        : 5,
  })),
};
