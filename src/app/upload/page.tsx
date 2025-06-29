"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { ZodError } from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useDataStore } from "@/lib/dataStore";
import {
  clientArraySchema,
  workerArraySchema,
  taskArraySchema,
} from "@/lib/schemas";
import {
  remapHeaders,
  clientHeaderMap,
  workerHeaderMap,
  taskHeaderMap,
} from "@/utils/headerMapper";

type Row = Record<string, any>;

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [validFiles, setValidFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { data, setData, setValid, valid } = useDataStore();
  const router = useRouter();

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setErrors([]);
    setValidFiles([]);

    // Reset all data and validation flags before processing
    setData("clients", []);
    setData("workers", []);
    setData("tasks", []);
    setValid("clients", false);
    setValid("workers", false);
    setValid("tasks", false);

    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const dataBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBuffer, { type: "array" });

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Row[];

          if (!raw || raw.length === 0) return;

          const rawHeaders = Object.keys(raw[0]).map((h) => h.toLowerCase());

          try {
            if (rawHeaders.some((h) => h.includes("client"))) {
              const remapped = remapHeaders(raw, clientHeaderMap);
              const parsed = clientArraySchema.parse(remapped);
              setData("clients", parsed);
              setValid("clients", true);
              setValidFiles((prev) => [...prev, `${file.name} [${sheetName}] Clients`]);
            } else if (rawHeaders.some((h) => h.includes("worker"))) {
              const remapped = remapHeaders(raw, workerHeaderMap);
              const parsed = workerArraySchema.parse(remapped);
              setData("workers", parsed);
              setValid("workers", true);
              setValidFiles((prev) => [...prev, `${file.name} [${sheetName}]  Workers`]);
            } else if (rawHeaders.some((h) => h.includes("task"))) {
              const remapped = remapHeaders(raw, taskHeaderMap);
              const parsed = taskArraySchema.parse(remapped);
              setData("tasks", parsed);
              setValid("tasks", true);
              setValidFiles((prev) => [...prev, `${file.name} [${sheetName}]  Tasks`]);
            } else {
              setErrors((prev) => [
                ...prev,
                ` Unknown sheet '${sheetName}' in ${file.name}`,
              ]);
            }
          } catch (error) {
            if (error instanceof ZodError) {
              const issues = error.errors.map(
                (err) => `❌ [${sheetName}] ${err.path.join(".")}: ${err.message}`
              );
              setErrors((prev) => [...prev, ...issues]);

              // Clear the corresponding data and mark invalid
              if (rawHeaders.some((h) => h.includes("client"))) {
                setData("clients", []);
                setValid("clients", false);
              } else if (rawHeaders.some((h) => h.includes("worker"))) {
                setData("workers", []);
                setValid("workers", false);
              } else if (rawHeaders.some((h) => h.includes("task"))) {
                setData("tasks", []);
                setValid("tasks", false);
              }
            } else {
              setErrors((prev) => [
                ...prev,
                `❌ Failed to parse '${sheetName}' in ${file.name}`,
              ]);
            }
          }
        });
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    multiple: true,
  });

  const handleViewGrid = () => {
    if (valid.clients && valid.workers && valid.tasks) {
      router.push("/grid");
    } else {
      toast.error("Invalid or incomplete data. Please upload valid Clients, Workers, and Tasks.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload Your Data Files</h1>

      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-400 p-10 text-center cursor-pointer rounded-lg bg-gray-50 hover:bg-gray-100 transition"
      >
        <input {...getInputProps()} />
        <p className="text-gray-700">
          Drag and drop CSV or Excel files here, or click to upload.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Accepted: .csv, .xlsx | Multiple uploads allowed
        </p>
      </div>

      {/*  Summary of loaded rows */}
      <div className="mt-8 space-y-2 text-gray-700">
        <div>Clients loaded: {data.clients.length}</div>
        <div>Workers loaded: {data.workers.length}</div>
        <div>Tasks loaded: {data.tasks.length}</div>
      </div>

      {/*  Valid File Summary */}
      {validFiles.length > 0 && (
        <div className="mt-6 text-green-700">
          <h2 className="text-lg font-medium mb-2">✅ Successfully Processed Sheets</h2>
          <ul className="list-disc pl-5">
            {validFiles.map((file, idx) => (
              <li key={idx}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {/*  Errors */}
      {errors.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-300 text-red-800 p-4 rounded-md">
          <h2 className="font-semibold mb-2">⚠ Validation Errors</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/*  View Grid Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleViewGrid}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          View Grid
        </button>
      </div>
    </div>
  );
}
