'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

function ExcelViewer({ url, onClose }: { url: string, onClose: () => void }) {
  const fullUrl = `http://localhost:5000${url}`;
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError('');
    
    fetch(fullUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setExcelData(data as any[][]);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading Excel file:', error);
        setError('Failed to load Excel file. Please try downloading instead.');
        setLoading(false);
      });
  }, [fullUrl]);

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
      <div className="min-h-[500px] max-h-[800px] overflow-auto bg-white p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading Excel file...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <a 
              href={fullUrl} 
              download 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Download Excel File
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <tbody>
                {excelData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex === 0 ? 'bg-blue-50 font-semibold' : ''}>
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className="border border-gray-300 px-4 py-2 text-sm text-gray-900"
                      >
                        {cell !== null && cell !== undefined ? String(cell) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

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
    evaluation: {
      score: number;
      feedback: string;
      evaluatedAt: string;
    } | null;
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
  const [replacingCertId, setReplacingCertId] = useState<string | null>(null);
  const [viewingCourseList, setViewingCourseList] = useState<boolean>(false);

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

  const handleReplaceCertificate = async (certificateId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('studentId', studentId);

      const response = await axios.put(
        `http://localhost:5000/api/pointer6/certificate/${certificateId}/replace`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Certificate replaced successfully. Waiting for re-evaluation.' });
        setReplacingCertId(null);
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to replace certificate';
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
              <div className="space-y-3">
                <p className="text-sm text-gray-700 mb-3">
                  Your counselor has uploaded the course list: <span className="font-medium">{status.courseList.fileName}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadFile(status.courseList!.fileUrl)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                  >
                    Download Course List
                  </button>
                  <button
                    onClick={() => setViewingCourseList(!viewingCourseList)}
                    className={`py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                      viewingCourseList 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    {viewingCourseList ? 'Hide Course List' : 'View Course List'}
                  </button>
                </div>
                {viewingCourseList && (
                  <ExcelViewer url={status.courseList.fileUrl} onClose={() => setViewingCourseList(false)} />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Course list not available yet. Please wait for your counselor to upload it.</p>
            )}
          </div>

          {/* Upload certificates */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Certificates</h2>
            {status?.certificates && status.certificates.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-900 mb-3">Uploaded Certificates:</p>
                <ul className="space-y-4">
                  {status.certificates.map((cert) => (
                    <li key={cert._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{cert.fileName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Uploaded: {new Date(cert.uploadedAt).toLocaleString()}
                          </p>
                          
                          {/* Individual Certificate Evaluation */}
                          {cert.evaluation ? (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-xs font-semibold text-green-900 mb-1">
                                Score: <span className="text-lg">{cert.evaluation.score}/10</span>
                              </p>
                              {cert.evaluation.feedback && (
                                <p className="text-xs text-gray-700 mt-2">
                                  <span className="font-medium">Feedback:</span> {cert.evaluation.feedback}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Evaluated: {new Date(cert.evaluation.evaluatedAt).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-xs text-yellow-800 font-medium">
                                ⏳ Awaiting counselor evaluation
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => setViewingFileUrl(viewingFileUrl === cert.fileUrl ? null : cert.fileUrl)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                              viewingFileUrl === cert.fileUrl 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50'
                            }`}
                          >
                            {viewingFileUrl === cert.fileUrl ? 'Hide' : 'View'}
                          </button>
                          
                          {replacingCertId === cert._id ? (
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-600 text-white cursor-pointer hover:bg-blue-700 text-center whitespace-nowrap">
                                Choose File
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                  onChange={(e) => handleReplaceCertificate(cert._id, e)}
                                  disabled={uploading}
                                  className="hidden"
                                />
                              </label>
                              <button
                                onClick={() => setReplacingCertId(null)}
                                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplacingCertId(cert._id)}
                              disabled={uploading}
                              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                            >
                              Replace
                            </button>
                          )}
                        </div>
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


