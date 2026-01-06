'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

interface Pointer6Status {
  studentIvyServiceId: string;
  courseList: {
    _id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  } | null;
  certificates: {
    _id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }[];
  evaluation: {
    score: number;
    feedback: string;
    evaluatedAt: string;
  } | null;
}

function Pointer6Content() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');

  const [status, setStatus] = useState<Pointer6Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!studentId) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/pointer6/status/${studentId}`);
        if (response.data.success) {
          setStatus(response.data.data);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to load status';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [studentId]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Pointer 6: Engagement with Learning & Intellectual Curiosity
        </h1>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <>
              {/* Evaluation summary */}
              {status?.evaluation ? (
                <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Progress</h2>
                  <p className="text-sm font-medium text-gray-700 mb-1">Score</p>
                  <p className="text-3xl font-bold text-green-800 mb-2">
                    {status.evaluation.score}/10
                  </p>
                  {status.evaluation.feedback && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Counselor Feedback</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-md border border-gray-200">
                        {status.evaluation.feedback}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    Last updated: {new Date(status.evaluation.evaluatedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-6">
                  <p className="text-gray-500 text-center">
                    {status?.certificates && status.certificates.length > 0
                      ? 'Certificates have been uploaded. Waiting for counselor evaluation.'
                      : 'No Pointer 6 progress recorded yet.'}
                  </p>
                </div>
              )}

              {/* Summary of uploads */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>
                    <span className="font-medium">Course list uploaded:</span>{' '}
                    {status?.courseList ? 'Yes' : 'No'}
                  </li>
                  <li>
                    <span className="font-medium">Certificates uploaded:</span>{' '}
                    {status?.certificates ? status.certificates.length : 0}
                  </li>
                </ul>
              </div>
            </>
          )}

          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Pointer6Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
            <div className="text-center text-gray-500">Loading...</div>
          </div>
        </div>
      }
    >
      <Pointer6Content />
    </Suspense>
  );
}


