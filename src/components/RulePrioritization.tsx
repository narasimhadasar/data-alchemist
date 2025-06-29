// src/components/RulePrioritization.tsx
"use client";

import { useDataStore } from "@/lib/dataStore";
import { Rule } from "@/lib/dataStore";
import { useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRuleItem({ rule }: { rule: Rule }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white shadow border p-3 rounded mb-2"
    >
      <strong>{rule.entity}.{rule.field}</strong>: {rule.message}
    </div>
  );
}

export default function RulePrioritization() {
  const rules = useDataStore((s) => s.rules);
  const setRules = useDataStore((s) => s.setRules);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  useEffect(() => {
    setOrderedIds(rules.map((r) => r.id));
  }, [rules]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = orderedIds.indexOf(active.id);
      const newIndex = orderedIds.indexOf(over.id);
      const newIds = arrayMove(orderedIds, oldIndex, newIndex);
      setOrderedIds(newIds);
      const newOrderedRules = newIds.map((id) => rules.find((r) => r.id === id)!);
      setRules(newOrderedRules);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2"> Prioritize Rules</h2>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          {orderedIds.map((id) => {
            const rule = rules.find((r) => r.id === id);
            return rule ? <SortableRuleItem key={id} rule={rule} /> : null;
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
