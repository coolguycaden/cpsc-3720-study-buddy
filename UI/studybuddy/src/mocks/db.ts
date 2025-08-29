// src/mocks/db.ts
import type { Course, Enrollment, ID, Student } from "../types";

type Tables = {
  users: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  currentUserId: ID | null;
};

const KEY = "studybuddy_db_v1";

const DEBUG = true;
const log = (...a: any[]) => DEBUG && console.log("[DB]", ...a);

function load(): Tables {
  try {
    const db = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<Tables>;
    const safe: Tables = {
      users: db.users ?? [],
      courses: db.courses ?? [],
      enrollments: db.enrollments ?? [],
      currentUserId: db.currentUserId ?? null,
    };
    // prune orphan enrollments (old bad states)
    const courseIds = new Set(safe.courses.map((c) => c.id));
    safe.enrollments = safe.enrollments.filter((e) => courseIds.has(e.courseId));
    return safe;
  } catch {
    return { users: [], courses: [], enrollments: [], currentUserId: null };
  }
}

function save(db: Tables) {
  log("save()", db);
  localStorage.setItem(KEY, JSON.stringify(db));
}

function uuid() {
  return (crypto as any).randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function assertLoggedIn(db: Tables): ID {
  if (!db.currentUserId) throw new Error("Not logged in");
  return db.currentUserId;
}

function normalize(code: string) {
  return code.trim().toUpperCase();
}

function getOrCreateCourseIn(db: Tables, code: string): Course {
  const norm = normalize(code);
  let c = db.courses.find(x => x.code === norm);
  if (!c) {
    c = { id: uuid(), code: norm };
    db.courses.push(c);
    log("getOrCreateCourseIn: created", c);
  } else {
    log("getOrCreateCourseIn: found", c);
  }
  return c;
}

export const DB = {
  reset() {
    save({ users: [], courses: [], enrollments: [], currentUserId: null });
  },
  dump() {
    return load();
  },

  // --- auth ---
  me(): Student | undefined {
    const db = load();
    return db.users.find((u) => u.id === db.currentUserId);
  },

  login(username: string): Student {
    const db = load();
    const u = db.users.find((x) => x.username.toLowerCase() === username.toLowerCase());
    if (!u) throw new Error("User not found");
    db.currentUserId = u.id;
    save(db);
    return u;
  },

  createUser(name: string, username: string): Student {
    const db = load();
    const valid = /^[a-z0-9_.-]{3,20}$/i;
    if (!valid.test(username)) throw new Error("Invalid username format");
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username already in use");
    }
    const user: Student = {
      id: uuid(),
      name: name.trim(),
      username: username.trim(),
      createdAt: Date.now(),
    };
    db.users.push(user);
    db.currentUserId = user.id;
    save(db);
    return user;
  },

  logout() {
    const db = load();
    db.currentUserId = null;
    save(db);
  },

  // --- courses & enrollments ---
  getOrCreateCourse(code: string): Course {
    const db = load();
    const c = getOrCreateCourseIn(db, code); // mutate same db
    save(db);                                 // save once
    return c;
  },

  addEnrollment(code: string) {
    const db = load();
    const me = assertLoggedIn(db);
    const course = getOrCreateCourseIn(db, code); // same db instance, no extra save
    const dup = db.enrollments.some(e => e.studentId === me && e.courseId === course.id);
    if (dup) {
      log("addEnrollment: duplicate", { me, course });
      throw new Error("Course already added");
    }
    db.enrollments.push({ studentId: me, courseId: course.id, createdAt: Date.now() });
    log("addEnrollment: pushed", { me, course });
    save(db); // single authoritative save with both course + enrollment
  },

  listMyCourses(): Course[] {
    const db = load();
    const me = db.currentUserId;
    if (!me) return [];
    const courseIds = new Set(db.enrollments.filter((e) => e.studentId === me).map((e) => e.courseId));
    return db.courses.filter((c) => courseIds.has(c.id));
  },

  classmates(courseCode: string): Student[] {
    const db = load();
    const course = db.courses.find((c) => c.code === courseCode.trim().toUpperCase());
    if (!course) return [];
    const me = db.currentUserId;
    const ids = new Set(db.enrollments.filter((e) => e.courseId === course.id).map((e) => e.studentId));
    return db.users.filter((u) => ids.has(u.id) && u.id !== me);
  },
};

// expose for DevTools: __DB
declare global {
  interface Window {
    __DB?: typeof DB;
  }
}
if (typeof window !== "undefined") {
  (window as any).__DB = DB;
}
