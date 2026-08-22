"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebaseClient";
import { StatCard } from "@/components/StatCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface MemberStats {
  present: number;
  absent: number;
  excused: number;
  late: number;
}

interface MonthlyReport {
  totalMeetings: number;
  avgAttendancePercent: number;
  byMember: Record<string, MemberStats>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  useEffect(() => {
    setLoading(true);
    getDoc(doc(db, "reportsCache", period)).then((snap) => {
      setReport(snap.exists() ? (snap.data() as MonthlyReport) : null);
      setLoading(false);
    });
  }, [period]);

  async function handleExport(format: "xlsx" | "pdf") {
    setExporting(format);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/reports/export?period=${period}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${period}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  const chartData = report
    ? Object.entries(report.byMember).map(([uid, stats]) => ({ name: uid.slice(0, 6), ...stats }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : !report ? (
        <p className="text-sm text-gray-500">
          No report cached for this month yet. The <code>rebuildMonthlyReport</code> Cloud Function regenerates it nightly,
          or trigger <code>rebuildReportForPeriod</code> manually for a historical month.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="Total meetings" value={report.totalMeetings} />
            <StatCard label="Average attendance" value={`${report.avgAttendancePercent.toFixed(1)}%`} />
            <StatCard label="Members tracked" value={Object.keys(report.byMember).length} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#16a34a" />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" />
                <Bar dataKey="excused" stackId="a" fill="#0ea5e9" />
                <Bar dataKey="absent" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-3">
            <button
              disabled={exporting !== null}
              onClick={() => handleExport("xlsx")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {exporting === "xlsx" ? "Exporting..." : "Export Excel"}
            </button>
            <button
              disabled={exporting !== null}
              onClick={() => handleExport("pdf")}
              className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
            >
              {exporting === "pdf" ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
