// src/features/profiles/PendingRequestsPanel.tsx
import { useEffect, useState } from "react";
import { DB } from "../../mocks/db";
import type { DetailedStudySession, StudySessionStatus } from "../../types";
import { useUser } from "../../store/user";

// Confirmation Modal Component
function ConfirmationModal({ session, onConfirm, onCancel, requesterName}: {
  session: DetailedStudySession;
  onConfirm: () => void;
  onCancel: () => void;
  requesterName: string
}) {
  const date = new Date(session.time).toLocaleString();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-4">Confirm Study Session</h3>
        <p>Are you sure you want to accept this study session with <span className="font-semibold">{requesterName}</span> for <span className="font-semibold">{session.courseCode}</span> at <span className="font-semibold">{date}</span>?</p>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onCancel} className="px-4 py-2 rounded text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Panel Component
export default function PendingRequestsPanel() {
  const [requests, setRequests] = useState<DetailedStudySession[]>([]);
  const [sessionToConfirm, setSessionToConfirm] = useState<DetailedStudySession | null>(null);
  const me = useUser((s) => s.me);

  const refreshRequests = () => {
    setRequests(DB.listPendingRequestsForMe());
  };

  useEffect(() => {
    refreshRequests();
  }, []);

  const handleUpdateRequest = (sessionId: string, status: StudySessionStatus) => {
    try {
      DB.updateStudySessionStatus(sessionId, status);
      refreshRequests();
    } catch (error) {
      console.error("Failed to update session status:", error);
      alert("An error occurred. Please try again.");
    }
  };
  
  const handleAcceptClick = (session: DetailedStudySession) => {
    setSessionToConfirm(session);
  };

  const handleConfirm = () => {
    if (sessionToConfirm) {
      handleUpdateRequest(sessionToConfirm.id, 'confirmed');
      setSessionToConfirm(null);
    }
  };

  const handleCancel = () => {
    setSessionToConfirm(null);
  };

  if (requests.length === 0) {
    return <p className="text-sm text-neutral-500">You have no pending study session requests.</p>;
  }

  return (
    <div>
      <ul className="divide-y rounded border bg-white">
        {requests.map((req) => {
          const requester = req.participants.find(p => p.id !== me?.id);

          return (
            <li key={req.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  Request from <span className="font-semibold">{requester?.name ?? 'Unknown'}</span>
                </div>
                <div className="text-sm text-neutral-600">
                  For: {req.courseCode} at {req.time}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAcceptClick(req)} className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700">
                  Accept
                </button>
                <button onClick={() => handleUpdateRequest(req.id, 'declined')} className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">
                  Decline
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {sessionToConfirm && (
        <ConfirmationModal
          session={sessionToConfirm}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          requesterName={sessionToConfirm.participants.find(p => p.id !== me?.id)?.name ?? 'Unknown'}
        />
      )}
    </div>
  );
}