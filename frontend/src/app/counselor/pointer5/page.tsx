'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

interface Pointer5Status {
  studentIvyServiceId: string;
  guideline: {
    _id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  } | null;
  essay: {
    _id: string;
    fileName: string;
    fileUrl: string;
    submittedAt: string;
  } | null;
  evaluation: {
    score: number;
    feedback: string;
    evaluatedAt: string;
  } | null;
}

function Pointer5Content() {
  const searchParams = useSearchParams();
  const studentIvyServiceId = searchParams.get('studentIvyServiceId');
  const counselorId = searchParams.get('counselorId') || '695b93a44df1114a001dc23d'; // TODO: Get from auth

  const [status, setStatus] = useState<Pointer5Status | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingGuideline, setUploadingGuideline] = useState<boolean>(false);
  const [uploadingEvaluation, setUploadingEvaluation] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  // Fetch status
  useEffect(() => {
    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/pointer5/status`, {
          params: { studentIvyServiceId },
        });
        if (response.data.success) {
          setStatus(response.data.data);
          if (response.data.data.evaluation) {
            setScore(response.data.data.evaluation.score.toString());
            setFeedback(response.data.data.evaluation.feedback || '');
          } else {
            setScore('');
            setFeedback('');
          }
        }
      } catch (error: any) {
        console.error('Error fetching status:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load status';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [studentIvyServiceId]);

  const handleGuidelineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    setUploadingGuideline(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('guidelineFile', file);
      formData.append('studentIvyServiceId', studentIvyServiceId);
      formData.append('counselorId', counselorId);

      const response = await axios.post('http://localhost:5000/api/pointer5/guideline/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Guideline uploaded successfully!' });
        // Refresh status
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload guideline';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingGuideline(false);
    }
  };

  const handleEvaluate = async () => {
    if (!status?.essay) {
      setMessage({ type: 'error', text: 'No essay submitted yet' });
      return;
    }

    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      setMessage({ type: 'error', text: 'Score must be between 0 and 10' });
      return;
    }

    setUploadingEvaluation(true);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/api/pointer5/essay/evaluate', {
        essaySubmissionId: status.essay._id,
        score: scoreNum,
        feedback,
        counselorId,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Essay evaluated successfully!' });
        // Refresh status
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to evaluate essay';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingEvaluation(false);
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(`http://localhost:5000${fileUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pointer 5: Essay Management</h1>

        <div className="space-y-6">
          {/* Upload Guideline Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Essay Guideline</h2>
            <div className="space-y-4">
              {status?.guideline ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-900 mb-2">Guideline Uploaded:</p>
                  <p className="text-sm text-green-700 mb-2">{status.guideline.fileName}</p>
                  <button
                    onClick={() => downloadFile(status.guideline!.fileUrl, status.guideline!.fileName)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="guidelineFile"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleGuidelineUpload}
                    disabled={uploadingGuideline}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs text-gray-500">Upload Word document (.doc, .docx)</p>
                </div>
              )}
            </div>
          </div>

          {/* View Student Essay Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Essay</h2>
            {status?.essay ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-2">Essay Submitted:</p>
                  <p className="text-sm text-blue-700 mb-2">{status.essay.fileName}</p>
                  <p className="text-xs text-blue-600 mb-3">
                    Submitted: {new Date(status.essay.submittedAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => downloadFile(status.essay!.fileUrl, status.essay!.fileName)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download Essay
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No essay submitted yet.</p>
            )}
          </div>

          {/* Evaluate Essay Section */}
          {status?.essay && (
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Evaluate Essay</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                    Score (0-10)
                  </label>
                  <input
                    type="number"
                    id="score"
                    min="0"
                    max="10"
                    step="0.1"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    disabled={uploadingEvaluation}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Enter score (0-10)"
                  />
                </div>
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={uploadingEvaluation}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-gray-900 bg-white"
                    placeholder="Enter feedback..."
                  />
                </div>
                <button
                  onClick={handleEvaluate}
                  disabled={uploadingEvaluation || !score}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingEvaluation ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </div>
          )}

          {/* Current Evaluation Display */}
          {status?.evaluation && (
            <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Evaluation</h2>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Score:</span> {status.evaluation.score}/10
                </p>
                {status.evaluation.feedback && (
                  <p className="text-sm">
                    <span className="font-medium">Feedback:</span> {status.evaluation.feedback}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Evaluated: {new Date(status.evaluation.evaluatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
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

export default function Pointer5Page() {
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
      <Pointer5Content />
    </Suspense>
  );
}

