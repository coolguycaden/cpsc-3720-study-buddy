export type ID = string;
export type Weekday = 0|1|2|3|4|5|6;

export interface Student { id: ID; name: string; username: string; createdAt: number; availability?: string[]}
export interface Course { id: ID; code: string; title?: string; }
export interface Enrollment { studentId: ID; courseId: ID; createdAt: number; }
