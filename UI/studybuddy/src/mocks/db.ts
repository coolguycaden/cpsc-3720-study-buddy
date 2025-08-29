import type { Course, Enrollment, ID, Student } from "../types";

type Tables = {
  users: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  currentUserId?: ID | null;
};

const KEY = "studybuddy_db_v1";

function load(): Tables {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { users: [], courses: [], enrollments: [], currentUserId: null };
  try { return JSON.parse(raw) as Tables; } catch { return { users: [], courses: [], enrollments: [], currentUserId: null }; }
}
function save(db: Tables) { localStorage.setItem(KEY, JSON.stringify(db)); }
function uuid() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); }

export const DB = {
  reset() { save({ users: [], courses: [], enrollments: [], currentUserId: null }); },
  me(): Student | undefined {
    const db = load();
    return db.users.find(u => u.id === db.currentUserId);
  },
  login(username: string): Student {
    const db = load();
    const u = db.users.find(x => x.username.toLowerCase() === username.toLowerCase());
    if (!u) throw new Error("User not found");
    db.currentUserId = u.id; save(db); return u;
  },
  createUser(name: string, username: string): Student {
    const db = load();
    const valid = /^[a-z0-9_.-]{3,20}$/i;
    if (!valid.test(username)) throw new Error("Invalid username format");
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username already in use");
    }
    const user: Student = { id: uuid(), name, username, createdAt: Date.now() };
    db.users.push(user); db.currentUserId = user.id; save(db); return user;
  },
  logout() { const db = load(); db.currentUserId = null; save(db); },

  getOrCreateCourse(code: string): Course {
    const db = load();
    const norm = code.trim().toUpperCase();
    let c = db.courses.find(x => x.code === norm);
    if (!c) { c = { id: uuid(), code: norm }; db.courses.push(c); save(db); }
    return c;
  },
  listMyCourses(): Course[] {
    const db = load(); const me = db.currentUserId; if (!me) return [];
    const courseIds = db.enrollments.filter(e => e.studentId === me).map(e => e.courseId);
    return db.courses.filter(c => courseIds.includes(c.id));
  },
  addEnrollment(code: string) {
    const db = load(); const me = db.currentUserId;
    if (!me) throw new Error("Not logged in");
    const course = DB.getOrCreateCourse(code);
    const dup = db.enrollments.some(e => e.studentId === me && e.courseId === course.id);
    if (dup) throw new Error("Course already added");
    db.enrollments.push({ studentId: me, courseId: course.id, createdAt: Date.now() });
    save(db);
  },
  classmates(courseCode: string) {
    const db = load();
    const course = db.courses.find(c => c.code === courseCode.trim().toUpperCase());
    if (!course) return [];
    const me = db.currentUserId;
    const ids = db.enrollments.filter(e => e.courseId === course.id).map(e => e.studentId);
    return db.users.filter(u => ids.includes(u.id) && u.id !== me);
  },
};
