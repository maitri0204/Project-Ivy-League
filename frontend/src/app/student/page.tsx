'use client';

import Link from 'next/link';

export default function StudentDashboard() {
    // Hardcoded for MVP flow demonstration
    const studentId = '695b93a44df1114a001dc239'; // John Doe
    const studentIvyServiceId = '695f7ae780f617ac22d4fdc1'; // Seeded Service for Jane Smith
    const queryString = `?studentId=${studentId}&studentIvyServiceId=${studentIvyServiceId}`;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">My Ivy League Space</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href={`/student/activities${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full">
                            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">Activities (Pointers 2-4)</h2>
                            <p className="text-gray-600 text-sm">View assigned activities and upload proofs.</p>
                        </div>
                    </Link>

                    <Link href={`/student/pointer5${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full">
                            <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 text-pink-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-pink-600">Essay (Pointer 5)</h2>
                            <p className="text-gray-600 text-sm">Download guidelines and upload your essay.</p>
                        </div>
                    </Link>

                    <Link href={`/student/pointer6${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full">
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 text-orange-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600">Courses (Pointer 6)</h2>
                            <p className="text-gray-600 text-sm">View required courses and upload certificates.</p>
                        </div>
                    </Link>

                    <Link href={`/student/ivy-score${queryString}`} className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full">
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600">Score Dashboard</h2>
                            <p className="text-gray-600 text-sm">Track your overall Ivy League readiness.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
