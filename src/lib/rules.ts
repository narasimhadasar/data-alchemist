export type Rule = {
  id: string;
  entity: "clients" | "workers" | "tasks";
  field: string;
  message: string;
  test: (value: any, row: Record<string, any>, all: Record<string, any>[]) => boolean;
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
    message: "Slots < MaxLoad",
    test: (val, row) => {
      try {
        const slots = JSON.parse(row.AvailableSlots || "[]");
        return Array.isArray(slots) && slots.length >= Number(val);
      } catch {
        return false;
      }
    },
  },
];
