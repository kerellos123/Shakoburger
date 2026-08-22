"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "verse_completion", label: "Bible verse completion" },
];

interface DraftQuestion {
  type: string;
  question: string;
  options: string;
  correctAnswer: string;
  points: number;
}

interface QuizRow {
  id: string;
  title: string;
  category: string;
  isActive: boolean;
  questions: { question: string }[];
}

const emptyQuestion = (): DraftQuestion => ({ type: "multiple_choice", question: "", options: "", correctAnswer: "", points: 10 });

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  useEffect(() => {
    return onSnapshot(collection(db, "quizzes"), (snap) => {
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuizRow, "id">) })));
    });
  }, []);

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await addDoc(collection(db, "quizzes"), {
      title,
      category,
      isActive: true,
      questions: questions.map((q) => ({
        type: q.type,
        question: q.question,
        options: q.type === "multiple_choice" || q.type === "verse_completion" ? q.options.split(",").map((o) => o.trim()) : [],
        correctAnswer: q.correctAnswer,
        points: Number(q.points) || 10,
      })),
    });
    setTitle("");
    setCategory("");
    setQuestions([emptyQuestion()]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quizzes</h1>

      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input required placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
          <input required placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        </div>

        {questions.map((q, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select value={q.type} onChange={(e) => updateQuestion(index, { type: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input required placeholder="Question" value={q.question} onChange={(e) => updateQuestion(index, { question: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2 dark:border-gray-700 dark:bg-gray-800" />
            </div>
            {(q.type === "multiple_choice" || q.type === "verse_completion") && (
              <input placeholder="Options, comma-separated" value={q.options} onChange={(e) => updateQuestion(index, { options: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Correct answer" value={q.correctAnswer} onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
              <input type="number" placeholder="Points" value={q.points} onChange={(e) => updateQuestion(index, { points: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <button type="button" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])} className="text-sm text-primary hover:underline">
            + Add question
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 font-medium text-white">Create quiz</button>
        </div>
      </form>

      <div className="space-y-2">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <p className="font-medium">{quiz.title}</p>
              <p className="text-xs text-gray-500">{quiz.category} • {quiz.questions?.length ?? 0} questions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateDoc(doc(db, "quizzes", quiz.id), { isActive: !quiz.isActive })}
                className="text-sm text-primary hover:underline"
              >
                {quiz.isActive ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => deleteDoc(doc(db, "quizzes", quiz.id))} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
