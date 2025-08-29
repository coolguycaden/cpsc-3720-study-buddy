// src/features/profiles/PendingRequestsPanel.tsx
import { useEffect, useState } from "react";
import { DB } from "../../mocks/db";
import type { EnrichedStudySession, StudySessionStatus } from "../../types";

// Confirmation Modal Component
function ConfirmationModal({ session, onConfirm, onCancel }: {
  session: EnrichedStudySession;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const date = new Date(session.proposedTime).toLocaleString();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-4">Confirm Study Session</h3>
        <p>Are you sure you want to accept this study session with <span className="font-semibold">{session.requesterName}</span> for <span className="font-semibold">{session.courseCode}</span> at <span className="font-semibold">{date}</span>?</p>
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
  const [requests, setRequests] = useState<EnrichedStudySession[]>([]);
  const [sessionToConfirm, setSessionToConfirm] = useState<EnrichedStudySession | null>(null);

  // Function to refresh the list of pending requests
  const refreshRequests = () => {
    setRequests(DB.listPendingRequestsForMe());
  };

  // Load requests on initial render
  useEffect(() => {
    refreshRequests();
  }, []);

  // Handle updating the status of a request
  const handleUpdateRequest = (sessionId: string, status: StudySessionStatus) => {
    try {
      DB.updateStudySessionStatus(sessionId, status);
      refreshRequests(); // Refresh the list after an update
    } catch (error) {
      console.error("Failed to update session status:", error);
      alert("An error occurred. Please try again.");
    }
  };
  
  // Handle the confirmation flow
  const handleAcceptClick = (session: EnrichedStudySession) => {
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


  // Render empty state if no requests
  if (requests.length === 0) {
    return <p className="text-sm text-neutral-500">You have no pending study session requests.</p>;
  }

  // Render list of requests
  return (
    <div>
      <ul className="divide-y rounded border bg-white">
        {requests.map((req) => (
          <li key={req.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">
                Request from <span className="font-semibold">{req.requesterName}</span>
              </div>
              <div className="text-sm text-neutral-600">
                For: {req.courseCode} at {new Date(req.proposedTime).toLocaleString()}
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
        ))}
      </ul>
      {sessionToConfirm && (
        <ConfirmationModal
          session={sessionToConfirm}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
