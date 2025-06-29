"use client";
import { useState } from "react";

type DataGridProps = {
  data: Record<string, any>[];
  onEdit: (rowIndex: number, field: string, value: any) => void;
};

export default function DataGrid({ data, onEdit }: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);

  if (!data || data.length === 0) {
    return <p className="text-gray-500">No data available.</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 border">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {headers.map((field) => (
                <td
                  key={field}
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => setEditingCell({ row: rowIndex, field })}
                >
                  {editingCell?.row === rowIndex && editingCell?.field === field ? (
                    <input
                      type="text"
                      className="w-full p-1 border border-blue-500 rounded"
                      defaultValue={row[field]}
                      autoFocus
                      onBlur={(e) => {
                        onEdit(rowIndex, field, e.target.value);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onEdit(rowIndex, field, (e.target as HTMLInputElement).value);
                          setEditingCell(null);
                        }
                      }}
                    />
                  ) : (
                    row[field]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
