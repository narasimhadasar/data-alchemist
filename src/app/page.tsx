"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-white text-gray-800">
      <h1 className="text-3xl font-bold">Welcome to Data Alchemist</h1>
      <p className="text-lg text-center max-w-md">
        Upload your <strong>Clients</strong>, <strong>Workers</strong>, and <strong>Tasks</strong> as Excel/CSV files and view or edit them in an interactive grid.
      </p>

      <div className="flex gap-4 mt-6">
        <Link
          href="/upload"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Upload Data
        </Link>
      </div>
    </main>
  );
}
