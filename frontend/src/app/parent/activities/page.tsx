'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

interface StudentActivity {
  selectedActivityId: string;
  agentSuggestionId: string;
  pointerNo: number;
  title: string;
  description: string;
  tags: string[];
  selectedAt: string;
  proofUploaded: boolean;
  submission: {
    _id: string;
    files: string[];
    remarks?: string;
    submittedAt: string;
  } | null;
  evaluated: boolean;
  evaluation: {
    _id: string;
    score: number;
    feedback?: string;
    evaluatedAt: string;
  } | null;
}

function ActivitiesContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');

  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!studentId) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/pointer/activity/student/${studentId}`
        );
        if (response.data.success) {
          setActivities(response.data.data);
        }
      } catch (error: any) {
        console.error('Error fetching activities:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load activities';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [studentId]);

  const getPointerLabel = (pointerNo: number): string => {
    switch (pointerNo) {
      case 2:
        return 'Pointer 2: Spike in One Area';
      case 3:
        return 'Pointer 3: Leadership & Initiative';
      case 4:
        return 'Pointer 4: Global & Social Impact';
      default:
        return `Pointer ${pointerNo}`;
    }
  };

  // Calculate summary statistics
  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.evaluated).length;
  const proofUploadedCount = activities.filter((a) => a.proofUploaded).length;
  const averageScore =
    activities.filter((a) => a.evaluated).length > 0
      ? (
          activities
            .filter((a) => a.evaluated)
            .reduce((sum, a) => sum + a.evaluation!.score, 0) /
          activities.filter((a) => a.evaluated).length
        ).toFixed(1)
      : null;

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-md">
            Student ID is required. Please provide studentId as a query parameter.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Activities Progress</h1>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Summary Statistics */}
        {activities.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium">Total Activities</p>
              <p className="text-2xl font-bold text-blue-900">{totalActivities}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 font-medium">Proof Uploaded</p>
              <p className="text-2xl font-bold text-yellow-900">{proofUploadedCount}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium">Evaluated</p>
              <p className="text-2xl font-bold text-green-900">{completedActivities}</p>
            </div>
            {averageScore && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-700 font-medium">Average Score</p>
                <p className="text-2xl font-bold text-purple-900">{averageScore}/10</p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading activities...</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No activities assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div
                key={activity.selectedActivityId}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {getPointerLabel(activity.pointerNo)}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {activity.description}
                  </p>
                </div>

                {/* Status Indicators */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.proofUploaded
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {activity.proofUploaded ? '✓ Proof Uploaded' : '⏳ Awaiting Proof'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.evaluated
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {activity.evaluated ? '✓ Evaluated' : '⏳ Not Evaluated'}
                  </span>
                </div>

                {/* Proof Info (Read-only) */}
                {activity.proofUploaded && (
                  <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm font-medium text-gray-900 mb-2">Proof Submitted</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Submitted: {new Date(activity.submission!.submittedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.submission!.files.length} file(s) uploaded
                    </p>
                  </div>
                )}

                {/* Evaluation Score (Read-only) */}
                {activity.evaluated && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Score: {activity.evaluation!.score}/10
                    </p>
                    {activity.evaluation!.feedback && (
                      <p className="text-sm text-green-800 whitespace-pre-wrap mt-2">
                        {activity.evaluation!.feedback}
                      </p>
                    )}
                    <p className="text-xs text-green-700 mt-2">
                      Evaluated: {new Date(activity.evaluation!.evaluatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActivitiesContent />
    </Suspense>
  );
}

