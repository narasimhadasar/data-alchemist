import { Row } from "./types";
import type { Rule } from "./dataStore";

export interface ValidationError {
  entity: "clients" | "workers" | "tasks";
  row: number;
  field: string;
  message: string;
  weight?: number;
}

export function validateAll(
  clients: Row[],
  workers: Row[],
  tasks: Row[],
  rules?: Rule[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  const activeRules = rules?.filter((r) => r.active) ?? [];
  const hasRuleConfig = Array.isArray(rules);
  const allRulesInactive = hasRuleConfig && activeRules.length === 0;
  const shouldRunStatic = !hasRuleConfig;

  //  Case 1: Rules are given but none are active — no validation
  if (allRulesInactive) {
    return [];
  }

  //  Case 2: Some rules active — run only active dynamic rules
  if (activeRules.length > 0) {
    const data = { clients, workers, tasks }; //  fix: define full dataset here
    for (const rule of activeRules) {
      const rows = data[rule.entity];
      rows.forEach((row, index) => {
        const value = row[rule.field];
        const message = rule.validate(value, row, data); //  fixed: pass correct data
        if (message) {
          errors.push({
            entity: rule.entity,
            row: index,
            field: rule.field,
            message,
            weight: rule.weight ?? 1,
          });
        }
      });
    }
  }

  //  Case 3: No rule system in place — run static built-in validations
  if (shouldRunStatic) {
    const add = (e: ValidationError) => errors.push({ ...e, weight: 1 });

    const checkDuplicates = (rows: Row[], field: string, entity: ValidationError["entity"]) => {
      const seen = new Map<string, number>();
      rows.forEach((row, i) => {
        const val = String(row[field]).trim();
        if (seen.has(val)) {
          add({ entity, row: i, field, message: "Duplicate ID" });
        } else {
          seen.set(val, i);
        }
      });
    };
    checkDuplicates(clients, "ClientID", "clients");
    checkDuplicates(workers, "WorkerID", "workers");
    checkDuplicates(tasks, "TaskID", "tasks");

    clients.forEach((c, i) => {
      const p = Number(c.PriorityLevel);
      if (isNaN(p) || p < 1 || p > 5) {
        add({ entity: "clients", row: i, field: "PriorityLevel", message: "PriorityLevel must be 1-5" });
      }
    });

    tasks.forEach((t, i) => {
      const d = Number(t.Duration);
      if (isNaN(d) || d < 1) {
        add({ entity: "tasks", row: i, field: "Duration", message: "Duration must be ≥1" });
      }
    });

    clients.forEach((c, i) => {
      try {
        if (c.AttributesJSON) JSON.parse(c.AttributesJSON);
      } catch {
        add({ entity: "clients", row: i, field: "AttributesJSON", message: "Invalid JSON" });
      }
    });

    workers.forEach((w, i) => {
      try {
        const slots = Array.isArray(w.AvailableSlots)
          ? w.AvailableSlots
          : JSON.parse(w.AvailableSlots || "[]");
        if (!Array.isArray(slots) || slots.some((x) => typeof x !== "number")) {
          add({ entity: "workers", row: i, field: "AvailableSlots", message: "Must be an array of numbers" });
        }
      } catch {
        add({ entity: "workers", row: i, field: "AvailableSlots", message: "Invalid list format" });
      }
    });

    const taskIDs = new Set(tasks.map((t) => String(t.TaskID)));
    clients.forEach((c, i) => {
      const ids = String(c.RequestedTaskIDs || "").split(/[,\s]+/).filter(Boolean);
      ids.forEach((tid) => {
        if (!taskIDs.has(tid)) {
          add({ entity: "clients", row: i, field: "RequestedTaskIDs", message: `Unknown TaskID: ${tid}` });
        }
      });
    });

    const coRunGraph = new Map<string, Set<string>>();
    tasks.forEach((t) => {
      const id = String(t.TaskID);
      const coRuns = String(t.CoRunTaskIDs || "").split(/[,\s]+/).filter(Boolean);
      if (!coRunGraph.has(id)) coRunGraph.set(id, new Set());
      coRuns.forEach((cr) => coRunGraph.get(id)?.add(cr));
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const detectCycle = (node: string): boolean => {
      if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);
        for (const neighbor of coRunGraph.get(node) || []) {
          if (!visited.has(neighbor) && detectCycle(neighbor)) return true;
          else if (recStack.has(neighbor)) return true;
        }
      }
      recStack.delete(node);
      return false;
    };
    for (const t of tasks) {
      const id = String(t.TaskID);
      if (detectCycle(id)) {
        add({ entity: "tasks", row: tasks.findIndex(tt => tt.TaskID == id), field: "CoRunTaskIDs", message: "Circular co-run detected" });
        break;
      }
    }

    workers.forEach((w, i) => {
      try {
        const slots = Array.isArray(w.AvailableSlots)
          ? w.AvailableSlots
          : JSON.parse(w.AvailableSlots || "[]");
        const max = Number(w.MaxLoadPerPhase);
        if (!isNaN(max) && slots.length < max) {
          add({ entity: "workers", row: i, field: "MaxLoadPerPhase", message: "Slots < MaxLoad" });
        }
      } catch {}
    });

    const phaseUsage = new Map<number, number>();
    tasks.forEach((t) => {
      const duration = Number(t.Duration);
      const phases = String(t.PreferredPhases || "").split(/[,\s]+/).map(Number).filter((n) => !isNaN(n));
      phases.forEach((p) => {
        phaseUsage.set(p, (phaseUsage.get(p) || 0) + duration);
      });
    });

    const totalSlots = workers.flatMap((w) => {
      try {
        return Array.isArray(w.AvailableSlots) ? w.AvailableSlots : JSON.parse(w.AvailableSlots || "[]");
      } catch {
        return [];
      }
    });
    const maxPhase = Math.max(...phaseUsage.keys(), 0);
    for (let p = 1; p <= maxPhase; p++) {
      const used = phaseUsage.get(p) || 0;
      const avail = totalSlots.filter((slot) => slot === p).length;
      if (used > avail) {
        add({ entity: "tasks", row: -1, field: `PreferredPhases`, message: `Phase ${p} overbooked: ${used} > ${avail}` });
      }
    }

    const allSkills = new Set(workers.map((w) => w.Skill?.toLowerCase()));
    tasks.forEach((t, i) => {
      const skills = String(t.RequiredSkills || "").split(/[,\s]+/).map((s) => s.toLowerCase());
      skills.forEach((s) => {
        if (!allSkills.has(s)) {
          add({ entity: "tasks", row: i, field: "RequiredSkills", message: `Missing skill coverage: ${s}` });
        }
      });
    });
  }

  //  Final: Sort all errors by weight (descending)
  return errors.sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
}
