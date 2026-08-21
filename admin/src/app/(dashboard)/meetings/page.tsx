"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";

const MEETING_TYPES = ["weekly", "monthly", "special", "conference", "trip", "service", "event"] as const;

interface MeetingRow {
  id: string;
  title: string;
  type: string;
  startAt: Timestamp;
  location?: string;
  qrCode: string;
}

export default function MeetingsPage() {
  const { profile } = useAuth();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [qrMeeting, setQrMeeting] = useState<MeetingRow | null>(null);
  const [form, setForm] = useState({ title: "", type: "weekly", startAt: "", location: "" });

  useEffect(() => {
    return onSnapshot(query(collection(db, "meetings"), orderBy("startAt", "desc")), (snap) => {
      setMeetings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MeetingRow, "id">) })));
    });
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await addDoc(collection(db, "meetings"), {
      title: form.title,
      type: form.type,
      startAt: Timestamp.fromDate(new Date(form.startAt)),
      location: form.location || null,
      qrCode: crypto.randomUUID(),
      createdBy: profile?.uid,
    });
    setForm({ title: "", type: "weekly", startAt: "", location: "" });
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meetings</h1>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          {showForm ? "Cancel" : "New meeting"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <button className="col-span-full rounded-lg bg-primary px-4 py-2 font-medium text-white">Create</button>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Date</th>
              <th className="p-3">Location</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {meetings.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{m.title}</td>
                <td className="p-3">{m.type}</td>
                <td className="p-3">{m.startAt?.toDate().toLocaleString()}</td>
                <td className="p-3">{m.location ?? "-"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setQrMeeting(m)} className="text-primary hover:underline">
                    Show QR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrMeeting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" onClick={() => setQrMeeting(null)}>
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <p className="mb-4 font-medium">{qrMeeting.title}</p>
            <QRCodeSVG value={qrMeeting.qrCode} size={240} />
            <button onClick={() => setQrMeeting(null)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
