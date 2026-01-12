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
  const studentId = searchParams.get('studentId') || '1'; // TODO: get from auth

  const [status, setStatus] = useState<Pointer6Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);

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

  const handleCertificatesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('certificates', file);
      });
      formData.append('studentIvyServiceId', studentIvyServiceId);
      formData.append('studentId', studentId);

      const response = await axios.post('http://localhost:5000/api/pointer6/certificate/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Certificates uploaded successfully' });
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload certificates';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Pointer 6: Engagement with Learning & Intellectual Curiosity
        </h1>

        <div className="space-y-6">
          {/* Course list view */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Courses</h2>
            {status?.courseList ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Your counselor has uploaded the course list: <span className="font-medium">{status.courseList.fileName}</span>
                </p>
                <button
                  onClick={() => downloadFile(status.courseList!.fileUrl)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Download Course List (Excel)
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Course list not available yet. Please wait for your counselor to upload it.</p>
            )}
          </div>

          {/* Upload certificates */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Certificates</h2>
            {status?.certificates && status.certificates.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Uploaded Certificates:</p>
                <ul className="space-y-2 text-sm">
                  {status.certificates.map((cert) => (
                    <li key={cert._id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium tracking-tight uppercase">{cert.fileName}</span>
                        <button
                          onClick={() => setViewingFileUrl(viewingFileUrl === cert.fileUrl ? null : cert.fileUrl)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${viewingFileUrl === cert.fileUrl ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 underline'}`}
                        >
                          {viewingFileUrl === cert.fileUrl ? 'Hide' : 'View'}
                        </button>
                      </div>
                      {viewingFileUrl === cert.fileUrl && (
                        <InlineDocViewer url={cert.fileUrl} onClose={() => setViewingFileUrl(null)} />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleCertificatesUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500">
                You can upload multiple certificates (PDF or images). Upload new files anytime as you complete more courses.
              </p>
            </div>
          </div>

          {/* View score */}
          {status?.evaluation && (
            <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Score</h2>
              <p className="text-3xl font-bold text-green-800 mb-2">
                {status.evaluation.score}/10
              </p>
              {status.evaluation.feedback && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">Feedback</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-md border border-gray-200">
                    {status.evaluation.feedback}
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Last updated: {new Date(status.evaluation.evaluatedAt).toLocaleString()}
              </p>
            </div>
          )}

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
    <div className="font-sans">
      <Suspense
        fallback={
          <div className="p-20 text-center text-indigo-400 font-black tracking-widest uppercase animate-pulse">Syncing Course Progress...</div>
        }
      >
        <Pointer6Content />
      </Suspense>
    </div>
  );
}


