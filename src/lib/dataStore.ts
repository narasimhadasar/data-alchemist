import { create } from "zustand";
import { persist } from "zustand/middleware";
import { validateAll, ValidationError } from "@/lib/validate";
import { defaultRules } from "@/lib/validationRules";

export interface Rule {
  id: string;
  entity: "clients" | "workers" | "tasks";
  field: string;
  validate: (value: any, row: any, fullData: any) => string | null;
  message: string;
  active: boolean;
  weight?: number;
}

type Client = Record<string, any>;
type Worker = Record<string, any>;
type Task = Record<string, any>;

interface DataStore {
  data: {
    clients: Client[];
    workers: Worker[];
    tasks: Task[];
  };
  valid: {
    clients: boolean;
    workers: boolean;
    tasks: boolean;
  };
  errors: ValidationError[];
  rules: Rule[];
  setData: (section: keyof DataStore["data"], value: any[]) => void;
  setValid: (section: keyof DataStore["valid"], value: boolean) => void;
  setRules: (rules: Rule[]) => void;
  addRule: (rule: Rule) => void;
  toggleRule: (id: string) => void;
  revalidate: () => void;
  initializeRules: () => void;
}

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      data: {
        clients: [],
        workers: [],
        tasks: [],
      },
      valid: {
        clients: false,
        workers: false,
        tasks: false,
      },
      errors: [],
      rules: [],

      setData: (section, value) => {
        set((state) => ({
          data: {
            ...state.data,
            [section]: value,
          },
        }));
        get().revalidate();
      },

      setValid: (section, value) =>
        set((state) => ({
          valid: {
            ...state.valid,
            [section]: value,
          },
        })),

      setRules: (rules) => {
        const validRules = rules.filter(
          (r): r is Rule =>
            typeof r === "object" &&
            typeof r.id === "string" &&
            (r.entity === "clients" || r.entity === "workers" || r.entity === "tasks") &&
            typeof r.field === "string" &&
            typeof r.validate === "function" &&
            typeof r.message === "string" &&
            typeof r.active === "boolean"
        );
        set(() => ({ rules: validRules }));
        get().revalidate();
      },

      addRule: (rule) => {
        const id = rule.id || `rule-${Date.now()}`;
        const newRule: Rule = { ...rule, id };
        set((state) => ({
          rules: [...state.rules, newRule],
        }));
        get().revalidate();
      },

      toggleRule: (id) => {
        const updated = get().rules.map((r) =>
          r.id === id ? { ...r, active: !r.active } : r
        );
        set({ rules: updated });
        get().revalidate();
      },

      revalidate: () => {
        const { clients, workers, tasks } = get().data;
        const { rules } = get();
        const validRules = rules.filter((r) => typeof r.validate === "function" && r.active);
        const validationErrors = validateAll(clients, workers, tasks, validRules);
        set(() => ({ errors: validationErrors }));
      },

      initializeRules: () => {
        if (get().rules.length === 0) {
          set(() => ({ rules: defaultRules }));
        }
      },
    }),
    {
      name: "data-alchemist-storage",
    }
  )
);
