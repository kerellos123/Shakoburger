"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

const MEDIA_TYPES = ["video", "audio", "pdf", "youtube"] as const;

interface SermonRow {
  id: string;
  title: string;
  speaker: string;
  topic: string;
  date: Timestamp;
  mediaType: string;
  mediaUrl: string;
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<SermonRow[]>([]);
  const [form, setForm] = useState({ title: "", speaker: "", topic: "", date: "", mediaType: "youtube", mediaUrl: "" });

  useEffect(() => {
    return onSnapshot(query(collection(db, "sermons"), orderBy("date", "desc")), (snap) => {
      setSermons(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SermonRow, "id">) })));
    });
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await addDoc(collection(db, "sermons"), {
      ...form,
      date: Timestamp.fromDate(new Date(form.date)),
    });
    setForm({ title: "", speaker: "", topic: "", date: "", mediaType: "youtube", mediaUrl: "" });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sermons</h1>

      <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input required placeholder="Speaker" value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input required placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <select value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          {MEDIA_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input required placeholder="Media URL (Storage link or YouTube URL)" value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <button className="col-span-full rounded-lg bg-primary px-4 py-2 font-medium text-white">Add sermon</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Speaker</th>
              <th className="p-3">Topic</th>
              <th className="p-3">Date</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {sermons.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{s.title}</td>
                <td className="p-3">{s.speaker}</td>
                <td className="p-3">{s.topic}</td>
                <td className="p-3">{s.date?.toDate().toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <button onClick={() => deleteDoc(doc(db, "sermons", s.id))} className="text-red-600 hover:underline">
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
