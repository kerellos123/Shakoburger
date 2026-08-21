"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface DevotionalRow {
  id: string;
  title: string;
  body: string;
  date: Timestamp;
}

export default function DevotionalsPage() {
  const [devotionals, setDevotionals] = useState<DevotionalRow[]>([]);
  const [form, setForm] = useState({ title: "", body: "", date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    return onSnapshot(query(collection(db, "devotionals"), orderBy("date", "desc")), (snap) => {
      setDevotionals(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DevotionalRow, "id">) })));
    });
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await addDoc(collection(db, "devotionals"), { ...form, date: Timestamp.fromDate(new Date(form.date)) });
    setForm({ title: "", body: "", date: new Date().toISOString().slice(0, 10) });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Devotionals</h1>

      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        </div>
        <textarea required placeholder="Devotional text" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <button className="rounded-lg bg-primary px-4 py-2 font-medium text-white">Publish</button>
      </form>

      <div className="space-y-3">
        {devotionals.map((d) => (
          <div key={d.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-gray-500">{d.date?.toDate().toLocaleDateString()}</p>
              </div>
              <button onClick={() => deleteDoc(doc(db, "devotionals", d.id))} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{d.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
