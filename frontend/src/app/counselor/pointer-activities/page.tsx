'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

interface AgentSuggestion {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  pointerNo: number;
}

interface ActivityRecord {
  selectionId: string;
  pointerNo: number;
  isVisibleToStudent: boolean;
  suggestion: AgentSuggestion;
  submission: {
    _id: string;
    files: string[];
    remarks?: string;
    submittedAt: string;
  } | null;
  evaluation: {
    _id: string;
    score: number;
    feedback?: string;
    evaluatedAt: string;
  } | null;
}

interface ActivitiesResponse {
  studentIvyServiceId: string;
  studentId: string;
  counselorId: string;
  activities: ActivityRecord[];
}

const pointerLabel = (pointerNo: number) => {
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

function CounselorPointerActivitiesContent() {
  const searchParams = useSearchParams();
  const studentIvyServiceIdFromUrl = searchParams.get('studentIvyServiceId') || '';
  const counselorIdFromUrl = searchParams.get('counselorId') || '695b93a44df1114a001dc23d'; // TODO: plug into auth

  const [studentIvyServiceId, setStudentIvyServiceId] = useState(studentIvyServiceIdFromUrl);
  const [counselorId, setCounselorId] = useState(counselorIdFromUrl);
  const [careerRole, setCareerRole] = useState('');
  const [selectedPointer, setSelectedPointer] = useState<number | ''>(2);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [activitiesData, setActivitiesData] = useState<ActivitiesResponse | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [submittingEval, setSubmittingEval] = useState<string | null>(null);
  const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiBase = useMemo(() => 'http://localhost:5000', []);

  const fetchActivities = async () => {
    if (!studentIvyServiceId) return;
    setLoadingActivities(true);
    setMessage(null);
    try {
      const res = await axios.get<{ success: boolean; data: ActivitiesResponse }>(
        `${apiBase}/api/pointer/activity/student`,
        {
          params: {
            studentIvyServiceId,
            includeInvisible: true,
          },
        },
      );
      if (res.data.success) {
        setActivitiesData(res.data.data);
        const draftScores: Record<string, string> = {};
        const draftFeedback: Record<string, string> = {};
        res.data.data.activities.forEach((act) => {
          if (act.evaluation) {
            draftScores[act.selectionId] = act.evaluation.score.toString();
            draftFeedback[act.selectionId] = act.evaluation.feedback || '';
          }
        });
        setScoreDrafts(draftScores);
        setFeedbackDrafts(draftFeedback);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load activities';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (studentIvyServiceIdFromUrl) {
      setStudentIvyServiceId(studentIvyServiceIdFromUrl);
    }
    if (counselorIdFromUrl) {
      setCounselorId(counselorIdFromUrl);
    }
  }, [studentIvyServiceIdFromUrl, counselorIdFromUrl]);

  useEffect(() => {
    if (studentIvyServiceId) {
      fetchActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIvyServiceId]);

  const handleFetchSuggestions = async () => {
    if (!careerRole.trim()) {
      setMessage({ type: 'error', text: 'Please enter career role' });
      return;
    }
    if (!selectedPointer) {
      setMessage({ type: 'error', text: 'Select a pointer' });
      return;
    }

    setLoadingSuggestions(true);
    setMessage(null);
    setSelectedActivities(new Set());

    try {
      const res = await axios.get<AgentSuggestion[]>(`${apiBase}/api/agent-suggestions`, {
        params: { careerRole: careerRole.trim(), pointerNo: selectedPointer },
      });
      setSuggestions(res.data);
      if (res.data.length === 0) {
        setMessage({
          type: 'error',
          text: 'No activities found. Ensure Excel is uploaded for this pointer.',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch suggestions';
      setMessage({ type: 'error', text: errorMessage });
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleActivity = (id: string) => {
    const updated = new Set(selectedActivities);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedActivities(updated);
  };

  const handleSaveSelection = async () => {
    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }
    if (!selectedPointer) {
      setMessage({ type: 'error', text: 'Select a pointer' });
      return;
    }
    if (selectedActivities.size === 0) {
      setMessage({ type: 'error', text: 'Select at least one activity' });
      return;
    }
    setSavingSelection(true);
    setMessage(null);
    try {
      const res = await axios.post(`${apiBase}/api/pointer/activity/select`, {
        studentIvyServiceId,
        counselorId,
        pointerNo: selectedPointer,
        agentSuggestionIds: Array.from(selectedActivities),
        isVisibleToStudent: true,
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Activities saved for the student' });
        await fetchActivities();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save activities';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSavingSelection(false);
    }
  };

  const handleEvaluate = async (selectionId: string, submissionId?: string | null) => {
    if (!submissionId) {
      setMessage({ type: 'error', text: 'Submission not found for this activity' });
      return;
    }
    const scoreVal = parseFloat(scoreDrafts[selectionId] || '');
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 10) {
      setMessage({ type: 'error', text: 'Score must be between 0 and 10' });
      return;
    }
    setSubmittingEval(selectionId);
    setMessage(null);
    try {
      const res = await axios.post(`${apiBase}/api/pointer/activity/evaluate`, {
        studentSubmissionId: submissionId,
        counselorId,
        score: scoreVal,
        feedback: feedbackDrafts[selectionId] || '',
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Evaluation saved' });
        await fetchActivities();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save evaluation';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmittingEval(null);
    }
  };

  const downloadFile = async (url: string) => {
    try {
      const response = await fetch(`${apiBase}${url}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = url.split('/').pop() || 'proof';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(`${apiBase}${url}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Pointers 2 / 3 / 4 - Activity Execution</h1>

        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student Ivy Service ID</label>
            <input
              value={studentIvyServiceId}
              onChange={(e) => setStudentIvyServiceId(e.target.value)}
              placeholder="studentIvyServiceId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Counselor ID</label>
            <input
              value={counselorId}
              onChange={(e) => setCounselorId(e.target.value)}
              placeholder="counselorId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Suggestion fetch */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Select Agent Activities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Career Role</label>
              <textarea
                value={careerRole}
                onChange={(e) => setCareerRole(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the student's career role (e.g., Doctor, Engineer, Finance, Lawyer)..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pointer</label>
              <select
                value={selectedPointer}
                onChange={(e) => setSelectedPointer(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Select pointer --</option>
                <option value="2">Pointer 2: Spike in One Area</option>
                <option value="3">Pointer 3: Leadership & Initiative</option>
                <option value="4">Pointer 4: Global & Social Impact</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFetchSuggestions}
                disabled={loadingSuggestions || !careerRole.trim() || !selectedPointer}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loadingSuggestions ? 'Fetching...' : 'Get Suggestions'}
              </button>
            </div>
          </div>

          {!loadingSuggestions && suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {suggestions.length} activities found • {selectedActivities.size} selected
                </p>
                <button
                  onClick={handleSaveSelection}
                  disabled={savingSelection || selectedActivities.size === 0 || !studentIvyServiceId}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {savingSelection ? 'Saving...' : 'Assign to Student'}
                </button>
              </div>
              <div className="space-y-3">
                {suggestions.map((sug) => (
                  <div
                    key={sug._id}
                    className={`border rounded-lg p-4 transition ${selectedActivities.has(sug._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedActivities.has(sug._id)}
                        onChange={() => toggleActivity(sug._id)}
                      />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{sug.title}</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{sug.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sug.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assigned activities */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Activities</h2>
            <button
              onClick={fetchActivities}
              disabled={loadingActivities || !studentIvyServiceId}
              className="text-sm bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {loadingActivities ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {!studentIvyServiceId && (
            <p className="text-sm text-red-600">Enter studentIvyServiceId to view assignments.</p>
          )}

          {loadingActivities && <p className="text-sm text-gray-500">Loading assignments...</p>}

          {!loadingActivities && activitiesData && activitiesData.activities.length === 0 && (
            <p className="text-sm text-gray-500">No activities assigned yet.</p>
          )}

          {!loadingActivities &&
            activitiesData &&
            activitiesData.activities.length > 0 &&
            activitiesData.activities.map((act) => (
              <div key={act.selectionId} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase text-gray-500">{pointerLabel(act.pointerNo)}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{act.suggestion?.title}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">
                      {act.suggestion?.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {act.suggestion?.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Visible to student: {act.isVisibleToStudent ? 'Yes' : 'No'}
                    </p>
                  </div>
                  {act.submission ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                      Proof submitted
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded">
                      Awaiting proof
                    </span>
                  )}
                </div>

                {/* Submission */}
                {act.submission && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
                    <p className="text-sm font-medium text-blue-900">Student Submission</p>
                    {act.submission.remarks && (
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{act.submission.remarks}</p>
                    )}
                    <ul className="text-sm text-blue-800 space-y-1">
                      {act.submission.files.map((file, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => downloadFile(file)}
                            className="underline hover:text-blue-900"
                          >
                            Proof {idx + 1}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-blue-700">
                      Submitted at: {new Date(act.submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Evaluation */}
                {act.evaluation && updatingActivityId !== act.selectionId ? (
                  <div className="border border-gray-200 rounded-md p-3 bg-green-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-green-900">Current Evaluation</p>
                      <button
                        onClick={() => setUpdatingActivityId(act.selectionId)}
                        className="px-4 py-2 bg-white border border-green-200 text-green-700 font-bold text-xs rounded-xl shadow-sm hover:bg-green-100 transition-all uppercase tracking-wider"
                      >
                        Update Score
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-green-900">
                        Score: {act.evaluation.score}/10
                      </p>
                      {act.evaluation.feedback && (
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Feedback:</span> {act.evaluation.feedback}
                        </p>
                      )}
                      <p className="text-xs text-green-700">
                        Last updated: {new Date(act.evaluation.evaluatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{act.evaluation ? 'Update Evaluation' : 'Evaluate Activity'}</p>
                      {act.evaluation && updatingActivityId === act.selectionId && (
                        <button
                          onClick={() => setUpdatingActivityId(null)}
                          className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Score (0-10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={scoreDrafts[act.selectionId] ?? ''}
                          onChange={(e) =>
                            setScoreDrafts((prev) => ({ ...prev, [act.selectionId]: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          disabled={submittingEval === act.selectionId}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Feedback</label>
                        <textarea
                          rows={3}
                          value={feedbackDrafts[act.selectionId] ?? ''}
                          onChange={(e) =>
                            setFeedbackDrafts((prev) => ({ ...prev, [act.selectionId]: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-gray-900"
                          disabled={submittingEval === act.selectionId}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleEvaluate(act.selectionId, act.submission?._id)}
                      disabled={submittingEval === act.selectionId || !act.submission}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {submittingEval === act.selectionId ? 'Saving...' : (act.evaluation ? 'Update Evaluation' : 'Save Evaluation')}
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>

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
  );
}

export default function CounselorPointerActivitiesPage() {
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
      <CounselorPointerActivitiesContent />
    </Suspense>
  );
}


