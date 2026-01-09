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

                    {/* Pointer 1: Academic Excellence */}
                    <Link href={`/counselor/pointer1${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Academic Excellence</h2>
                            <p className="text-gray-600 text-sm">Review documents and evaluate marksheet performance (Pointer 1).</p>
                        </div>
                    </Link>

                    {/* Activities Selection */}
                    <Link href={`/counselor/activities${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">Manage Activities</h2>
                            <p className="text-gray-600 text-sm">Select activities and evaluate submitted proofs (Pointers 2-4).</p>
                        </div>
                    </Link>

                    {/* Essay */}
                    <Link href={`/counselor/pointer5${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 text-pink-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-pink-600">Essay (Pointer 5)</h2>
                            <p className="text-gray-600 text-sm">Upload guidelines and evaluate the student's essay.</p>
                        </div>
                    </Link>

                    {/* Courses */}
                    <Link href={`/counselor/pointer6${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-orange-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600">Courses (Pointer 6)</h2>
                            <p className="text-gray-600 text-sm">Upload course list and evaluate certificates.</p>
                        </div>
                    </Link>

                    {/* Review Score */}
                    <Link href={`/counselor/ivy-score${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full relative overflow-hidden">
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
