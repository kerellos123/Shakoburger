"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, setDoc, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import clsx from "clsx";

const STATUSES = ["present", "absent", "excused", "late"] as const;
type Status = (typeof STATUSES)[number];

interface MeetingRow {
  id: string;
  title: string;
  startAt: Timestamp;
}

interface MemberRow {
  id: string;
  fullName: string;
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [statusByMember, setStatusByMember] = useState<Record<string, Status>>({});

  useEffect(() => {
    return onSnapshot(query(collection(db, "meetings"), orderBy("startAt", "desc")), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MeetingRow, "id">) }));
      setMeetings(rows);
      if (!selectedMeetingId && rows.length) setSelectedMeetingId(rows[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return onSnapshot(query(collection(db, "users"), where("role", "==", "member"), orderBy("fullName")), (snap) => {
      setMembers(snap.docs.map((d) => ({ id: d.id, fullName: d.data().fullName ?? "" })));
    });
  }, []);

  useEffect(() => {
    if (!selectedMeetingId) return;
    return onSnapshot(query(collection(db, "attendance"), where("meetingId", "==", selectedMeetingId)), (snap) => {
      const map: Record<string, Status> = {};
      snap.docs.forEach((d) => {
        map[d.data().memberId] = d.data().status;
      });
      setStatusByMember(map);
    });
  }, [selectedMeetingId]);

  const selectedMeeting = useMemo(() => meetings.find((m) => m.id === selectedMeetingId), [meetings, selectedMeetingId]);

  async function mark(memberId: string, status: Status) {
    if (!selectedMeetingId || !profile) return;
    await setDoc(doc(db, "attendance", `${selectedMeetingId}_${memberId}`), {
      meetingId: selectedMeetingId,
      memberId,
      status,
      recordedBy: profile.uid,
      method: "manual",
      recordedAt: Timestamp.now(),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Attendance</h1>

      <select
        value={selectedMeetingId}
        onChange={(e) => setSelectedMeetingId(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
      >
        {meetings.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title} — {m.startAt?.toDate().toLocaleDateString()}
          </option>
        ))}
      </select>

      {selectedMeeting && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3">{member.fullName}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => mark(member.id, status)}
                          className={clsx(
                            "rounded-full px-3 py-1 text-xs font-medium capitalize",
                            statusByMember[member.id] === status
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
