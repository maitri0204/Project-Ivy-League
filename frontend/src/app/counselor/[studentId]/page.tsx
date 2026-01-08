'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CounselorStudentHub({ params }: { params: Promise<{ studentId: string }> }) {
    const resolvedParams = use(params); // Unwrap params in Next.js 15+
    const { studentId } = resolvedParams;
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');

    // We could fetch student details here again if needed, or trust the ID
    // For now, we build the hub.

    const queryString = `?studentId=${studentId}&studentIvyServiceId=${serviceId || ''}`;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/counselor" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
                        ← Back to Student List
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Student Management Hub</h1>
                    <p className="text-gray-600 mt-2">Managing Student ID: <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{studentId}</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Step 1: Student Interest */}
                    <Link href={`/counselor/student-interest${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gray-100 text-xs font-bold px-2 py-1 rounded-bl-lg text-gray-500">Step 1</div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Student Interest</h2>
                            <p className="text-gray-600 text-sm">Define the student's core interests to guide the agent.</p>
                        </div>
                    </Link>

                    {/* Step 2: Agent Suggestions */}
                    <Link href={`/counselor/agent-suggestions${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gray-100 text-xs font-bold px-2 py-1 rounded-bl-lg text-gray-500">Step 2</div>
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600">Agent Suggestions</h2>
                            <p className="text-gray-600 text-sm">Get AI-driven activity ideas for Pointers 2, 3, 4.</p>
                        </div>
                    </Link>

                    {/* Step 3: Activities Selection */}
                    <Link href={`/counselor/activities${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gray-100 text-xs font-bold px-2 py-1 rounded-bl-lg text-gray-500">Step 3</div>
                            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">Manage Activities</h2>
                            <p className="text-gray-600 text-sm">Select activities and evaluate submitted proofs (Pointers 2-4).</p>
                        </div>
                    </Link>

                    {/* Step 4: Essay */}
                    <Link href={`/counselor/pointer5${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gray-100 text-xs font-bold px-2 py-1 rounded-bl-lg text-gray-500">Step 4</div>
                            <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 text-pink-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-pink-600">Essay (Pointer 5)</h2>
                            <p className="text-gray-600 text-sm">Upload guidelines and evaluate the student's essay.</p>
                        </div>
                    </Link>

                    {/* Step 5: Courses */}
                    <Link href={`/counselor/pointer6${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gray-100 text-xs font-bold px-2 py-1 rounded-bl-lg text-gray-500">Step 5</div>
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-orange-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600">Courses (Pointer 6)</h2>
                            <p className="text-gray-600 text-sm">Upload course list and evaluate certificates.</p>
                        </div>
                    </Link>

                    {/* Step 6: Review Score */}
                    <Link href={`/counselor/ivy-score${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-yellow-100 text-xs font-bold px-2 py-1 rounded-bl-lg text-yellow-600">Final</div>
                            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 text-yellow-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-yellow-600">Ivy Score</h2>
                            <p className="text-gray-600 text-sm">Review overall readiness score and pointer breakdown.</p>
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
}
