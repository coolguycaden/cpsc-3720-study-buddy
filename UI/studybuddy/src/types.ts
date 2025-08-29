// src/types.ts

export type ID = string;
export type Weekday = 0|1|2|3|4|5|6;
export interface Student { 
  id: ID; 
  name: string; 
  username: string; 
  createdAt: number; 
  availability?: string[]; 
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
  proposedTime: number; // Unix timestamp
  status: StudySessionStatus;
  createdAt: number;
}

// Add an enriched type to hold joined data for the UI
export interface EnrichedStudySession extends StudySession {
  requesterName: string;
  courseCode: string;
}

