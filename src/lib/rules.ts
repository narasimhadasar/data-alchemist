export type Rule = {
  id: string;
  entity: "clients" | "workers" | "tasks";
  field: string;
  message: string;
  test: (
    value: unknown,
    row: Record<string, unknown>,
    all: Record<string, unknown>[]
  ) => boolean;
  severity?: "error" | "warning";
};

export const defaultRules: Rule[] = [
  {
    id: "client-priority-range",
    entity: "clients",
    field: "PriorityLevel",
    message: "PriorityLevel must be 1-5",
    test: (val) => Number(val) >= 1 && Number(val) <= 5,
  },
  {
    id: "worker-slots-maxload",
    entity: "workers",
    field: "MaxLoadPerPhase",
    message: "AvailableSlots must contain enough slots for MaxLoadPerPhase",
    test: (val, row) => {
      try {
        const slotString = row.AvailableSlots;
        const parsed =
          typeof slotString === "string" ? slotString : JSON.stringify(slotString);

        const slots = JSON.parse(parsed);
        return Array.isArray(slots) && slots.length >= Number(val);
      } catch {
        return false;
      }
    },
  },
];
