// src/features/profiles/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DB } from "../../mocks/db.ts";
import type { Student, Availability } from "../../types";
import { useUser } from "../../store/user.ts";
import PendingRequestsPanel from "./PendingRequestsPanel.tsx"; // Import the new panel
import RequestSessionModal from "./RequestSessionModal.tsx";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const me = useUser((s) => s.me);
  const [sessionRequest, setSessionRequest] = useState<{ student: Student; availability: Availability } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check if the profile being viewed belongs to the logged-in user
  const isMyProfile = me?.username.toLowerCase() === username?.toLowerCase();

  // Fetch student data
  useEffect(() => {
    if (username) {
      const foundStudent = DB.getUserByUsername(username);
      setStudent(foundStudent);
    }
  }, [username]);

  const handleRequestSuccess = () => {
    setSessionRequest(null);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000); // Hide message after 3s
  };

  // Loading state
  if (student === undefined) {
    return <p>Loading profile...</p>;
  }

  // Not found state
  if (!student) {
    return <p>Student profile not found for @{username}.</p>;
  }

  // Success state
  return (
    <div>
      <h1 className="text-3xl font-bold">{student.name}</h1>
      <p className="text-lg text-neutral-600">@{student.username}</p>
      
      <hr className="my-6" />

      {showSuccessMessage && (
        <div className="mb-4 p-3 rounded-md bg-green-100 text-green-800 border border-green-200">
            Study session request sent successfully!
        </div>
      )}

      {/* Conditionally render the pending requests panel */}
      {isMyProfile && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Pending Study Session Requests</h2>
          <PendingRequestsPanel />
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold mb-3">Weekly Availability</h2>
          {student.availability && student.availability.length > 0 ? (
            <ul className="divide-y rounded border bg-white">
              {student.availability.map((avail, index) => (
                <li key={index} className="p-3 flex items-center justify-between">
                   <div>
                        <span className="font-medium">{avail.day}:</span>
                        <span className="text-neutral-700 ml-2">{`${avail.startTime} - ${avail.endTime}`}</span>
                    </div>
                    {!isMyProfile && (
                        <button 
                            onClick={() => setSessionRequest({ student, availability: avail })}
                            className="px-3 py-1 text-sm text-white bg-black rounded hover:bg-gray-800"
                        >
                            Request Study Session
                        </button>
                    )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No availability set.</p>
          )}
        </section>
      </div>
      
      {sessionRequest && (
        <RequestSessionModal
            student={sessionRequest.student}
            availability={sessionRequest.availability}
            onClose={() => setSessionRequest(null)}
            onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}

