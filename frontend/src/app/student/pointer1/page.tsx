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

const DOCUMENT_TYPES = [
    { key: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', description: 'Official government issued birth certificate.' },
    { key: 'AADHAR_CARD', label: 'Aadhar Card', description: 'Masked Aadhar card (e.g., xxxx xxxx 1234).' },
    { key: 'MARKSHEET_8', label: 'Class 8 Marksheet', description: 'Academic record for 8th grade.' },
    { key: 'MARKSHEET_9', label: 'Class 9 Marksheet', description: 'Academic record for 9th grade.' },
    { key: 'MARKSHEET_10', label: 'Class 10 Marksheet', description: 'Academic record for 10th grade.' },
    { key: 'MARKSHEET_11', label: 'Class 11 Marksheet', description: 'Academic record for 11th grade.' },
    { key: 'MARKSHEET_12', label: 'Class 12 Marksheet', description: 'Academic record for 12th grade.' },
    { key: 'UNIVERSITY_MARKSHEET', label: 'University Marksheet', description: 'Latest university or college academic record.' },
];

function Pointer1Content() {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');
    const studentIvyServiceId = searchParams.get('studentIvyServiceId');

    const [documents, setDocuments] = useState<Record<string, AcademicDoc>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchStatus = async () => {
        if (!studentId) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/pointer1/status/${studentId}`, {
                params: { studentIvyServiceId }
            });
            const docs = response.data.data.documents;
            const docMap: Record<string, AcademicDoc> = {};
            docs.forEach((d: AcademicDoc) => {
                docMap[d.documentType] = d;
            });
            setDocuments(docMap);
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [studentId]);

    const handleFileChange = async (type: string, file: File) => {
        if (!studentId || !studentIvyServiceId) {
            setMessage({ type: 'error', text: 'Missing student or service information' });
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', type);
        formData.append('studentId', studentId);
        formData.append('studentIvyServiceId', studentIvyServiceId);

        setUploading(type);
        setMessage(null);

        try {
            await axios.post('http://localhost:5000/api/pointer1/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Document uploaded successfully!' });
            fetchStatus();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
        } finally {
            setUploading(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <Link href="/student" className="text-indigo-600 hover:underline mb-6 inline-block">← Back to Dashboard</Link>

            <header className="mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Academic Excellence</h1>
                <p className="text-lg text-gray-600">Pointer 1: Upload your identity and educational records.</p>
            </header>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    <span className="text-lg">{message.type === 'success' ? '✓' : '⚠'}</span>
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            <div className="space-y-4">
                {DOCUMENT_TYPES.map((doc) => {
                    const existing = documents[doc.key];
                    const isUploading = uploading === doc.key;

                    return (
                        <div key={doc.key} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">{doc.label}</h3>
                                <p className="text-sm text-gray-500 mb-2">{doc.description}</p>
                                {existing && (
                                    <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Uploaded: {existing.fileName}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {existing && (
                                    <a
                                        href={`http://localhost:5000${existing.fileUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                        title="View Document"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </a>
                                )}

                                <label className={`relative flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 outline-none ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isUploading ? 'Uploading...' : (existing ? 'Replace' : 'Upload')}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,image/*"
                                        disabled={isUploading}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileChange(doc.key, file);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Pointer1Page() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<div className="p-8 text-center">Loading Content...</div>}>
                <Pointer1Content />
            </Suspense>
        </div>
    );
}
