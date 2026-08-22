"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";

interface NewsRow {
  id: string;
  title: string;
  body: string;
  publishedAt: Timestamp;
}

export default function NewsPage() {
  const { profile } = useAuth();
  const [news, setNews] = useState<NewsRow[]>([]);
  const [form, setForm] = useState({ title: "", body: "", imageUrl: "" });

  useEffect(() => {
    return onSnapshot(query(collection(db, "news"), orderBy("publishedAt", "desc")), (snap) => {
      setNews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsRow, "id">) })));
    });
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await addDoc(collection(db, "news"), {
      title: form.title,
      body: form.body,
      imageUrls: form.imageUrl ? [form.imageUrl] : [],
      publishedAt: Timestamp.now(),
      createdBy: profile?.uid,
    });
    setForm({ title: "", body: "", imageUrl: "" });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">News</h1>

      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <textarea required placeholder="Body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <input placeholder="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        <button className="rounded-lg bg-primary px-4 py-2 font-medium text-white">Publish</button>
      </form>

      <div className="space-y-3">
        {news.map((n) => (
          <div key={n.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-gray-500">{n.publishedAt?.toDate().toLocaleString()}</p>
              </div>
              <button onClick={() => deleteDoc(doc(db, "news", n.id))} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
