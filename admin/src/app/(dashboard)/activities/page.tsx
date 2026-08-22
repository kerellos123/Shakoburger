"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

const ACTIVITY_TYPES = ["trip", "conference", "sports", "camp", "volunteer", "event"] as const;

interface ActivityRow {
  id: string;
  title: string;
  type: string;
  startAt: Timestamp;
  capacity?: number;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [form, setForm] = useState({ title: "", type: "event", startAt: "", description: "", capacity: "" });

  useEffect(() => {
    return onSnapshot(query(collection(db, "activities"), orderBy("startAt", "desc")), (snap) => {
      setActivities(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityRow, "id">) })));
    });
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await addDoc(collection(db, "activities"), {
      title: form.title,
      type: form.type,
      description: form.description || null,
      startAt: Timestamp.fromDate(new Date(form.startAt)),
      capacity: form.capacity ? Number(form.capacity) : null,
    });
    setForm({ title: "", type: "event", startAt: "", description: "", capacity: "" });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Activities</h1>

      <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input type="number" placeholder="Capacity (optional)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <button className="col-span-full rounded-lg bg-primary px-4 py-2 font-medium text-white">Create activity</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Date</th>
              <th className="p-3">Capacity</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{a.title}</td>
                <td className="p-3">{a.type}</td>
                <td className="p-3">{a.startAt?.toDate().toLocaleString()}</td>
                <td className="p-3">{a.capacity ?? "-"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => deleteDoc(doc(db, "activities", a.id))} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
