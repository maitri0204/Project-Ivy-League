'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import mammoth from 'mammoth';

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
  const [isReplacingGuideline, setIsReplacingGuideline] = useState<boolean>(false);
  const [viewingEssayUrl, setViewingEssayUrl] = useState<string | null>(null);
  const [isUpdatingEvaluation, setIsUpdatingEvaluation] = useState<boolean>(false);

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
        setMessage({ type: 'success', text: status?.evaluation ? 'Evaluation updated successfully!' : 'Essay evaluated successfully!' });
        setIsUpdatingEvaluation(false);
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
              {status?.guideline && !isReplacingGuideline ? (
                <div className="flex flex-col gap-4">
                  <div className="p-5 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-green-600 uppercase mb-1">Current Guideline</p>
                      <p className="font-bold text-green-900">{status.guideline.fileName}</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => downloadFile(status.guideline!.fileUrl, status.guideline!.fileName)}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline mt-1 block"
                        >
                          Download Guideline
                        </button>
                        <button
                          onClick={() => setViewingEssayUrl(viewingEssayUrl === status.guideline!.fileUrl ? null : status.guideline!.fileUrl)}
                          className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-lg transition-all ${viewingEssayUrl === status.guideline!.fileUrl ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                        >
                          {viewingEssayUrl === status.guideline!.fileUrl ? 'HIDE' : 'VIEW'}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsReplacingGuideline(true)}
                      className="px-4 py-2 bg-white border border-green-200 text-green-700 font-bold text-xs rounded-xl shadow-sm hover:bg-green-100 transition-all uppercase tracking-wider"
                    >
                      Re-upload
                    </button>
                  </div>
                  {viewingEssayUrl === status.guideline.fileUrl && (
                    <div className="mt-4">
                      <InlineDocViewer url={status.guideline.fileUrl} onClose={() => setViewingEssayUrl(null)} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {isReplacingGuideline && (
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Replacing existing guideline</p>
                      <button
                        onClick={() => setIsReplacingGuideline(false)}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    id="guidelineFile"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      handleGuidelineUpload(e);
                      setIsReplacingGuideline(false);
                    }}
                    disabled={uploadingGuideline}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
                  />
                  <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supported: .doc, .docx</p>
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => downloadFile(status.essay!.fileUrl, status.essay!.fileName)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Download Essay
                    </button>
                    <button
                      onClick={() => setViewingEssayUrl(viewingEssayUrl === status.essay!.fileUrl ? null : status.essay!.fileUrl)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${viewingEssayUrl === status.essay!.fileUrl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                    >
                      {viewingEssayUrl === status.essay!.fileUrl ? 'HIDE ESSAY' : 'VIEW ESSAY'}
                    </button>
                  </div>
                  {viewingEssayUrl === status.essay!.fileUrl && (
                    <InlineDocViewer url={status.essay!.fileUrl} onClose={() => setViewingEssayUrl(null)} />
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No essay submitted yet.</p>
            )}
          </div>

          {/* Evaluate Essay Section */}
          {status?.essay && (!status?.evaluation || isUpdatingEvaluation) && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{status.evaluation ? 'Update Evaluation' : 'Evaluate Essay'}</h2>
                {isUpdatingEvaluation && (
                  <button
                    onClick={() => {
                      setIsUpdatingEvaluation(false);
                      if (status.evaluation) {
                        setScore(status.evaluation.score.toString());
                        setFeedback(status.evaluation.feedback || '');
                      }
                    }}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
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
                  {uploadingEvaluation ? 'Submitting...' : (status?.evaluation ? 'Update Evaluation' : 'Submit Evaluation')}
                </button>
              </div>
            </div>
          )}

          {/* Current Evaluation Display */}
          {status?.evaluation && !isUpdatingEvaluation && (
            <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Current Evaluation</h2>
                <button
                  onClick={() => setIsUpdatingEvaluation(true)}
                  className="px-4 py-2 bg-white border border-green-200 text-green-700 font-bold text-xs rounded-xl shadow-sm hover:bg-green-100 transition-all uppercase tracking-wider"
                >
                  Update
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Score:</span> {status.evaluation.score}/10
                </p>
                {status.evaluation.feedback && (
                  <p className="text-sm text-gray-900">
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

