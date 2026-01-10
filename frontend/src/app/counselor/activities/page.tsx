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

interface AgentSuggestion {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  pointerNo: number;
}

interface StudentActivity {
  selectionId: string;
  suggestion?: AgentSuggestion;
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
  const studentIvyServiceId = searchParams.get('studentIvyServiceId');
  const counselorId = searchParams.get('counselorId') || '695b93a44df1114a001dc23d';

  const [studentInterest, setStudentInterest] = useState<string>('');
  const [selectedPointer, setSelectedPointer] = useState<number | ''>(() => {
    const p = searchParams.get('pointerNo');
    return p ? parseInt(p) : 2;
  });

  useEffect(() => {
    const p = searchParams.get('pointerNo');
    if (p) {
      setSelectedPointer(parseInt(p));
    }
  }, [searchParams]);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);
  const [selectingActivities, setSelectingActivities] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'evaluate'>('suggestions');
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);

  const fetchStudentActivities = async () => {
    const studentId = searchParams.get('studentId');
    if (!studentId) return;

    setLoadingActivities(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/pointer/activity/student/${studentId}`
      );
      if (response.data.success) {
        const payload = response.data.data;
        const rawActivities = payload && Array.isArray(payload.activities) ? payload.activities : [];

        const activitiesData = rawActivities.map((act: any) => ({
          ...act,
          title: act.suggestion?.title || 'Untitled Activity',
          description: act.suggestion?.description || '',
          tags: act.suggestion?.tags || []
        }));

        setStudentActivities(activitiesData);
      }
    } catch (error: any) {
      console.error('Error fetching student activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (!studentIvyServiceId) return;
    if (activeTab === 'evaluate') {
      fetchStudentActivities();
    }
  }, [studentIvyServiceId, searchParams, activeTab]);

  useEffect(() => {
    if (!studentIvyServiceId) return;

    const initData = async () => {
      setLoadingActivities(true);
      try {
        const serviceResponse = await axios.get(`http://localhost:5000/api/ivy-service/${studentIvyServiceId}`);
        if (serviceResponse.data.success && serviceResponse.data.data.studentInterest) {
          setStudentInterest(serviceResponse.data.data.studentInterest);
        }

        const studentId = searchParams.get('studentId');
        if (studentId) {
          const activitiesResponse = await axios.get(`http://localhost:5000/api/pointer/activity/student/${studentId}`);
          if (activitiesResponse.data.success) {
            const payload = activitiesResponse.data.data;
            const rawActivities = payload && Array.isArray(payload.activities) ? payload.activities : [];

            const activitiesData = rawActivities.map((act: any) => ({
              ...act,
              title: act.suggestion?.title || 'Untitled Activity',
              description: act.suggestion?.description || '',
              tags: act.suggestion?.tags || []
            }));

            setStudentActivities(activitiesData);

            const assignedIds = new Set<string>();
            activitiesData.forEach((act: StudentActivity) => {
              if (act.suggestion?._id) assignedIds.add(act.suggestion._id);
            });
            setSelectedActivities(assignedIds);
          }
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    initData();
  }, [studentIvyServiceId, searchParams]);

  const handleFetchSuggestions = async () => {
    if (!studentInterest.trim()) {
      setMessage({ type: 'error', text: 'Please enter student interest' });
      return;
    }

    if (!selectedPointer) {
      setMessage({ type: 'error', text: 'Please select a pointer' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await axios.put(`http://localhost:5000/api/ivy-service/${studentIvyServiceId}/interest`, {
        interest: studentInterest.trim()
      });

      const response = await axios.get<AgentSuggestion[]>(
        `http://localhost:5000/api/agent-suggestions`,
        {
          params: {
            studentInterest: studentInterest.trim(),
            pointerNo: selectedPointer,
          },
        }
      );

      setSuggestions(response.data);
      if (response.data.length === 0) {
        setMessage({
          type: 'error',
          text: 'No suitable activities found. Please ensure Excel files have been uploaded for this pointer.',
        });
      }
    } catch (error: any) {
      console.error('Error fetching agent suggestions:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to load agent suggestions';
      setMessage({ type: 'error', text: errorMessage });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch suggestions logic
  useEffect(() => {
    if (studentInterest && selectedPointer && !loading) {
      handleFetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPointer, studentInterest]);

  const handleToggleActivity = (activityId: string) => {
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      newSelected.add(activityId);
    }
    setSelectedActivities(newSelected);
  };

  const handleSelectActivities = async () => {
    // Filter selected activities to only include those in the current suggestions (current pointer)
    const currentPointerSuggestionIds = new Set(suggestions.map(s => s._id));
    const idsToSubmit = Array.from(selectedActivities).filter(id => currentPointerSuggestionIds.has(id));

    if (idsToSubmit.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one activity for this pointer' });
      return;
    }

    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    if (!selectedPointer) {
      setMessage({ type: 'error', text: 'Pointer must be selected' });
      return;
    }

    setSelectingActivities(true);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/api/pointer/activity/select', {
        studentIvyServiceId,
        counselorId,
        agentSuggestionIds: idsToSubmit,
        pointerNo: selectedPointer,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Activities selected successfully!' });
        setTimeout(() => {
          fetchStudentActivities();
        }, 500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to select activities';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSelectingActivities(false);
    }
  };

  const handleEvaluate = async (submissionId: string, score: string, feedback: string) => {
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      setMessage({ type: 'error', text: 'Score must be between 0 and 10' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/pointer/activity/evaluate', {
        studentSubmissionId: submissionId,
        counselorId,
        score: scoreNum,
        feedback,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Activity evaluated successfully!' });
        setTimeout(() => {
          fetchStudentActivities();
        }, 500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to evaluate activity';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

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

  if (!studentIvyServiceId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-md">
            Student Ivy Service ID is required. Please provide studentIvyServiceId as a query parameter.
          </div>
        </div>
      </div>
    );
  }

  // Calculate distinct selection count for the current pointer
  const currentPointerSelectionCount = suggestions.filter(s => selectedActivities.has(s._id)).length;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Management</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 font-medium ${activeTab === 'suggestions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Select Activities
          </button>
          <button
            onClick={() => setActiveTab('evaluate')}
            className={`px-4 py-2 font-medium ${activeTab === 'evaluate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Evaluate Proofs
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            {message.text}
          </div>
        )}

        {/* Select Activities Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="mb-8 pb-6 border-b border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                <span className={`w-3 h-10 rounded-full ${selectedPointer === 2 ? 'bg-blue-500' : selectedPointer === 3 ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                {getPointerLabel(selectedPointer as number)}
              </h2>
            </div>

            {/* Student Interest Input */}
            <div className="mb-6">
              <label
                htmlFor="studentInterest"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Student Interest for {getPointerLabel(selectedPointer as number)}
              </label>
              <div className="flex gap-2">
                <textarea
                  id="studentInterest"
                  value={studentInterest}
                  onChange={(e) => setStudentInterest(e.target.value)}
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-y"
                  placeholder="Enter specific interest for this pointer (e.g., 'Robotics', 'Debate')..."
                />
                <button
                  onClick={handleFetchSuggestions}
                  disabled={loading || !studentInterest.trim()}
                  className="self-start px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-[86px]"
                >
                  {loading ? '...' : 'Save & Get Suggestions'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * Updating the interest here will save it for this student. Use "Get Suggestions" to refresh the list below.
              </p>
            </div>

            {/* Suggestions Render Logic */}
            {selectedPointer && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading suggestions...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {getPointerLabel(selectedPointer as number)} - Suitable Activities
                      </h2>
                      <span className="text-sm text-gray-500">
                        {suggestions.length} activit{suggestions.length !== 1 ? 'ies' : 'y'}
                        {currentPointerSelectionCount > 0 && ` • ${currentPointerSelectionCount} selected`}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion._id}
                          className={`border rounded-lg p-4 transition-all ${selectedActivities.has(suggestion._id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={`activity-${suggestion._id}`}
                              checked={selectedActivities.has(suggestion._id)}
                              onChange={() => handleToggleActivity(suggestion._id)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`activity-${suggestion._id}`}
                                className="cursor-pointer"
                              >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {suggestion.title}
                                </h3>
                                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                                  {suggestion.description}
                                </p>
                                {suggestion.tags && suggestion.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {suggestion.tags.map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Select Button */}
                    {currentPointerSelectionCount > 0 && (
                      <button
                        onClick={handleSelectActivities}
                        disabled={selectingActivities}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {selectingActivities ? 'Selecting...' : `Select ${currentPointerSelectionCount} Activity(ies)`}
                      </button>
                    )}
                  </div>
                ) : studentInterest ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No suggestions found. Try a different interest keyword or ensure database has activities for this pointer.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Evaluate Proofs Tab */}
        {activeTab === 'evaluate' && (
          <div className="space-y-6">
            <div className="mb-8 pb-6 border-b border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                <span className={`w-3 h-10 rounded-full ${selectedPointer === 2 ? 'bg-blue-500' : selectedPointer === 3 ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
                {getPointerLabel(selectedPointer as number)} - EVALUATION
              </h2>
            </div>

            <div className="flex justify-end">
              <button
                onClick={fetchStudentActivities}
                disabled={loadingActivities}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingActivities ? 'Refreshing...' : 'Refresh Activities'}
              </button>
            </div>

            {loadingActivities ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading activities...</div>
              </div>
            ) : studentActivities.filter(a => a.pointerNo === selectedPointer).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activities assigned for {getPointerLabel(selectedPointer as number)} yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {studentActivities
                  .filter(activity => activity.pointerNo === selectedPointer)
                  .map((activity) => (
                    <div
                      key={activity.selectionId}
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

                      {activity.proofUploaded ? (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm font-medium text-blue-900 mb-2">Proof Submitted</p>
                          <p className="text-xs text-blue-700 mb-3">
                            Submitted: {new Date(activity.submission!.submittedAt).toLocaleString()}
                          </p>
                          <div className="space-y-4">
                            {activity.submission!.files.map((fileUrl, index) => (
                              <div key={index} className="flex flex-col gap-2">
                                <button
                                  onClick={() => setViewingFileUrl(viewingFileUrl === fileUrl ? null : fileUrl)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all w-fit ${viewingFileUrl === fileUrl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'}`}
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {viewingFileUrl === fileUrl ? 'Hide Proof' : `View Proof ${index + 1}`}
                                </button>
                                {viewingFileUrl === fileUrl && (
                                  <InlineDocViewer url={fileUrl} onClose={() => setViewingFileUrl(null)} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">Waiting for student to upload proof...</p>
                        </div>
                      )}

                      {activity.evaluated ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm font-medium text-green-900 mb-1">
                            Score: {activity.evaluation!.score}/10
                          </p>
                          {activity.evaluation!.feedback && (
                            <p className="text-sm text-green-800 whitespace-pre-wrap">
                              {activity.evaluation!.feedback}
                            </p>
                          )}
                          <p className="text-xs text-green-700 mt-2">
                            Evaluated: {new Date(activity.evaluation!.evaluatedAt).toLocaleString()}
                          </p>
                        </div>
                      ) : activity.proofUploaded ? (
                        <ActivityEvaluationForm
                          submissionId={activity.submission!._id}
                          onEvaluate={handleEvaluate}
                        />
                      ) : null}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityEvaluationForm({
  submissionId,
  onEvaluate,
}: {
  submissionId: string;
  onEvaluate: (submissionId: string, score: string, feedback: string) => void;
}) {
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Evaluate Activity</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-10)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (Optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>
        <button
          onClick={() => onEvaluate(submissionId, score, feedback)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit Evaluation
        </button>
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
