// src/features/profiles/RequestSessionModal.tsx
import { useEffect, useState } from "react";
import { DB } from "../../mocks/db.ts";
import type { Availability, Course, Student } from "../../types";

interface Props {
  student: Student;
  availability: Availability;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to calculate the next occurrence of a weekday
function getNextSessionTimestamp(day: string, startTime: string): number {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDayIndex = daysOfWeek.indexOf(day);
    const now = new Date();
    const currentDayIndex = now.getDay();
    let daysUntilTarget = targetDayIndex - currentDayIndex;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Ensure it's in the future this week or next
    }
  
    const nextDate = new Date();
    nextDate.setDate(now.getDate() + daysUntilTarget);
    const [hours, minutes] = startTime.split(':').map(Number);
    nextDate.setHours(hours, minutes, 0, 0);
  
    return nextDate.getTime();
}
  

export default function RequestSessionModal({ student, availability, onClose, onSuccess }: Props) {
  const [mutualCourses, setMutualCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const courses = DB.listMutualCourses(student.id);
    setMutualCourses(courses);
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
    setLoading(false);
  }, [student.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedCourseId) {
      setError("Please select a course.");
      return;
    }

    try {
        const time = getNextSessionTimestamp(availability.day, availability.startTime);
        DB.createStudySessionRequest(student.id, selectedCourseId, time);
        onSuccess();
    } catch (err: any) {
        setError(err.message ?? "Failed to send request.");
    }
  }

  if (loading) return null; // Or a loading spinner inside the modal

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Request Study Session</h2>
        <p className="mb-2">With: <span className="font-semibold">{student.name}</span></p>
        <p className="mb-4">Time: <span className="font-semibold">{availability.day}, {availability.startTime} - {availability.endTime}</span></p>
        
        <form onSubmit={handleSubmit}>
            {mutualCourses.length > 0 ? (
                <>
                    <label htmlFor="course-select" className="block text-sm font-medium mb-2">Select a mutual course:</label>
                    <select
                        id="course-select"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full rounded border px-3 py-2 mb-4"
                    >
                        {mutualCourses.map((course) => (
                            <option key={course.id} value={course.id}>{course.code}</option>
                        ))}
                    </select>
                </>
            ) : (
                <p className="text-sm text-neutral-600 mb-4">You have no mutual courses with this student.</p>
            )}

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                    Cancel
                </button>
                <button type="submit" disabled={mutualCourses.length === 0} className="px-4 py-2 rounded text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:bg-gray-300">
                    Send Request
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

