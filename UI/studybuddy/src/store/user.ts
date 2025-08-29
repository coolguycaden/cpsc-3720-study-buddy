// src/store/user.ts
import { create } from "zustand";
import type { Student } from "../types";
import { DB } from "../mocks/db";

/**
 * Global auth/session state for the app.
 *
 * This store wraps the mock DB’s auth methods so React components don't touch
 * localStorage directly. Call `init()` once on app mount (e.g., in a layout or guard)
 * to hydrate `me` from persisted state.
 *
 * Example:
 *   const me = useUser(s => s.me);
 *   const login = useUser(s => s.login);
 *   // ...
 *   await login("eli_mon"); // sets me + persists via DB
 */
type UserState = {
  /** The currently logged-in user (undefined if not logged in). */
  me?: Student;

  /**
   * Hydrate `me` from storage.
   * Call this once at app start (or in your route guard) so the UI knows
   * who is logged in without extra clicks.
   */
  init: () => void;

  /**
   * Log in by username (case-insensitive; validation inside DB layer).
   * On success, sets `me`.
   * Throws on "User not found".
   */
  login: (username: string) => Promise<void>;

  /**
   * Create a profile and immediately log in.
   * - Validates username format + uniqueness (handled by DB).
   * On success, sets `me`.
   */
  createProfile: (name: string, username: string) => Promise<void>;

  /**
   * Log out and clear `me`.
   */
  logout: () => void;

  /**
   * adds time user is avaliable to their profile
   */
  addMeetingTime: (time: string) => Promise<void>;

  /**
   * removes course from user profile
   */
  removeCourse: (code: string) => Promise<void>;

  /**
   * removes user time from profile
   */
  removeAvailability: (time: string) => Promise<void>;
};

/**
 * Zustand store for auth/session.
 * Note: DB methods are synchronous in this mock, but we keep async signatures
 * so swapping to a real backend later is painless.
 */
export const useUser = create<UserState>((set) => ({
  // No user until we hydrate or authenticate.
  me: undefined,

  // Read current user from the DB (localStorage-backed).
  init: () => set({ me: DB.me() }),
  login: async (username) => { const u = DB.login(username); set({ me: u }); },
  createProfile: async (name, username) => { const u = DB.createUser(name, username); set({ me: u }); },
  logout: () => { DB.logout(); set({ me: undefined }); },
  addMeetingTime: async (time) => {
    DB.addMeetingTime(time);
    set({ me: DB.me() });
  },
  removeCourse: async (code) => {
    DB.removeEnrollment(code);
    set({ me: DB.me() });
  },
  removeAvailability: async (time) => {
    DB.removeMeetingTime(time);
    set({ me: DB.me() });
  },
}));
