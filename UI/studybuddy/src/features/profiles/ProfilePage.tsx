// src/features/profiles/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DB } from "../../mocks/db";
import type { Student } from "../../types";

export default function ProfilePage() {
  // Get the username from the URL, e.g., "/profiles/eli_monroe"
  const { username } = useParams<{ username: string }>();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);

  // Fetch the student's data when the component mounts or username changes
  useEffect(() => {
    if (username) {
      const foundStudent = DB.getUserByUsername(username);
      setStudent(foundStudent);
    }
  }, [username]);

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

      {/* This is where US04 (Availability) and US07 (Requests) will go */}
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold mb-3">Weekly Availability</h2>
          <p className="text-sm text-neutral-500">(Availability will be shown here)</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Study Session Requests</h2>
          <p className="text-sm text-neutral-500">(Session requests will be managed here)</p>
        </section>
      </div>
    </div>
  );
}