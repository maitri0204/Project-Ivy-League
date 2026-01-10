'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

interface StudentActivity {
  selectionId: string;
  suggestion?: { _id: string; title: string; description: string; tags: string[] };
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
  const studentId = searchParams.get('studentId');
  const studentIvyServiceId = searchParams.get('studentIvyServiceId');

  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activePointer, setActivePointer] = useState<number>(() => {
    const p = searchParams.get('pointerNo');
    return p ? parseInt(p) : 2;
  });

  useEffect(() => {
    if (!studentId) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/pointer/activity/student/${studentId}`
        );
        if (response.data.success) {
          // API returns { data: { activities: [...] } }
          const payload = response.data.data;
          const rawActivities = payload && Array.isArray(payload.activities) ? payload.activities : [];

          const activitiesData = rawActivities.map((act: any) => ({
            ...act,
            title: act.suggestion?.title || 'Untitled Activity',
            description: act.suggestion?.description || '',
            tags: act.suggestion?.tags || []
          }));

          setActivities(activitiesData);
        }
      } catch (error: any) {
        console.error('Error fetching activities:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load activities';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [studentId]);

  const handleProofUpload = async (
    selectedActivityId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!studentIvyServiceId) {
      setMessage({ type: 'error', text: 'Student Ivy Service ID is required' });
      return;
    }

    if (!studentId) {
      setMessage({ type: 'error', text: 'Student ID is required' });
      return;
    }

    setUploadingProof(selectedActivityId);
    setMessage(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('proofFiles', file);
      });
      formData.append('studentIvyServiceId', studentIvyServiceId);
      formData.append('counselorSelectedSuggestionId', selectedActivityId);
      formData.append('studentId', studentId);

      const response = await axios.post(
        'http://localhost:5000/api/pointer/activity/proof/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Proof uploaded successfully!' });
        // Refetch activities after a short delay to ensure backend has saved
        setTimeout(async () => {
          try {
            const refreshResponse = await axios.get(
              `http://localhost:5000/api/pointer/activity/student/${studentId}`
            );
            if (refreshResponse.data.success) {
              const payload = refreshResponse.data.data;
              const rawActivities = payload && Array.isArray(payload.activities) ? payload.activities : [];
              const activitiesData = rawActivities.map((act: any) => ({
                ...act,
                title: act.suggestion?.title || 'Untitled Activity',
                description: act.suggestion?.description || '',
                tags: act.suggestion?.tags || []
              }));
              setActivities(activitiesData);
            }
          } catch (error) {
            console.error('Error refreshing activities:', error);
            window.location.reload();
          }
        }, 500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload proof';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingProof(null);
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

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-md">
            Student ID is required. Please provide studentId as a query parameter.
          </div>
        </div>
      </div>
    );
  }

  const filteredActivities = activities.filter(a => a.pointerNo === activePointer);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-10 pb-6 border-b border-gray-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">My Activities</h1>
            <p className="text-gray-500 font-medium mt-1">Proof submission and tracking.</p>
          </div>
          <div className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-3 ${activePointer === 2 ? 'border-blue-100 bg-blue-50 text-blue-700' : activePointer === 3 ? 'border-indigo-100 bg-indigo-50 text-indigo-700' : 'border-purple-100 bg-purple-50 text-purple-700'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${activePointer === 2 ? 'bg-blue-500' : activePointer === 3 ? 'bg-indigo-500' : 'bg-purple-500'}`}></span>
            <span className="font-bold uppercase tracking-wider">{getPointerLabel(activePointer)}</span>
          </div>
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

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading activities...</div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p>No activities assigned for {getPointerLabel(activePointer)} yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredActivities.map((activity) => (
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
                  {activity.tags && activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {activity.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Proof Upload Section */}
                {activity.proofUploaded ? (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-900 mb-2">Proof Uploaded</p>
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
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                        input.onchange = (e) => {
                          handleProofUpload(activity.selectionId, e as any);
                        };
                        input.click();
                      }}
                      disabled={uploadingProof === activity.selectionId}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                    >
                      {uploadingProof === activity.selectionId
                        ? 'Uploading...'
                        : 'Replace Proof'}
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Proof (PDF, Images, Word Documents)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleProofUpload(activity.selectionId, e)}
                      disabled={uploadingProof === activity.selectionId}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {uploadingProof === activity.selectionId && (
                      <p className="text-xs text-gray-500 mt-2">Uploading...</p>
                    )}
                  </div>
                )}

                {/* Evaluation Score */}
                {activity.evaluated && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Score: {activity.evaluation!.score}/10
                    </p>
                    {activity.evaluation!.feedback && (
                      <p className="text-sm text-green-800 whitespace-pre-wrap mt-2">
                        {activity.evaluation!.feedback}
                      </p>
                    )}
                    <p className="text-xs text-green-700 mt-2">
                      Evaluated: {new Date(activity.evaluation!.evaluatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
