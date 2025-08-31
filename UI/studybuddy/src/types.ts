// src/types.ts

export type ID = string;
export interface Student { 
  id: ID; 
  name: string; 
  username: string; 
  createdAt: number; 
  availability?: Availability[]; 
}
export interface Course { id: ID; code: string; title?: string; }
export interface Enrollment { studentId: ID; courseId: ID; createdAt: number; }

// Add new types for Study Sessions
export type StudySessionStatus = "pending" | "confirmed" | "declined";

export interface StudySession {
  id: ID;
  courseId: ID;
  requesterId: ID;
  requesteeId: ID;
  time: number; // Unix timestamp
  status: StudySessionStatus;
  createdAt: number;
}

export interface DetailedStudySession {
    id: ID;
    courseCode: string;
    time: string;
    participants: { id: ID; name: string; username: string }[];
}

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}
