"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { callApi } from "@/lib/apiClient";

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "admin" | "servant" | "member";
  assignedServantId?: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "member" as UserRow["role"], assignedServantId: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return onSnapshot(query(collection(db, "users"), orderBy("fullName")), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserRow, "id">) })));
    });
  }, []);

  const servants = users.filter((u) => u.role === "servant");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await callApi("/api/users", {
        method: "POST",
        body: JSON.stringify({ ...form, assignedServantId: form.assignedServantId || undefined }),
      });
      setShowForm(false);
      setForm({ fullName: "", email: "", phone: "", password: "", role: "member", assignedServantId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(uid: string, role: UserRow["role"]) {
    await callApi(`/api/users/${uid}`, { method: "PATCH", body: JSON.stringify({ role }) });
  }

  async function updateServant(uid: string, assignedServantId: string) {
    await callApi(`/api/users/${uid}`, { method: "PATCH", body: JSON.stringify({ assignedServantId: assignedServantId || null }) });
  }

  async function removeUser(uid: string) {
    if (!confirm("Delete this user permanently?")) return;
    await callApi(`/api/users/${uid}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          {showForm ? "Cancel" : "Add user"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRow["role"] })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <option value="member">Youth member</option>
            <option value="servant">Servant</option>
            <option value="admin">Admin</option>
          </select>
          {form.role === "member" && (
            <select value={form.assignedServantId} onChange={(e) => setForm({ ...form, assignedServantId: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
              <option value="">No servant assigned</option>
              {servants.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          )}
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
          <button disabled={submitting} className="col-span-full rounded-lg bg-primary px-4 py-2 font-medium text-white disabled:opacity-50">
            {submitting ? "Creating..." : "Create user"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Assigned servant</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{u.fullName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value as UserRow["role"])}
                    className="rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="member">Member</option>
                    <option value="servant">Servant</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-3">
                  {u.role === "member" ? (
                    <select
                      value={u.assignedServantId ?? ""}
                      onChange={(e) => updateServant(u.id, e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <option value="">-</option>
                      {servants.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                    </select>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => removeUser(u.id)} className="text-red-600 hover:underline">
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
