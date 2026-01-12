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
  const studentIvyServiceId = searchParams.get('studentIvyServiceId');
  const counselorId = searchParams.get('counselorId') || '695b93a44df1114a001dc23d'; // TODO: get from auth

  const [status, setStatus] = useState<Pointer6Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingCourseList, setUploadingCourseList] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/pointer6/status', {
          params: { studentIvyServiceId },
        });
        if (response.data.success) {
          setStatus(response.data.data);
          if (response.data.data.evaluation) {
            setScore(response.data.data.evaluation.score.toString());
            setFeedback(response.data.data.evaluation.feedback || '');
          }
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to load status';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [studentIvyServiceId]);

  const handleCourseListUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    setUploadingCourseList(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('courseListFile', file);
      formData.append('studentIvyServiceId', studentIvyServiceId);
      formData.append('counselorId', counselorId);

      const response = await axios.post('http://localhost:5000/api/pointer6/course-list/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Course list uploaded successfully' });
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload course list';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingCourseList(false);
    }
  };

  const handleEvaluate = async () => {
    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      setMessage({ type: 'error', text: 'Score must be between 0 and 10' });
      return;
    }

    setSubmittingScore(true);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/api/pointer6/evaluate', {
        studentIvyServiceId,
        counselorId,
        score: scoreNum,
        feedback,
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Score saved successfully' });
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save score';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmittingScore(false);
    }
  };

  const downloadFile = async (fileUrl: string) => {
    try {
      const response = await fetch(`http://localhost:5000${fileUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = fileUrl.split('/').pop() || 'file';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(`http://localhost:5000${fileUrl}`, '_blank');
    }
  };

  if (!studentIvyServiceId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-md">
            Student Ivy Service ID is required. Please provide studentIvyServiceId as a query parameter.
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
          {/* Course list upload / view */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Course List (Excel)</h2>
            {status?.courseList ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                <p className="text-sm font-medium text-blue-900">Current Course List:</p>
                <p className="text-sm text-blue-700">{status.courseList.fileName}</p>
                <button
                  onClick={() => downloadFile(status.courseList!.fileUrl)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Download Course List
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-2">
                No course list uploaded yet. Upload an Excel file containing the required courses.
              </p>
            )}
            <div className="mt-4">
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleCourseListUpload}
                disabled={uploadingCourseList}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500">Allowed: .xlsx, .xls</p>
            </div>
          </div>

          {/* Certificates */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificates</h2>
            {status?.certificates && status.certificates.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {status.certificates.map((cert) => (
                  <li key={cert._id} className="flex items-center justify-between">
                    <span className="text-gray-700">{cert.fileName}</span>
                    <button
                      onClick={() => downloadFile(cert.fileUrl)}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No certificates uploaded yet.</p>
            )}
          </div>

          {/* Evaluation */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Evaluate Student</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                  Score (0–10)
                </label>
                <input
                  id="score"
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  disabled={submittingScore}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  id="feedback"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={submittingScore}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-gray-900 bg-white"
                  placeholder="Provide feedback on the student's engagement and intellectual curiosity..."
                />
              </div>
              <button
                onClick={handleEvaluate}
                disabled={submittingScore || !score}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingScore ? 'Saving...' : 'Save Score'}
              </button>
            </div>

            {status?.evaluation && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md text-sm">
                <p className="font-medium text-green-900 mb-1">Current Score:</p>
                <p className="text-2xl font-bold text-green-800 mb-2">
                  {status.evaluation.score}/10
                </p>
                {status.evaluation.feedback && (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    <span className="font-medium">Feedback:</span> {status.evaluation.feedback}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(status.evaluation.evaluatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {message && (
            <div
              className={`p-4 rounded-md ${message.type === 'success'
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


