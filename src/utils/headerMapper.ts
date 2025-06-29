
export const clientHeaderMap: Record<string, string> = {
  "client id": "ClientID",
  "clientid": "ClientID",
  "id": "ClientID",
  "name": "Name",
  "client name": "Name",
  "email": "Email",
  "email address": "Email",
};

export const workerHeaderMap: Record<string, string> = {
  "worker id": "WorkerID",
  "workerid": "WorkerID",
  "id": "WorkerID",
  "name": "Name",
  "worker name": "Name",
  "skill": "Skill",
  "expertise": "Skill",
};

export const taskHeaderMap: Record<string, string> = {
  "task id": "TaskID",
  "taskid": "TaskID",
  "id": "TaskID",
  "title": "Title",
  "task name": "Title",
  "assigned to": "AssignedTo",
  "assignee": "AssignedTo",
};

export function remapHeaders(
  rows: Record<string, any>[],
  map: Record<string, string>
): Record<string, any>[] {
  return rows.map((row) => {
    const remapped: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.trim().toLowerCase();
      const newKey = map[normalizedKey] || key;
      remapped[newKey] = value;
    }
    return remapped;
  });
}
