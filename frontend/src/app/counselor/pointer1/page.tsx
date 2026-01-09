'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Evaluation {
    score: number;
    feedback: string;
    evaluatedAt: string;
}

interface AcademicDoc {
    _id: string;
    documentType: string;
    customLabel?: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
    evaluation: Evaluation | null;
}

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

function EvaluationForm({ doc, studentIvyServiceId, counselorId, onSave }: { doc: AcademicDoc, studentIvyServiceId: string, counselorId: string, onSave: () => void }) {
    const [score, setScore] = useState(doc.evaluation?.score.toString() || '');
    const [feedback, setFeedback] = useState(doc.evaluation?.feedback || '');
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSave = async () => {
        const s = parseFloat(score);
        if (isNaN(s) || s < 0 || s > 10) {
            setMsg({ type: 'error', text: 'Score 0-10 required' });
            return;
        }
        setSubmitting(true);
        setMsg(null);
        try {
            await axios.post('http://localhost:5000/api/pointer1/evaluate', {
                studentIvyServiceId,
                academicDocumentId: doc._id,
                counselorId,
                score: s,
                feedback
            });
            setMsg({ type: 'success', text: 'Saved' });
            onSave();
        } catch (e: any) {
            setMsg({ type: 'error', text: 'Error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Marksheet Score (0-10)</label>
                    <input
                        type="number"
                        min="0" max="10" step="0.5"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-900 transition-all text-lg"
                        placeholder="0-10"
                    />
                </div>
                <div className="flex-[3]">
                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Feedback</label>
                    <input
                        type="text"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-medium text-gray-700 transition-all text-sm"
                        placeholder="Observations..."
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-sm h-[52px]"
                    >
                        {submitting ? '...' : 'SAVE'}
                    </button>
                </div>
            </div>
            {msg && <p className={`mt-2 text-xs font-bold ${msg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{msg.text}</p>}
        </div>
    );
}

function CounselorPointer1Content() {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');
    const studentIvyServiceId = searchParams.get('studentIvyServiceId');
    const counselorId = searchParams.get('counselorId') || '695b93a44df1114a001dc23d';

    const [documents, setDocuments] = useState<AcademicDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingDocId, setViewingDocId] = useState<string | null>(null);

    const fetchStatus = async () => {
        if (!studentId) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/pointer1/status/${studentId}`, {
                params: { studentIvyServiceId }
            });
            setDocuments(response.data.data.documents);
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStatus(); }, [studentId]);

    const identityDocs = documents.filter(d => ['BIRTH_CERTIFICATE', 'AADHAR_CARD'].includes(d.documentType));
    const schoolMarksheets = documents.filter(d => ['MARKSHEET_8', 'MARKSHEET_9', 'MARKSHEET_10', 'MARKSHEET_11', 'MARKSHEET_12'].includes(d.documentType));
    const uniMarksheets = documents.filter(d => d.documentType === 'UNIVERSITY_MARKSHEET');

    const totalEvaluated = documents.filter(d => d.evaluation).length;
    const sumScores = documents.reduce((acc, d) => acc + (d.evaluation?.score || 0), 0);
    const meanScore = totalEvaluated > 0 ? (sumScores / totalEvaluated).toFixed(2) : '0.00';

    if (loading) return <div className="p-12 text-center text-indigo-400 font-black animate-pulse tracking-widest uppercase">Fetching Records...</div>;

    const renderDocCard = (d: AcademicDoc, isMarksheet: boolean = false) => {
        const isViewing = viewingDocId === d._id;
        return (
            <div key={d._id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                            {d.documentType === 'UNIVERSITY_MARKSHEET' ? d.customLabel : DOC_LABELS[d.documentType]}
                        </h3>
                        <p className="text-gray-400 text-sm font-mono mt-1">{d.fileName}</p>
                        {d.evaluation && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Score: {d.evaluation.score}/10
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setViewingDocId(isViewing ? null : d._id)}
                        className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all border shadow-inner ${isViewing ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border-transparent hover:border-indigo-100'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {isViewing ? 'CLOSE VIEW' : 'VIEW FILE'}
                    </button>
                </div>

                {isViewing && (
                    <InlineDocViewer url={d.fileUrl} onClose={() => setViewingDocId(null)} />
                )}

                {isMarksheet && studentIvyServiceId && counselorId && (
                    <EvaluationForm
                        doc={d}
                        studentIvyServiceId={studentIvyServiceId}
                        counselorId={counselorId}
                        onSave={fetchStatus}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans tracking-tight">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <Link href={`/counselor/${studentId}?serviceId=${studentIvyServiceId}`} className="inline-flex items-center text-indigo-600 font-bold hover:translate-x-[-4px] transition-transform mb-6">
                            <span className="mr-2 text-xl">←</span> HUB
                        </Link>
                        <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">ACADEMIC<br /><span className="text-indigo-600">EXCELLENCE</span></h1>
                        <p className="text-xl text-gray-400 font-medium max-w-xl">Individual marksheet verification and performance evaluation.</p>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-indigo-50 flex flex-col items-center justify-center text-center scale-110 md:mr-10">
                        <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase mb-2">Current Mean Score</span>
                        <div className="text-7xl font-black text-indigo-600 leading-none">{meanScore}</div>
                        <span className="text-xs font-bold text-gray-400 mt-2 italic bg-gray-50 px-3 py-1 rounded-full uppercase">Evaluated: {totalEvaluated} docs</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-16">
                    <section>
                        <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                            <span className="h-10 w-2 bg-blue-500 rounded-full"></span>
                            IDENTITY VERIFICATION
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {identityDocs.map(d => renderDocCard(d))}
                            {identityDocs.length === 0 && <p className="text-gray-300 font-bold italic py-8 border-2 border-dashed rounded-3xl text-center md:col-span-2">No identity documents available.</p>}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                            <span className="h-10 w-2 bg-indigo-500 rounded-full"></span>
                            SCHOOL MARKSHEETS
                        </h2>
                        {schoolMarksheets.map(d => renderDocCard(d, true))}
                        {schoolMarksheets.length === 0 && <p className="text-gray-300 font-bold italic py-12 border-2 border-dashed rounded-3xl text-center">No school marksheets available.</p>}
                    </section>

                    <section>
                        <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                            <span className="h-10 w-2 bg-purple-500 rounded-full"></span>
                            UNIVERSITY RECORDS
                        </h2>
                        {uniMarksheets.map(d => renderDocCard(d, true))}
                        {uniMarksheets.length === 0 && <p className="text-gray-300 font-bold italic py-12 border-2 border-dashed rounded-3xl text-center">No university records available.</p>}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default function CounselorPointer1Page() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-gray-300 font-black animate-pulse tracking-[1em] uppercase">Booting Review Suit...</div>}>
            <CounselorPointer1Content />
        </Suspense>
    );
}
