// src/features/courses/CoursesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { DB } from "../../mocks/db";
import ClassmatesPanel from "./ClassmatesPanel";

const COURSE_RE = /^[A-Z]{3,4}\s?\d{3,4}-\d{3}$/;

function DBInspector({ bump }: { bump: number }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(JSON.stringify(DB.dump(), null, 2));
  }, [bump]);
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-xs text-neutral-600">Debug: DB dump</summary>
      <pre className="text-xs bg-neutral-100 p-2 rounded overflow-auto max-h-60">{text}</pre>
    </details>
  );
}

export default function CoursesPage() {
  const [code, setCode] = useState("");
  const [courses, setCourses] = useState<{ code: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [bump, setBump] = useState(0); // re-render DBInspector

  function refresh() {
    const list = DB.listMyCourses().map((c) => ({ code: c.code }));
    setCourses(list);
    if (!selected && list.length > 0) setSelected(list[0].code);
    setBump((x) => x + 1);
  }

  useEffect(() => {
    refresh();
  }, []);

  function normalize(input: string) {
    return input.trim().toUpperCase().replace(/\s+/, " ");
  }

  function addCourse(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      if (!DB.me()) throw new Error("Not logged in. Go to Onboard and create/login first.");
      const norm = normalize(code);
      if (!COURSE_RE.test(norm))
        throw new Error('Use format like "CPSC 2150-001" (dept + number + dash + 3-digit section).');
      DB.addEnrollment(norm);
      setCode("");
      refresh();
      setSelected(norm);
    } catch (e: any) {
      setErr(e?.message ?? "Could not add course");
    }
  }

  const empty = useMemo(() => courses.length === 0, [courses]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h1 className="text-2xl font-semibold mb-3">My Courses</h1>
        <form onSubmit={addCourse} className="flex gap-2 mb-3">
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="CPSC 2150-001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="rounded bg-black text-white px-3 py-2">Add</button>
        </form>

        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}

        <ul className="divide-y rounded border bg-white">
          {empty && <li className="p-3 text-sm text-neutral-500">No courses yet.</li>}
          {courses.map((c) => (
            <li key={c.code} className="flex items-center justify-between p-3">
              <span>{c.code}</span>
              <button className="text-sm underline" onClick={() => setSelected(c.code)}>
                Classmates
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-xs text-neutral-500">
          Logged in as: <strong>{DB.me()?.username ?? "(none)"}</strong>
        </p>

        <DBInspector bump={bump} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Classmates</h2>
        {selected ? (
          <ClassmatesPanel courseCode={selected} />
        ) : (
          <p className="text-sm text-neutral-500">Select a course to see classmates.</p>
        )}
      </section>
    </div>
  );
}
