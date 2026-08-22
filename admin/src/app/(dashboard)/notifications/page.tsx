"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebaseClient";

const TYPES = ["general", "meeting_reminder", "service", "conference", "trip", "sermon", "devotional"];

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  type: string;
  sentAt: Timestamp;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [form, setForm] = useState({ title: "", body: "", type: "general" });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(query(collection(db, "notifications"), orderBy("sentAt", "desc")), (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationRow, "id">) })));
    });
  }, []);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const sendNotification = httpsCallable(functions, "sendNotification");
      await sendNotification({ title: form.title, body: form.body, type: form.type, target: { scope: "all" } });
      setFeedback("Notification sent to everyone.");
      setForm({ title: "", body: "", type: "general" });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      <form onSubmit={handleSend} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Broadcast to everyone. For group/servant/individual targeting, use the mobile app's send screen.</p>
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <textarea required placeholder="Message" rows={2} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {feedback && <p className="text-sm text-gray-600 dark:text-gray-300">{feedback}</p>}
        <button disabled={sending} className="rounded-lg bg-primary px-4 py-2 font-medium text-white disabled:opacity-50">
          {sending ? "Sending..." : "Send to everyone"}
        </button>
      </form>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{n.body}</p>
            <p className="mt-1 text-xs text-gray-400">{n.sentAt?.toDate().toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
