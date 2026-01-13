'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

function InlineDocViewer({ url, onClose }: { url: string, onClose: () => void }) {
  const fullUrl = `http://localhost:5000${url}`;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isWordDoc = /\.docx$/i.test(url);
  const isPDF = /\.pdf$/i.test(url);
  
  const [docHtml, setDocHtml] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [docError, setDocError] = useState<string>('');

  useEffect(() => {
    if (isWordDoc) {
      setLoadingDoc(true);
      setDocError('');
      
      fetch(fullUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => mammoth.convertToHtml({ arrayBuffer }))
        .then(result => {
          setDocHtml(result.value);
          setLoadingDoc(false);
        })
        .catch(error => {
          console.error('Error loading document:', error);
          setDocError('Failed to load document. Please try downloading instead.');
          setLoadingDoc(false);
        });
    }
  }, [fullUrl, isWordDoc]);

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
      <div className="min-h-[500px] max-h-[800px] overflow-y-auto bg-white">
        {isImage ? (
          <div className="flex items-center justify-center p-4 bg-gray-800">
            <img src={fullUrl} alt="Document" className="max-w-full max-h-[800px] object-contain" />
          </div>
        ) : isWordDoc ? (
          <div className="p-8">
            {loadingDoc ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading document...</p>
                </div>
              </div>
            ) : docError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{docError}</p>
                <a 
                  href={fullUrl} 
                  download 
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Download Document
                </a>
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: docHtml }}
                style={{
                  fontFamily: 'Georgia, serif',
                  lineHeight: '1.6',
                  color: '#333'
                }}
              />
            )}
          </div>
        ) : (
          <iframe 
            src={fullUrl} 
            className="w-full h-[600px] border-none" 
            title="Document Viewer"
          />
        )}
      </div>
    </div>
  );
}

function ExcelViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAndParseExcel = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000${url}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setExcelData(data as any[][]);
        setLoading(false);
      } catch (err) {
        console.error('Error loading Excel file:', err);
        setError('Failed to load Excel file. Please try downloading instead.');
        setLoading(false);
      }
    };

    fetchAndParseExcel();
  }, [url]);

  return (
    <div className="mt-4 relative bg-white rounded-lg overflow-hidden shadow-lg border border-gray-300">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-lg font-semibold"
        >
          Close
        </button>
      </div>
      
      <div className="p-6 overflow-auto max-h-[600px]">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading Excel file...</div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">{error}</div>
          </div>
        )}
        
        {!loading && !error && excelData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                {excelData[0] && (
                  <tr className="bg-gray-100">
                    {(excelData[0] as any[]).map((cell, idx) => (
                      <th key={idx} className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                        {cell}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {excelData.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {(row as any[]).map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-gray-300 px-4 py-2 text-gray-900">
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
  const counselorId = searchParams.get('counselorId') || '695b93a44df1114a001dc23d'; // TODO: get from auth

  const [status, setStatus] = useState<Pointer6Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingCourseList, setUploadingCourseList] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isReplacingCourseList, setIsReplacingCourseList] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [evaluatingCertId, setEvaluatingCertId] = useState<string | null>(null);
  const [certScores, setCertScores] = useState<{ [key: string]: string }>({});
  const [certFeedbacks, setCertFeedbacks] = useState<{ [key: string]: string }>({});
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

  // Initialize cert scores and feedbacks when status loads
  useEffect(() => {
    if (status?.certificates) {
      const scores: { [key: string]: string } = {};
      const feedbacks: { [key: string]: string } = {};
      status.certificates.forEach(cert => {
        if (cert.evaluation) {
          scores[cert._id] = cert.evaluation.score.toString();
          feedbacks[cert._id] = cert.evaluation.feedback || '';
        }
      });
      setCertScores(scores);
      setCertFeedbacks(feedbacks);
    }
  }, [status]);

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

  const handleEvaluateCertificate = async (certificateId: string) => {
    const scoreValue = certScores[certificateId];
    const feedbackValue = certFeedbacks[certificateId] || '';

    if (!scoreValue) {
      setMessage({ type: 'error', text: 'Please enter a score for this certificate' });
      return;
    }

    const scoreNum = parseFloat(scoreValue);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      setMessage({ type: 'error', text: 'Score must be between 0 and 10' });
      return;
    }

    setSubmittingScore(true);
    setMessage(null);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/pointer6/certificate/${certificateId}/evaluate`,
        {
          counselorId,
          score: scoreNum,
          feedback: feedbackValue,
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Certificate evaluated successfully' });
        setEvaluatingCertId(null);
        window.location.reload();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to evaluate certificate';
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
            {status?.courseList && !isReplacingCourseList ? (
              <div className="space-y-4">
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black tracking-widest text-blue-600 uppercase">Current Course List</p>
                    <p className="font-bold text-blue-900">{status.courseList.fileName}</p>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => downloadFile(status.courseList!.fileUrl)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Download Excel
                      </button>
                      <button
                        onClick={() => setViewingCourseList(!viewingCourseList)}
                        className={`text-sm font-bold ${
                          viewingCourseList 
                            ? 'text-purple-700 hover:text-purple-900' 
                            : 'text-green-600 hover:text-green-800'
                        } underline`}
                      >
                        {viewingCourseList ? 'Hide Excel Preview' : 'View Excel'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsReplacingCourseList(true)}
                    className="px-4 py-2 bg-white border border-blue-200 text-blue-700 font-bold text-xs rounded-xl shadow-sm hover:bg-blue-100 transition-all uppercase tracking-wider"
                  >
                    Re-upload
                  </button>
                </div>
                {viewingCourseList && (
                  <ExcelViewer url={status.courseList.fileUrl} onClose={() => setViewingCourseList(false)} />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {isReplacingCourseList && (
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Replacing existing course list</p>
                    <button
                      onClick={() => setIsReplacingCourseList(false)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => {
                    handleCourseListUpload(e);
                    setIsReplacingCourseList(false);
                  }}
                  disabled={uploadingCourseList}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
                />
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Allowed: .xlsx, .xls</p>
              </div>
            )}
          </div>

          {/* Certificates */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificates - Individual Evaluation</h2>
            {status?.certificates && status.certificates.length > 0 ? (
              <ul className="space-y-4">
                {status.certificates.map((cert) => (
                  <li key={cert._id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{cert.fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded: {new Date(cert.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFile(cert.fileUrl)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => setViewingFileUrl(viewingFileUrl === cert.fileUrl ? null : cert.fileUrl)}
                          className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                            viewingFileUrl === cert.fileUrl 
                              ? 'bg-indigo-600 text-white shadow-lg' 
                              : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          {viewingFileUrl === cert.fileUrl ? 'Hide' : 'View'}
                        </button>
                      </div>
                    </div>

                    {viewingFileUrl === cert.fileUrl && (
                      <InlineDocViewer url={cert.fileUrl} onClose={() => setViewingFileUrl(null)} />
                    )}

                    {/* Certificate Evaluation Section */}
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      {cert.evaluation && evaluatingCertId !== cert._id ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-green-900">
                              Score: <span className="text-lg">{cert.evaluation.score}/10</span>
                            </p>
                            <button
                              onClick={() => setEvaluatingCertId(cert._id)}
                              className="text-xs px-3 py-1 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-50"
                            >
                              Update Score
                            </button>
                          </div>
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
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Score (0–10)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.1}
                              value={certScores[cert._id] || ''}
                              onChange={(e) => setCertScores({ ...certScores, [cert._id]: e.target.value })}
                              disabled={submittingScore}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter score"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Feedback (optional)
                            </label>
                            <textarea
                              rows={2}
                              value={certFeedbacks[cert._id] || ''}
                              onChange={(e) => setCertFeedbacks({ ...certFeedbacks, [cert._id]: e.target.value })}
                              disabled={submittingScore}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Provide feedback..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEvaluateCertificate(cert._id)}
                              disabled={submittingScore || !certScores[cert._id]}
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {submittingScore ? 'Saving...' : cert.evaluation ? 'Update Evaluation' : 'Save Evaluation'}
                            </button>
                            {evaluatingCertId === cert._id && cert.evaluation && (
                              <button
                                onClick={() => setEvaluatingCertId(null)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No certificates uploaded yet.</p>
            )}
          </div>

          {/* Overall Score Summary */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Pointer 6 Score</h2>

            {status?.evaluation ? (
              <div className="p-4 bg-white border border-blue-200 rounded-md">
                <p className="text-xs font-medium text-blue-900 mb-2">Average Score (Auto-calculated)</p>
                <p className="text-3xl font-bold text-blue-800 mb-2">
                  {status.evaluation.score.toFixed(2)}/10
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Based on {status.certificates.filter(c => c.evaluation).length} evaluated certificate(s)
                </p>
                {status.evaluation.feedback && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-200 pt-3 mt-3">
                    <span className="font-medium">Note:</span> {status.evaluation.feedback}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Last updated: {new Date(status.evaluation.evaluatedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ℹ️ Overall score will be automatically calculated when you evaluate individual certificates above.
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


