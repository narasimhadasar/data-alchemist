import type { Rule } from "./dataStore";

export const defaultRules: Rule[] = [
  {
    id: "client-priority-range",
    entity: "clients",
    field: "PriorityLevel",
    validate: (value) => {
      const num = Number(value);
      return isNaN(num) || num < 1 || num > 5
        ? "PriorityLevel must be between 1 and 5"
        : null;
    },
    message: "PriorityLevel must be between 1 and 5",
    active: true,
    weight: 1,
  },
  {
    id: "task-duration-positive",
    entity: "tasks",
    field: "Duration",
    validate: (value) => {
      const num = Number(value);
      return isNaN(num) || num < 1 ? "Duration must be a positive number" : null;
    },
    message: "Duration must be a positive number",
    active: true,
    weight: 1,
  },
  {
    id: "worker-maxload-valid",
    entity: "workers",
    field: "MaxLoadPerPhase",
    validate: (value) => {
      const num = Number(value);
      return isNaN(num) || num < 1
        ? "MaxLoadPerPhase must be a positive number"
        : null;
    },
    message: "MaxLoadPerPhase must be valid",
    active: true,
    weight: 1,
  },
  {
    id: "client-json-valid",
    entity: "clients",
    field: "AttributesJSON",
    validate: (value) => {
      try {
        if (!value) return null;
        JSON.parse(value);
        return null;
      } catch {
        return "Invalid JSON";
      }
    },
    message: "AttributesJSON must be valid JSON",
    active: true,
    weight: 1,
  },
  {
    id: "worker-slots-valid",
    entity: "workers",
    field: "AvailableSlots",
    validate: (value) => {
      try {
        const parsed = Array.isArray(value) ? value : JSON.parse(value || "[]");
        return !Array.isArray(parsed) || parsed.some((x) => typeof x !== "number")
          ? "AvailableSlots must be an array of numbers"
          : null;
      } catch {
        return "Invalid format for AvailableSlots";
      }
    },
    message: "AvailableSlots must be an array of numbers",
    active: true,
    weight: 1,
  },
  {
    id: "client-task-reference",
    entity: "clients",
    field: "RequestedTaskIDs",
    validate: (value, row, data) => {
      const ids = String(value || "").split(/[,\s]+/).filter(Boolean);
      const known = new Set(data.tasks.map((t: unknown) => String(t.TaskID)));
      const invalid = ids.find((id: string) => !known.has(id));
      return invalid ? `Unknown TaskID: ${invalid}` : null;
    },
    message: "RequestedTaskIDs must refer to valid tasks",
    active: true,
    weight: 2,
  },
  {
    id: "task-skill-covered",
    entity: "tasks",
    field: "RequiredSkills",
    validate: (value, row, data) => {
      const skills = String(value || "")
        .split(/[,\s]+/)
        .map((s) => s.toLowerCase());
      const allSkills = new Set(
        data.workers.map((w: unknown) => w.Skill?.toLowerCase())
      );
      const missing = skills.find((s: string) => !allSkills.has(s));
      return missing ? `Missing skill coverage: ${missing}` : null;
    },
    message: "Each RequiredSkill must be covered by at least one worker",
    active: true,
    weight: 2,
  },
  {
    id: "task-co-run-cycle",
    entity: "tasks",
    field: "CoRunTaskIDs",
    validate: (_value, row, data) => {
      const graph = new Map<string, string[]>();
      for (const task of data.tasks) {
        const id = String(task.TaskID);
        const co = String(task.CoRunTaskIDs || "")
          .split(/[,\s]+/)
          .filter(Boolean);
        graph.set(id, co);
      }

      const visited = new Set<string>();
      const stack = new Set<string>();

      const dfs = (node: string): boolean => {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;
        visited.add(node);
        stack.add(node);
        for (const neighbor of graph.get(node) || []) {
          if (dfs(neighbor)) return true;
        }
        stack.delete(node);
        return false;
      };

      return dfs(String(row.TaskID)) ? "Circular co-run detected" : null;
    },
    message: "Tasks should not form a circular co-run chain",
    active: true,
    weight: 3,
  },
];
