// src/features/courses/CoursesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { DB } from "../../mocks/db";
import ClassmatesPanel from "./ClassmatesPanel";
import SetAvaliability from "./SetAvaliability";
import { useUser } from "../../store/user";

/**
 * Course code format:
 * - 3–4 letters (dept)
 * - optional space
 * - 3–4 digits (number)
 * - dash
 * - 3 digits (section)
 * Examples: "CPSC 2150-001", "MATH2060-002"
 */
const COURSE_RE = /^[A-Z]{3,4}\s?\d{3,4}-\d{3}$/;

/**
 * Tiny collapsible inspector that prints the entire localStorage DB.
 * Super useful for “why didn’t that save?” moments.
 * `bump` is a number that increments to force re-read of DB on demand.
 */
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

/**
 * CoursesPage
 * - Lets the logged-in user add a course by code and see their course list.
 * - Selecting a course shows the “Classmates” panel on the right.
 * - Includes guardrails: must be logged in, code must match expected format, duplicates blocked.
 */
export default function CoursesPage() {
  // Controlled input for course code field.
  const [code, setCode] = useState("");

  // Render-ready list of my courses (just { code } for now).
  const [courses, setCourses] = useState<{ code: string }[]>([]);

  // Error message displayed under the form (string or none).
  const [err, setErr] = useState<string | null>(null);

  // Which course is currently selected to show classmates.
  const [selected, setSelected] = useState<string | null>(null);

  // Increment this to make DBInspector re-pull data from localStorage.
  const [bump, setBump] = useState(0);

  const removeCourse = useUser((s) => s.removeCourse);

  /**
   * Read fresh data from the DB:
   * - Map DB courses to simple { code } items for the UI.
   * - Auto-select the first course if nothing is selected yet.
   * - Bump the inspector so the debug JSON stays in sync.
   */
  function refresh() {
    const list = DB.listMyCourses().map((c) => ({ code: c.code }));
    setCourses(list);
    if (!selected && list.length > 0) setSelected(list[0].code);
    setBump((x) => x + 1);
  }

  // On mount, load the user’s current courses.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Normalize input to a canonical “ALL CAPS + single spaces” form. */
  function normalize(input: string) {
    return input.trim().toUpperCase().replace(/\s+/, " ");
  }

  /**
   * Handle “Add”:
   * - Prevent default form submit
   * - Ensure user is logged in
   * - Validate code format
   * - Add enrollment via DB (which also creates the course if needed)
   * - Clear input, refresh list, and focus the selected course
   */
  function addCourse(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      if (!DB.me()) throw new Error("Not logged in. Go to Onboard and create/login first.");

      const norm = normalize(code);
      if (!COURSE_RE.test(norm)) {
        throw new Error('Use format like "CPSC 2150-001" (dept + number + dash + 3-digit section).');
      }

      DB.addEnrollment(norm); // writes both course + enrollment in one save
      setCode("");
      refresh();
      setSelected(norm);
    } catch (e: any) {
      setErr(e?.message ?? "Could not add course");
    }
  }

  async function handleRemoveCourse(courseCode: string) {
    try {
      await removeCourse(courseCode);
      refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Could not remove course");
    }
  }

  // Handy computed flag to render the empty state.
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
              <div>
                <button className="text-sm underline mr-2" onClick={() => setSelected(c.code)}>
                  Classmates
                </button>
                <button className="text-sm underline text-red-600" onClick={() => handleRemoveCourse(c.code)}>
                  Remove
                </button>
              </div>
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
        <SetAvaliability />
      </section>
    </div>
  );
}