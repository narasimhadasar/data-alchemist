"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import DataGrid from "@/components/DataGrid";
import NaturalQuery from "@/components/NaturalQuery";
import ExportButton from "@/components/ExportButton";
import { useDataStore } from "@/lib/dataStore";
import { validateAll } from "@/lib/validate"; 

export default function GridPage() {
  const { data, setData, errors } = useDataStore();
  const validationRef = useRef<HTMLDivElement>(null);

  //  Run only static validation once on mount
  useEffect(() => {
    const { clients, workers, tasks } = useDataStore.getState().data;
    const staticErrors = validateAll(clients, workers, tasks, undefined);
    useDataStore.setState({ errors: staticErrors });
  }, []);

  useEffect(() => {
    if (errors.length > 0) {
      setTimeout(() => {
        validationRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [errors]);

  const handleEdit =
    (section: keyof typeof data) =>
    (rowIndex: number, field: string, value: unknown) => {
      const updated = [...data[section]];
      updated[rowIndex][field] = value;
      setData(section, updated);

      //  Re-validate statically on edit
      const currentData = useDataStore.getState().data;
      const staticErrors = validateAll(
        currentData.clients,
        currentData.workers,
        currentData.tasks,
        undefined
      );
      useDataStore.setState({ errors: staticErrors });
    };

  const sortedErrors = [...errors].sort(
    (a, b) => (b.weight ?? 1) - (a.weight ?? 1)
  );

  return (
    <div className="p-4 space-y-8">
      {/* 🔝 Header Row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="md:w-1/4 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Data Editor</h1>

          {/* Go to Rule Editor */}
          <Link href="/rules">
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow w-full">
              Go to Rule Editor
            </button>
          </Link>

          {/*  Back to Upload */}
          <Link href="/upload">
            <button className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 text-gray-800 rounded hover:bg-gray-200 shadow w-full">
              Back to Upload
            </button>
          </Link>
        </div>

        {/* Center - Natural Query */}
        <div className="md:w-2/4 text-center">
          <NaturalQuery />
        </div>

        {/* Right - Export */}
        <div className="md:w-1/4 flex justify-end">
          <ExportButton />
        </div>
      </div>

      {/*  Data Sections */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Clients</h2>
        <DataGrid data={data.clients} onEdit={handleEdit("clients")} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Workers</h2>
        <DataGrid data={data.workers} onEdit={handleEdit("workers")} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Tasks</h2>
        <DataGrid data={data.tasks} onEdit={handleEdit("tasks")} />
      </div>

      {/*  Validation Errors */}
      <div ref={validationRef}>
        {sortedErrors.length > 0 && (
          <div className="mt-10 bg-red-50 border border-red-300 text-red-800 p-4 rounded-md">
            <h2 className="font-semibold text-lg mb-2">⚠ Validation Issues</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {sortedErrors.map((err, idx) => (
                <li key={idx}>
                  <strong>{err.entity}</strong> [Row {err.row + 1}] <code>{err.field}</code>:{" "}
                  {err.message}
                  {typeof err.weight !== "undefined" && (
                    <span className="ml-2 text-xs text-gray-600">(Weight: {err.weight})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
