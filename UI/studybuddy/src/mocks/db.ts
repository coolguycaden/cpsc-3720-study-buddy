// src/mocks/db.ts
import type { Course, Enrollment, ID, Student, StudySession } from "../types";

/**
 * Shape of the serialized "database" we keep in localStorage.
 * - users:      registered users
 * - courses:    unique course records (e.g., { id, code: "CPSC 2150-001" })
 * - enrollments:join table linking users ↔ courses
 * - studySessions: tracks study session requests between users
 * - currentUserId: who is "logged in" right now
 */
type Tables = {
  users: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  studySessions: StudySession[];
  currentUserId: ID | null;
};

/** localStorage key used to persist the DB blob */
const KEY = "studybuddy_db_v1";

/** Toggle to print DB operations into the dev console for debugging */
const DEBUG = true;

/** Logger helper used throughout this module */
const log = (...a: any[]) => DEBUG && console.log("[DB]", ...a);

/**
 * Load the DB from localStorage.
 * - Returns a fully-populated Tables object with safe defaults.
 * - Also prunes "orphan" enrollments that reference a missing course
 * (protects against older broken states).
 */
function load(): Tables {
  try {
    const db = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<Tables>;
    const safe: Tables = {
      users: db.users ?? [],
      courses: db.courses ?? [],
      enrollments: db.enrollments ?? [],
      studySessions: db.studySessions ?? [],
      currentUserId: db.currentUserId ?? null,
    };
    
    // Guardrail: if a course is missing, drop enrollments that point to it.
    const courseIds = new Set(safe.courses.map((c) => c.id));
    safe.enrollments = safe.enrollments.filter((e) => courseIds.has(e.courseId));
    return safe;
  } catch {
    // Corrupt JSON or first run -> return an empty DB
    return { users: [], courses: [], enrollments: [], studySessions: [], currentUserId: null };
  }
}

/** Save the entire DB back to localStorage (single source of truth). */
function save(db: Tables) {
  log("save()", db);
  localStorage.setItem(KEY, JSON.stringify(db));
}

/** Generate a stable unique id (prefers crypto.randomUUID, falls back to random). */
function uuid() {
  return (crypto as any).randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

/** Ensure there is a logged-in user and return their ID (otherwise throw). */
function assertLoggedIn(db: Tables): ID {
  if (!db.currentUserId) throw new Error("Not logged in");
  return db.currentUserId;
}

/** Normalize a course code (trim + uppercase) so comparisons are consistent. */
function normalize(code: string) {
  return code.trim().toUpperCase();
}

/**
 * Pure helper that ensures a Course exists *inside the provided `db` object*.
 * IMPORTANT: It mutates the *same* db instance passed in.
 * This prevents the “stale snapshot overwrite” bug where two different loads
 * fight each other in localStorage.
 */
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

/**
 * Public DB API consumed by the UI layer.
 * Each method:
 * - loads the current DB snapshot
 * - mutates it safely
 * - saves once (save(db)) when finished
 */
export const DB = {
  /** Clear everything (useful for demos/tests). */
  reset() {
    save({ users: [], courses: [], enrollments: [], studySessions: [], currentUserId: null });
  },

  /** Return a snapshot of the DB (for debugging / inspector). */
  dump() {
    return load();
  },

  // --- auth ---

  /** Get the currently-logged-in user, if any. */
  me(): Student | undefined {
    const db = load();
    return db.users.find((u) => u.id === db.currentUserId);
  },

  /**
   * Log in by username (case-insensitive).
   * Throws if no user exists with that username.
   */
  login(username: string): Student {
    const db = load();
    const u = db.users.find((x) => x.username.toLowerCase() === username.toLowerCase());
    if (!u) throw new Error("User not found");
    db.currentUserId = u.id;
    save(db);
    return u;
  },

  addMeetingTime(time: string) {
    const db = load();
    const me = assertLoggedIn(db);
    const user = db.users.find((u) => u.id === me);
    if (user) {
      if (!user.availability) {
        user.availability = [];
      }
      user.availability.push(time);
      save(db);
    }
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
      availability: [],
    };
    db.users.push(user);
    db.currentUserId = user.id;
    save(db);
    return user;
  },

  /** Log out (simply clears currentUserId). */
  logout() {
    const db = load();
    db.currentUserId = null;
    save(db);
  },

  // --- courses & enrollments ---

  /**
   * Ensure a course exists (by code) and persist the change.
   * Uses the shared db instance + a single save to avoid stale overwrites.
   */
  getOrCreateCourse(code: string): Course {
    const db = load();
    const c = getOrCreateCourseIn(db, code); // mutate same db
    save(db);                                 // save once
    return c;
  },

  /**
   * Enroll the current user in a course (creating the course if needed).
   * - Prevents duplicates for the same user/course.
   * - Single authoritative save includes both the course + enrollment.
   */
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

  /**
   * List courses for the current user:
   * enrollments (mine) -> map courseIds -> join to course objects.
   */
  listMyCourses(): Course[] {
    const db = load();
    const me = db.currentUserId;
    if (!me) return [];
    const courseIds = new Set(db.enrollments.filter((e) => e.studentId === me).map((e) => e.courseId));
    return db.courses.filter((c) => courseIds.has(c.id));
  },

  /**
   * List classmates for a given course code (excluding me).
   * - Finds the course by normalized code
   * - Collects studentIds from enrollments for that course
   * - Filters users to those ids, excluding the current user
   */
  classmates(courseCode: string): Student[] {
    const db = load();
    const course = db.courses.find((c) => c.code === courseCode.trim().toUpperCase()); // could call normalize()
    if (!course) return [];
    const me = db.currentUserId;
    const ids = new Set(db.enrollments.filter((e) => e.courseId === course.id).map((e) => e.studentId));
    return db.users.filter((u) => ids.has(u.id) && u.id !== me);
  },

  // --- Study Session Management ---

  /**
   * Create a study session request.
   */
  createStudySessionRequest(requesteeId: ID, courseId: ID, proposedTime: number): StudySession {
    const db = load();
    const requesterId = assertLoggedIn(db);

    // Prevent sending a request to yourself
    if (requesterId === requesteeId) {
      throw new Error("You cannot send a study request to yourself.");
    }

    const newSession: StudySession = {
      id: uuid(),
      requesterId,
      requesteeId,
      courseId,
      proposedTime,
      status: "pending",
      createdAt: Date.now(),
    };

    db.studySessions.push(newSession);
    log("createStudySessionRequest: created", newSession);
    save(db);
    return newSession;
  },
};

// expose for DevTools: window.__DB (handy for testing from the console)
declare global {
  interface Window {
    __DB?: typeof DB;
  }
}
if (typeof window !== "undefined") {
  (window as any).__DB = DB;
}