import { create } from "zustand";
import type { Student } from "../types";
import { DB } from "../mocks/db";

type UserState = {
  me?: Student;
  init: () => void;
  login: (username: string) => Promise<void>;
  createProfile: (name: string, username: string) => Promise<void>;
  logout: () => void;
};

export const useUser = create<UserState>((set) => ({
  me: undefined,
  init: () => set({ me: DB.me() }),
  login: async (username) => { const u = DB.login(username); set({ me: u }); },
  createProfile: async (name, username) => { const u = DB.createUser(name, username); set({ me: u }); },
  logout: () => { DB.logout(); set({ me: undefined }); },
}));
