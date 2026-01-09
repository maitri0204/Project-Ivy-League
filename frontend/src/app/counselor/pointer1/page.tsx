'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface AcademicDoc {
    _id: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
}

const DOCUMENT_GROUPS = {
    identity: ['BIRTH_CERTIFICATE', 'AADHAR_CARD'],
    marksheet: [
        'MARKSHEET_8',
        'MARKSHEET_9',
        'MARKSHEET_10',
        'MARKSHEET_11',
        'MARKSHEET_12',
        'UNIVERSITY_MARKSHEET'
    ]
};

const DOC_LABELS: Record<string, string> = {
    BIRTH_CERTIFICATE: 'Birth Certificate',
    AADHAR_CARD: 'Aadhar Card',
    MARKSHEET_8: 'Class 8 Marksheet',
    MARKSHEET_9: 'Class 9 Marksheet',
    MARKSHEET_10: 'Class 10 Marksheet',
    MARKSHEET_11: 'Class 11 Marksheet',
    MARKSHEET_12: 'Class 12 Marksheet',
    UNIVERSITY_MARKSHEET: 'University Marksheet',
};

function CounselorPointer1Content() {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');
    const studentIvyServiceId = searchParams.get('studentIvyServiceId');
    const counselorId = searchParams.get('counselorId') || '695b93a44df1114a001dc23d';

    const [documents, setDocuments] = useState<Record<string, AcademicDoc>>({});
    const [score, setScore] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchStatus = async () => {
        if (!studentId) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/pointer1/status/${studentId}`, {
                params: { studentIvyServiceId }
            });
            const { documents: docs, evaluation } = response.data.data;
            const docMap: Record<string, AcademicDoc> = {};
            docs.forEach((d: AcademicDoc) => {
                docMap[d.documentType] = d;
            });
            setDocuments(docMap);
            if (evaluation) {
                setScore(evaluation.score.toString());
                setFeedback(evaluation.feedback || '');
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [studentId]);

    const handleEvaluate = async () => {
        const scoreNum = parseFloat(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
            setMessage({ type: 'error', text: 'Score must be between 0 and 10' });
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('http://localhost:5000/api/pointer1/evaluate', {
                studentIvyServiceId,
                counselorId,
                score: scoreNum,
                feedback
            });
            setMessage({ type: 'success', text: 'Evaluation saved successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save evaluation' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading student records...</div>;

    const renderDocCard = (type: string) => {
        const doc = documents[type];
        return (
            <div key={type} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div>
                    <h4 className="font-semibold text-gray-900">{DOC_LABELS[type]}</h4>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                        {doc ? doc.fileName : 'Not Uploaded'}
                    </p>
                </div>
                {doc && (
                    <a
                        href={`http://localhost:5000${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-indigo-100"
                    >
                        View Document
                    </a>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <Link
                href={studentId ? `/counselor/${studentId}?serviceId=${studentIvyServiceId}` : '/counselor'}
                className="text-indigo-600 hover:bg-white px-4 py-2 rounded-xl transition-all mb-8 inline-block"
            >
                ← Back to Student Hub
            </Link>

            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Academic Excellence Review</h1>
            <p className="text-gray-500 mb-10">Pointer 1: Verify documents and evaluate academic performance.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Document List */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">Identity Documents</h2>
                        <div className="space-y-3">
                            {DOCUMENT_GROUPS.identity.map(renderDocCard)}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-indigo-500 pl-3">Academic Marksheets</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {DOCUMENT_GROUPS.marksheet.map(renderDocCard)}
                        </div>
                    </section>
                </div>

                {/* Evaluation Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Evaluation</h3>

                        {message && (
                            <div className={`mb-6 p-4 rounded-xl text-sm font-medium transition-all animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Pointer 1 Score (0-10)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    placeholder="e.g. 8.5"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-xl font-bold text-gray-900"
                                />
                                <p className="text-xs text-gray-400 mt-2 font-medium italic">Evaluated based on marksheet performance.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Counselor Feedback
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    placeholder="Provide feedback on academic records..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-gray-900 font-medium"
                                />
                            </div>

                            <button
                                onClick={handleEvaluate}
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
                            >
                                {submitting ? 'Saving...' : 'Save Evaluation'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CounselorPointer1Page() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<div className="p-8 text-center text-gray-500 font-medium">Reaching server...</div>}>
                <CounselorPointer1Content />
            </Suspense>
        </div>
    );
}
