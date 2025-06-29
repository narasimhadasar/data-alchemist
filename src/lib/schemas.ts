
import { z } from "zod";

export const clientSchema = z.object({
  ClientID: z.string().min(1),
  ClientName: z.string().min(1),
  PriorityLevel: z.number().int(),
  RequestedTaskIDs: z.string(),
  GroupTag: z.string(),
  AttributesJSON: z.string(),
});

export const workerSchema = z.object({
  WorkerID: z.string().min(1),
  WorkerName: z.string().min(1),
  Skills: z.string(),
  AvailableSlots: z.string(),
  MaxLoadPerPhase: z.number().int(),
  WorkerGroup: z.string(),
  QualificationLevel: z.number().int(),
});

export const taskSchema = z.object({
  TaskID: z.string().min(1),
  TaskName: z.string().min(1),
  Category: z.string(),
  Duration: z.number().int(),
  RequiredSkills: z.string(),
  PreferredPhases: z.string(),
  MaxConcurrent: z.number().int(),
});

export const clientArraySchema = z.array(clientSchema);
export const workerArraySchema = z.array(workerSchema);
export const taskArraySchema = z.array(taskSchema);
