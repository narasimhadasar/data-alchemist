import { useDataStore } from "./dataStore";

export function useRules() {
  const { rules, setRules, toggleRule } = useDataStore();

  const activateRule = (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, active: true } : r
    );
    setRules(updated);
  };

  const deactivateRule = (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, active: false } : r
    );
    setRules(updated);
  };

  return { rules, setRules, toggleRule, activateRule, deactivateRule };
}
