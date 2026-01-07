'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

interface AgentSuggestion {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  pointerNo: number;
}

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
  const studentIvyServiceId = searchParams.get('studentIvyServiceId');
  const counselorId = searchParams.get('counselorId') || '1'; // TODO: Get from auth

  const [studentInterest, setStudentInterest] = useState<string>('');
  const [selectedPointer, setSelectedPointer] = useState<number | ''>(2);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);
  const [selectingActivities, setSelectingActivities] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'evaluate'>('suggestions');

  // Function to fetch student activities
  const fetchStudentActivities = async () => {
    const studentId = searchParams.get('studentId');
    if (!studentId) return;

    setLoadingActivities(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/pointer/activity/student/${studentId}`
      );
      if (response.data.success) {
        setStudentActivities(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching student activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch student activities on mount and when tab changes to evaluate
  useEffect(() => {
    if (!studentIvyServiceId) return;
    if (activeTab === 'evaluate') {
      fetchStudentActivities();
    }
  }, [studentIvyServiceId, searchParams, activeTab]);

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
    setSelectedActivities(new Set());

    try {
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
    if (selectedActivities.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one activity' });
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
        agentSuggestionIds: Array.from(selectedActivities),
        pointerNo: selectedPointer,
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Activities selected successfully!' });
        setSelectedActivities(new Set());
        // Refresh student activities after a short delay
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
        // Refresh student activities after a short delay
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Management</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'suggestions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Select Activities
          </button>
          <button
            onClick={() => setActiveTab('evaluate')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'evaluate'
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
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
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
            {/* Student Interest Input */}
            <div>
              <label
                htmlFor="studentInterest"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Student Interest
              </label>
              <textarea
                id="studentInterest"
                value={studentInterest}
                onChange={(e) => setStudentInterest(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-y"
                placeholder="Enter student's primary interest here..."
              />
            </div>

            {/* Pointer Selection */}
            <div>
              <label
                htmlFor="pointer"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Pointer
              </label>
              <select
                id="pointer"
                value={selectedPointer}
                onChange={(e) => setSelectedPointer(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">-- Select Pointer --</option>
                <option value="2">Pointer 2: Spike in One Area</option>
                <option value="3">Pointer 3: Leadership & Initiative</option>
                <option value="4">Pointer 4: Global & Social Impact</option>
              </select>
            </div>

            {/* Fetch Button */}
            <div>
              <button
                type="button"
                onClick={handleFetchSuggestions}
                disabled={loading || !studentInterest.trim() || !selectedPointer}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Fetching Suggestions...' : 'Get Suggestions'}
              </button>
            </div>

            {/* Suggestions List */}
            {!loading && suggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getPointerLabel(selectedPointer as number)} - Suitable Activities
                  </h2>
                  <span className="text-sm text-gray-500">
                    {suggestions.length} activit{suggestions.length !== 1 ? 'ies' : 'y'}
                    {selectedActivities.size > 0 && ` • ${selectedActivities.size} selected`}
                  </span>
                </div>

                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion._id}
                      className={`border rounded-lg p-4 transition-all ${
                        selectedActivities.has(suggestion._id)
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
                {selectedActivities.size > 0 && (
                  <button
                    onClick={handleSelectActivities}
                    disabled={selectingActivities}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {selectingActivities ? 'Selecting...' : `Select ${selectedActivities.size} Activity(ies)`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Evaluate Proofs Tab */}
        {activeTab === 'evaluate' && (
          <div className="space-y-6">
            {/* Refresh Button */}
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
            ) : studentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activities assigned yet. Select activities from the "Select Activities" tab.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {studentActivities.map((activity) => (
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

                    {/* Proof Status */}
                    {activity.proofUploaded ? (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-900 mb-2">Proof Submitted</p>
                        <p className="text-xs text-blue-700 mb-3">
                          Submitted: {new Date(activity.submission!.submittedAt).toLocaleString()}
                        </p>
                        <div className="space-y-2">
                          {activity.submission!.files.map((fileUrl, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <a
                                href={`http://localhost:5000${fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                              >
                                View Proof {index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">Waiting for student to upload proof...</p>
                      </div>
                    )}

                    {/* Evaluation */}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (Optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

