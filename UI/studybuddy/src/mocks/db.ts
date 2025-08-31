// src/mocks/db.ts
import type { Course, Enrollment, ID, Student, StudySession, StudySessionStatus, DetailedStudySession, Availability } from "../types";

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

  addMeetingTime(day: string, startTime: string, endTime: string) {
    const db = load();
    const meId = assertLoggedIn(db);
    const user = db.users.find((u) => u.id === meId);
    if (user) {
      if (!user.availability) {
        user.availability = [];
      }
      const newAvailability: Availability = { day, startTime, endTime };
      // Prevent adding duplicate entries
      const exists = user.availability.some(
        a => a.day === day && a.startTime === startTime && a.endTime === endTime
      );
      if (!exists) {
        user.availability.push(newAvailability);
      }
      save(db);
    }
  },

  removeMeetingTime(availabilityToRemove: Availability) {
    const db = load();
    const me = assertLoggedIn(db);
    const user = db.users.find((u) => u.id === me);
    if (user && user.availability) {
      user.availability = user.availability.filter(
        a => a.day !== availabilityToRemove.day || a.startTime !== availabilityToRemove.startTime || a.endTime !== availabilityToRemove.endTime
      );
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

  removeEnrollment(code: string) {
    const db = load();
    const me = assertLoggedIn(db);
    const course = db.courses.find((c) => c.code === normalize(code));
    if (course) {
      db.enrollments = db.enrollments.filter(
        (e) => !(e.studentId === me && e.courseId === course.id)
      );
      save(db);
    }
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

  /**
   * Find a single user by their username (case-insensitive).
   */
  getUserByUsername(username: string): Student | undefined {
    const db = load();
    return db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  // --- Study Session Management ---

  /**
   * Create a study session request.
   */
  createStudySessionRequest(requesteeId: ID, courseId: ID, time: number): StudySession {
    const db = load();
    const requesterId = assertLoggedIn(db);
    if (requesterId === requesteeId) {
      throw new Error("You cannot send a study request to yourself.");
    }
    const newSession: StudySession = {
      id: uuid(),
      requesterId,
      requesteeId,
      courseId,
      time,
      status: "pending",
      createdAt: Date.now(),
    };
    db.studySessions.push(newSession);
    log("createStudySessionRequest: created", newSession);
    save(db);
    return newSession;
  },

  // Get all pending requests for the currently logged-in user
  listPendingRequestsForMe(): DetailedStudySession[] {
    const db = load();
    const me = assertLoggedIn(db);

    const requests = db.studySessions.filter(
      (s) => s.requesteeId === me && s.status === 'pending'
    );

    // Enrich the data with requester and course info
    return requests.map((session) => {
      const requester = db.users.find((u) => u.id === session.requesterId);
      const requestee = db.users.find((u) => u.id === session.requesteeId);
      const course = db.courses.find((c) => c.id === session.courseId);

      const participants: { id: ID; name: string; username: string }[] = [];
      if (requester) participants.push(requester);
      if (requestee) participants.push(requestee);

      return {
        id: session.id,
        courseCode: course?.code ?? 'Unknown Course',
        time: new Date(session.time).toLocaleString(),
        participants: participants.map(p => ({ id: p.id, name: p.name, username: p.username })),
      };
    });
  },
  // Update the status of a specific study session
  updateStudySessionStatus(sessionId: ID, newStatus: StudySessionStatus): StudySession {
    const db = load();
    const me = assertLoggedIn(db);
    const session = db.studySessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new Error('Study session not found.');
    }
    if (session.requesteeId !== me) {
      throw new Error('You are not authorized to update this session.');
    }

    session.status = newStatus;
    log('updateStudySessionStatus: updated', session);
    save(db);
    return session;
  },

  listMyStudySessions(): DetailedStudySession[] {
    const db = load();
    const me = db.currentUserId;
    if (!me) return [];

    const mySessions = db.studySessions.filter(
      (s) => s.status === 'confirmed' && (s.requesterId === me || s.requesteeId === me)
    );

    return mySessions.map((session) => {
      const course = db.courses.find((c) => c.id === session.courseId);
      const requester = db.users.find((u) => u.id === session.requesterId);
      const requestee = db.users.find((u) => u.id === session.requesteeId);
      
      const participants = [requester, requestee].filter(Boolean) as Student[];

      return {
        id: session.id,
        courseCode: course?.code ?? "Unknown Course",
        time: new Date(session.time).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }),
        participants: participants.map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username,
        })),
      };
    });
  },

  listMyCoursesByStudentId(studentId: ID): Course[] {
    const db = load();
    const courseIds = new Set(db.enrollments.filter((e) => e.studentId === studentId).map((e) => e.courseId));
    return db.courses.filter((c) => courseIds.has(c.id));
  },

  /**
   * List mutual courses between the current user and another student.
   */
  listMutualCourses(otherStudentId: ID): Course[] {
    const db = load();
    const meId = assertLoggedIn(db);

    const myCourses = this.listMyCoursesByStudentId(meId);
    const theirCourses = this.listMyCoursesByStudentId(otherStudentId);

    const myCourseIds = new Set(myCourses.map(c => c.id));
    return theirCourses.filter(c => myCourseIds.has(c.id));
  },

  getCourseByCode(code: string): Course | undefined {
    const db = load();
    return db.courses.find(c => c.code === normalize(code));
  },

  suggestStudyBuddies(): Student[] {
    const db = load();
    const meId = assertLoggedIn(db);
    const me = db.users.find(u => u.id === meId);
    if (!me) return [];

    const myCourses = new Set(this.listMyCourses().map(c => c.id));
    const myAvailability = me.availability ?? [];

    const potentialBuddies = db.users.filter(user => {
      if (user.id === meId) return false;

      // Condition 1: Must have at least one mutual course.
      const theirCourses = new Set(this.listMyCoursesByStudentId(user.id).map(c => c.id));
      const mutualCourses = [...myCourses].filter(courseId => theirCourses.has(courseId));
      if (mutualCourses.length === 0) return false;

      // Condition 2: Must have overlapping availability.
      const theirAvailability = user.availability ?? [];
      for (const mySlot of myAvailability) {
        for (const theirSlot of theirAvailability) {
          if (mySlot.day === theirSlot.day) {
            const myStart = parseInt(mySlot.startTime.replace(':', ''));
            const myEnd = parseInt(mySlot.endTime.replace(':', ''));
            const theirStart = parseInt(theirSlot.startTime.replace(':', ''));
            const theirEnd = parseInt(theirSlot.endTime.replace(':', ''));

            if (Math.max(myStart, theirStart) < Math.min(myEnd, theirEnd)) {
              return true; // Found an overlap, this is a match.
            }
          }
        }
      }
      
      return false; // No overlap found.
    });

    return potentialBuddies;
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
