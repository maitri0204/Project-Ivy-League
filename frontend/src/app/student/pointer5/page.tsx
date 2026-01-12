'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

function InlineDocViewer({ url, onClose }: { url: string, onClose: () => void }) {
  const fullUrl = `http://localhost:5000${url}`;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className="mt-4 relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 animate-in fade-in zoom-in-95 duration-300">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/20"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="min-h-[500px] flex items-center justify-center bg-gray-800">
        {isImage ? (
          <img src={fullUrl} alt="Document" className="max-w-full max-h-[800px] object-contain" />
        ) : (
          <iframe src={fullUrl} className="w-full h-[600px] border-none" title="Document Viewer" />
        )}
      </div>
    </div>
  );
}

interface Pointer5Status {
  studentIvyServiceId: string;
  studentId: string;
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
  const paramStudentId = searchParams.get('studentId');

  const [status, setStatus] = useState<Pointer5Status | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingEssay, setUploadingEssay] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);

  // Fetch status
  useEffect(() => {
    let trimmedId = studentIvyServiceId?.trim();
    if (trimmedId) {
      trimmedId = trimmedId.replace(/['"]+/g, '');
    }

    if (!trimmedId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    if (trimmedId.length !== 24) {
      setMessage({ type: 'error', text: 'Invalid Student Ivy Service ID' });
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/pointer5/status`, {
          params: { studentIvyServiceId: trimmedId },
        });
        if (response.data.success) {
          setStatus(response.data.data);
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

  const handleEssayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    // Use studentId from status or params
    const effectiveStudentId = status?.studentId || paramStudentId;

    if (!effectiveStudentId) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }

    setUploadingEssay(true);
    setMessage(null);

    try {
      const formData = new FormData();
      // Append fields BEFORE file for better compatibility
      formData.append('studentIvyServiceId', studentIvyServiceId.trim());
      formData.append('studentId', effectiveStudentId.trim());
      formData.append('essayFile', file);

      const response = await axios.post('http://localhost:5000/api/pointer5/essay/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Essay uploaded successfully!' });
        // Refresh status
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload essay';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingEssay(false);
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
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-red-100 p-8">
          <div className="bg-red-50 text-red-800 border border-red-200 p-6 rounded-2xl font-bold uppercase tracking-tight text-center">
            Student Ivy Service ID is required. Please provide studentIvyServiceId as a query parameter.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 p-10 mt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pointer 5: Essay Management</h1>

        <div className="space-y-6">
          {/* Download Guideline Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Essay Guideline</h2>
            {status?.guideline ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-2">Guideline Available:</p>
                  <p className="text-sm text-blue-700 mb-3">{status.guideline.fileName}</p>
                  <button
                    onClick={() => downloadFile(status.guideline!.fileUrl, status.guideline!.fileName)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Download Guideline
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Guideline not available yet. Please wait for your counselor to upload it.</p>
            )}
          </div>

          {/* Upload Essay Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Essay</h2>
            {status?.essay ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-900 mb-2">Essay Uploaded:</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-green-700 mb-2">{status.essay.fileName}</p>
                    <p className="text-xs text-green-600 mb-3">
                      Submitted: {new Date(status.essay.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingFileUrl(viewingFileUrl === status.essay!.fileUrl ? null : status.essay!.fileUrl)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${viewingFileUrl === status.essay!.fileUrl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-100'}`}
                  >
                    {viewingFileUrl === status.essay!.fileUrl ? 'Hide Essay' : 'View Essay'}
                  </button>
                </div>
                {viewingFileUrl === status.essay.fileUrl && (
                  <InlineDocViewer url={status.essay.fileUrl} onClose={() => setViewingFileUrl(null)} />
                )}
                <p className="text-sm text-gray-600 mt-4">You can upload a new file to replace the existing one.</p>
              </div>
            ) : null}
            <div className="mt-4">
              <input
                type="file"
                id="essayFile"
                accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                onChange={handleEssayUpload}
                disabled={uploadingEssay || !status?.guideline}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500">
                Upload Word document (.doc, .docx) or PDF file
              </p>
              {!status?.guideline && (
                <p className="mt-2 text-xs text-red-500">
                  Please wait for your counselor to upload the guideline first.
                </p>
              )}
            </div>
          </div>

          {/* View Score Section */}
          {status?.evaluation && (
            <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Essay Score</h2>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-800">
                  {status.evaluation.score}/10
                </p>
                {status.evaluation.feedback && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Feedback:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{status.evaluation.feedback}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-4">
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
    <div className="font-sans">
      <Suspense
        fallback={
          <div className="p-20 text-center text-indigo-400 font-black tracking-widest uppercase animate-pulse">Syncing Narrative Data...</div>
        }
      >
        <Pointer5Content />
      </Suspense>
    </div>
  );
}

