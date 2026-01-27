'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import mammoth from 'mammoth';

function InlineDocViewer({ url, onClose }: { url: string, onClose: () => void }) {
  const fullUrl = `http://localhost:5000${url}`;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isWord = /\.(doc|docx)$/i.test(url);
  const [wordContent, setWordContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isWord) {
      setIsLoading(true);
      setError('');
      axios.get(fullUrl, { responseType: 'arraybuffer' })
        .then(response => {
          return mammoth.convertToHtml({ arrayBuffer: response.data });
        })
        .then(result => {
          setWordContent(result.value);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error loading Word document:', err);
          setError('Failed to load document');
          setIsLoading(false);
        });
    }
  }, [fullUrl, isWord]);

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
        ) : isWord ? (
          <div className="w-full h-[600px] overflow-auto bg-white p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">{error}</div>
            ) : (
              <>
                <style jsx global>{`
                  .counselor-word-content p, .counselor-word-content h1, .counselor-word-content h2, .counselor-word-content h3, 
                  .counselor-word-content h4, .counselor-word-content h5, .counselor-word-content h6, .counselor-word-content li,
                  .counselor-word-content span, .counselor-word-content div, .counselor-word-content td, .counselor-word-content th {
                    color: #1f2937 !important;
                  }
                  .counselor-word-content h1, .counselor-word-content h2, .counselor-word-content h3 {
                    font-weight: 700 !important;
                    margin-bottom: 0.5rem !important;
                  }
                  .counselor-word-content p {
                    margin-bottom: 0.75rem !important;
                    line-height: 1.6 !important;
                  }
                `}</style>
                <div 
                  className="counselor-word-content text-gray-800"
                  dangerouslySetInnerHTML={{ __html: wordContent }}
                />
              </>
            )}
          </div>
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
  weightage?: number; // Weightage for Pointers 2, 3, 4
  counselorDocuments?: string[]; // Documents uploaded by counselor
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

  const [careerRole, setCareerRole] = useState<string>('');
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
  const [activityWeightages, setActivityWeightages] = useState<Record<string, number>>({});
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);
  const [selectingActivities, setSelectingActivities] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'evaluate'>('suggestions');
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingCounselorDocUrl, setViewingCounselorDocUrl] = useState<string | null>(null);

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
        
        // Load weightages from database
        const weightagesFromDb: Record<string, number> = {};
        activitiesData.forEach((act: StudentActivity) => {
          if (act.suggestion?._id && act.weightage !== undefined && act.weightage !== null) {
            weightagesFromDb[act.suggestion._id] = act.weightage;
          }
        });
        setActivityWeightages(prev => ({ ...prev, ...weightagesFromDb }));
      }
    } catch (error: any) {
      console.error('Error fetching student activities:', error);
      console.error('Error details:', {
        url: `http://localhost:5000/api/pointer/activity/student/${studentId}`,
        status: error.response?.status,
        message: error.message
      });
      // Don't show error to user if student simply has no activities yet
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
          setCareerRole(serviceResponse.data.data.studentInterest);
        }

        const studentId = searchParams.get('studentId');
        if (studentId) {
          try {
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
              const weightagesFromDb: Record<string, number> = {};
              activitiesData.forEach((act: StudentActivity) => {
                if (act.suggestion?._id) {
                  assignedIds.add(act.suggestion._id);
                  // Load weightage from database if available
                  if (act.weightage !== undefined && act.weightage !== null) {
                    weightagesFromDb[act.suggestion._id] = act.weightage;
                  }
                }
              });
              setSelectedActivities(assignedIds);
              setActivityWeightages(weightagesFromDb);
            }
          } catch (activityError: any) {
            console.error("Error fetching activities:", activityError);
            // Don't fail the whole init if activities fetch fails
            // Student might not have any activities yet
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
    if (!careerRole.trim()) {
      setMessage({ type: 'error', text: 'Please enter career role' });
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
        interest: careerRole.trim()
      });

      const response = await axios.get<AgentSuggestion[]>(
        `http://localhost:5000/api/agent-suggestions`,
        {
          params: {
            careerRole: careerRole.trim(),
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
    if (careerRole && selectedPointer && !loading) {
      handleFetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPointer, careerRole]);

  const handleToggleActivity = (activityId: string) => {
    const newSelected = new Set(selectedActivities);
    const updatedWeightages = { ...activityWeightages };
    
    if (newSelected.has(activityId)) {
      // Removing activity
      newSelected.delete(activityId);
      delete updatedWeightages[activityId];
    } else {
      // Adding activity
      newSelected.add(activityId);
      // Auto-assign weightage for Pointers 2, 3, 4
      if ([2, 3, 4].includes(selectedPointer as number)) {
        if (newSelected.size === 1) {
          updatedWeightages[activityId] = 100;
        } else {
          // Distribute evenly
          const equalWeight = Math.floor(100 / newSelected.size);
          const remainder = 100 - (equalWeight * newSelected.size);
          let index = 0;
          newSelected.forEach(actId => {
            updatedWeightages[actId] = index === 0 ? equalWeight + remainder : equalWeight;
            index++;
          });
        }
      }
    }
    
    setSelectedActivities(newSelected);
    setActivityWeightages(updatedWeightages);
  };

  const handleWeightageChange = async (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newWeightages = { ...activityWeightages, [id]: numValue };
    setActivityWeightages(newWeightages);
    
    // Auto-save weightages to database
    if ([2, 3, 4].includes(selectedPointer as number) && studentIvyServiceId) {
      try {
        // Prepare weightages object for all selected activities
        const weightagesPayload: Record<string, number> = {};
        selectedActivities.forEach(actId => {
          weightagesPayload[actId] = newWeightages[actId] || 0;
        });

        await axios.put('http://localhost:5000/api/pointer/activity/weightages', {
          studentIvyServiceId,
          counselorId,
          weightages: weightagesPayload,
        });
      } catch (error) {
        console.error('Error saving weightages:', error);
      }
    }
  };

  const getTotalWeightage = () => {
    // Only sum weightages for currently selected activities in current pointer suggestions
    const currentSuggestionIds = new Set(suggestions.map(s => s._id));
    return Array.from(selectedActivities)
      .filter(id => currentSuggestionIds.has(id))
      .reduce((sum, id) => sum + (activityWeightages[id] || 0), 0);
  };

  const isWeightageValid = () => {
    if (![2, 3, 4].includes(selectedPointer as number)) return true;
    if (currentPointerSelectionCount === 0) return true;
    if (currentPointerSelectionCount === 1) return true;
    
    const total = getTotalWeightage();
    return Math.abs(total - 100) < 0.01;
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

    // Validate weightages for Pointers 2, 3, 4
    if ([2, 3, 4].includes(selectedPointer as number) && idsToSubmit.length > 1) {
      if (!isWeightageValid()) {
        setMessage({ type: 'error', text: `Total weightage must equal 100. Current total: ${getTotalWeightage().toFixed(2)}` });
        return;
      }
    }

    setSelectingActivities(true);
    setMessage(null);

    try {
      const payload: any = {
        studentIvyServiceId,
        counselorId,
        agentSuggestionIds: idsToSubmit,
        pointerNo: selectedPointer,
      };

      // Add weightages for Pointers 2, 3, 4
      if ([2, 3, 4].includes(selectedPointer as number) && idsToSubmit.length > 0) {
        payload.weightages = idsToSubmit.map(id => activityWeightages[id] || 0);
      }

      const response = await axios.post('http://localhost:5000/api/pointer/activity/select', payload);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Activities selected successfully!' });
        // Don't reset weightages - keep them for reference
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

            {/* Career Role Input */}
            <div className="mb-6">
              <label
                htmlFor="careerRole"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Career Role for {getPointerLabel(selectedPointer as number)}
              </label>
              <div className="flex gap-2">
                <textarea
                  id="careerRole"
                  value={careerRole}
                  onChange={(e) => setCareerRole(e.target.value)}
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-y"
                  placeholder="Enter career role for this pointer (e.g., 'Doctor', 'Engineer', 'Finance')..."
                />
                <button
                  onClick={handleFetchSuggestions}
                  disabled={loading || !careerRole.trim()}
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
                    {/* Weightage Info Banner for Pointers 2, 3, 4 */}
                    {[2, 3, 4].includes(selectedPointer as number) && currentPointerSelectionCount > 0 && (
                      <div className={`p-4 rounded-lg border-2 ${
                        currentPointerSelectionCount === 1 
                          ? 'bg-green-50 border-green-300' 
                          : isWeightageValid() 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-red-50 border-red-300'
                      }`}>
                        <h4 className="font-bold text-sm mb-2 text-gray-900">
                          {currentPointerSelectionCount === 1 ? '✓ Single Activity Selected' : '⚠️ Multiple Activities - Weightage Required'}
                        </h4>
                        {currentPointerSelectionCount === 1 ? (
                          <p className="text-sm text-green-900 font-medium">
                            This activity will automatically receive 100% weightage.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              Total Weightage: <span className={`text-lg font-bold ${isWeightageValid() ? 'text-green-800' : 'text-red-800'}`}>
                                {getTotalWeightage().toFixed(1)}/100
                              </span>
                            </p>
                            <p className="text-sm text-gray-800 font-medium">
                              Assign weightage to each activity below. The total must equal exactly 100%.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {getPointerLabel(selectedPointer as number)} - Suitable Activities
                      </h2>
                      <span className="text-sm text-gray-500">
                        {suggestions.length} activit{suggestions.length !== 1 ? 'ies' : 'y'}
                        {currentPointerSelectionCount > 0 && ` • ${currentPointerSelectionCount} selected`}
                        {[2, 3, 4].includes(selectedPointer as number) && currentPointerSelectionCount > 1 && (
                          <span className={`ml-2 font-semibold ${isWeightageValid() ? 'text-green-600' : 'text-red-600'}`}>
                            • Total: {getTotalWeightage().toFixed(1)}/100
                          </span>
                        )}
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
                              
                              {/* Weightage input for Pointers 2, 3, 4 - Multiple Activities */}
                              {[2, 3, 4].includes(selectedPointer as number) && selectedActivities.has(suggestion._id) && currentPointerSelectionCount > 1 && (
                                <div className="mt-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-lg shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-orange-900">Weightage:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={activityWeightages[suggestion._id] || 0}
                                      onChange={(e) => handleWeightageChange(suggestion._id, e.target.value)}
                                      className="w-28 px-4 py-2.5 border-2 border-orange-500 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 text-base font-bold text-orange-900 bg-white"
                                    />
                                    <span className="text-base font-bold text-orange-900">%</span>
                                  </div>
                                  <p className="text-xs text-orange-800 mt-2 font-medium">
                                    Assign weightage for this activity (total must equal 100%)
                                  </p>
                                </div>
                              )}
                              
                              {/* Weightage for Pointers 2, 3, 4 - Single Activity */}
                              {[2, 3, 4].includes(selectedPointer as number) && selectedActivities.has(suggestion._id) && currentPointerSelectionCount === 1 && (
                                <div className="mt-3">
                                  <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-md border border-green-300">
                                    ✓ Weightage: 100% (Auto-assigned)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Select Button */}
                    {currentPointerSelectionCount > 0 && (
                      <button
                        onClick={handleSelectActivities}
                        disabled={selectingActivities || ([2, 3, 4].includes(selectedPointer as number) && currentPointerSelectionCount > 1 && !isWeightageValid())}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {selectingActivities ? 'Selecting...' : `Select ${currentPointerSelectionCount} Activity(ies)`}
                      </button>
                    )}
                  </div>
                ) : careerRole ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No suggestions found. Try a different career role or ensure database has activities for this pointer.
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
                          {[2, 3, 4].includes(activity.pointerNo) && activity.weightage !== undefined && (
                            <span className="ml-3 font-semibold text-blue-600">
                              • Weightage: {activity.weightage}%
                            </span>
                          )}
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap mb-4">
                          {activity.description}
                        </p>
                      </div>

                      {/* Counselor Documents Upload Section */}
                      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-purple-900">Documents for Student</p>
                          <input
                            type="file"
                            id={`doc-upload-${activity.selectionId}`}
                            multiple
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;

                              try {
                                const formData = new FormData();
                                Array.from(files).forEach(file => formData.append('counselorDocs', file));
                                formData.append('selectionId', activity.selectionId);
                                formData.append('counselorId', counselorId);

                                const response = await axios.post(
                                  'http://localhost:5000/api/pointer/activity/counselor/documents',
                                  formData,
                                  { headers: { 'Content-Type': 'multipart/form-data' } }
                                );

                                if (response.data.success) {
                                  setMessage({ type: 'success', text: 'Documents uploaded successfully!' });
                                  setTimeout(() => fetchStudentActivities(), 500);
                                }
                              } catch (error: any) {
                                setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload documents' });
                              }
                            }}
                          />
                          <button
                            onClick={() => document.getElementById(`doc-upload-${activity.selectionId}`)?.click()}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                          >
                            + Upload Document
                          </button>
                        </div>
                        {activity.counselorDocuments && activity.counselorDocuments.length > 0 ? (
                          <div className="space-y-2">
                            {activity.counselorDocuments.map((docUrl, idx) => (
                              <div key={idx} className="flex flex-col">
                                <div className="flex items-center justify-between p-2 bg-white rounded border border-purple-100">
                                  <span className="text-sm text-gray-700 truncate flex-1">Document {idx + 1}</span>
                                  <button
                                    onClick={() => setViewingCounselorDocUrl(viewingCounselorDocUrl === docUrl ? null : docUrl)}
                                    className={`text-sm font-medium px-3 py-1 rounded ${viewingCounselorDocUrl === docUrl ? 'bg-purple-600 text-white' : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'}`}
                                  >
                                    {viewingCounselorDocUrl === docUrl ? 'Hide' : 'View'}
                                  </button>
                                </div>
                                {viewingCounselorDocUrl === docUrl && (
                                  <InlineDocViewer url={docUrl} onClose={() => setViewingCounselorDocUrl(null)} />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-purple-700">No documents uploaded yet. Upload PDF or Word documents for students to view.</p>
                        )}
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
