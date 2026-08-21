"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { StatCard } from "@/components/StatCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface MonthlyReport {
  totalMeetings: number;
  avgAttendancePercent: number;
  byMember: Record<string, { present: number; absent: number; excused: number; late: number }>;
}

export default function DashboardOverviewPage() {
  const [memberCount, setMemberCount] = useState(0);
  const [servantCount, setServantCount] = useState(0);
  const [upcomingMeetings, setUpcomingMeetings] = useState(0);
  const [report, setReport] = useState<MonthlyReport | null>(null);

  useEffect(() => {
    const unsubMembers = onSnapshot(query(collection(db, "users"), where("role", "==", "member")), (snap) =>
      setMemberCount(snap.size)
    );
    const unsubServants = onSnapshot(query(collection(db, "users"), where("role", "==", "servant")), (snap) =>
      setServantCount(snap.size)
    );
    const unsubMeetings = onSnapshot(collection(db, "meetings"), (snap) => setUpcomingMeetings(snap.size));

    return () => {
      unsubMembers();
      unsubServants();
      unsubMeetings();
    };
  }, []);

  useEffect(() => {
    const period = new Date().toISOString().slice(0, 7);
    const unsub = onSnapshot(doc(db, "reportsCache", period), (snap) =>
      setReport(snap.exists() ? (snap.data() as MonthlyReport) : null)
    );
    return unsub;
  }, []);

  const topMembers = report
    ? Object.entries(report.byMember)
        .sort((a, b) => b[1].present - a[1].present)
        .slice(0, 8)
        .map(([uid, stats]) => ({ uid, present: stats.present }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Youth members" value={memberCount} />
        <StatCard label="Servants" value={servantCount} />
        <StatCard label="Meetings on record" value={upcomingMeetings} />
        <StatCard
          label="Avg. attendance (this month)"
          value={report ? `${report.avgAttendancePercent.toFixed(1)}%` : "-"}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 font-medium">Most active members (present count, this month)</h2>
        {topMembers.length === 0 ? (
          <p className="text-sm text-gray-500">No report generated for this month yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topMembers}>
              <XAxis dataKey="uid" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="present" fill="#6d4c41" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
