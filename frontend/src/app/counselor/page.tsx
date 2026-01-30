'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface StudentService {
    _id: string; // The Service ID
    studentId: {
        _id: string;
        name: string; // Populated
        email: string; // Populated
    };
    status: string;
    createdAt: string;
}

interface PointerScore {
    pointerNo: number;
    score: number;
    maxScore: number;
}

interface IvyScoreData {
    studentIvyServiceId: string;
    pointerScores: PointerScore[];
    overallScore: number;
    generatedAt: string;
}

const pointerNames: { [key: number]: string } = {
    1: 'Academic Excellence',
    2: 'Spike in One Area',
    3: 'Leadership Initiative',
    4: 'Global Social Impact',
    5: 'Authentic Storytelling',
    6: 'Intellectual Curiosity',
};

const pointerDescriptions: { [key: number]: string } = {
    1: 'GPA, test scores, and course rigor',
    2: 'Deep expertise in a specific field',
    3: 'Leadership roles and demonstrated impact',
    4: 'Community service and social contributions',
    5: 'Essay writing and personal narrative',
    6: 'Research and learning beyond curriculum',
};

export default function CounselorDashboard() {
    const searchParams = useSearchParams();
    const selectedStudentId = searchParams.get('studentId');
    const studentIvyServiceId = searchParams.get('studentIvyServiceId');
    
    const [students, setStudents] = useState<StudentService[]>([]);
    const [scoreData, setScoreData] = useState<IvyScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [scoreLoading, setScoreLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scoreError, setScoreError] = useState<string | null>(null);

    // TODO: Replace with logged-in user context
    const counselorId = '695b93a44df1114a001dc23d';

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/api/ivy-service/counselor/${counselorId}/students`);
                if (response.data.success) {
                    setStudents(response.data.data);
                }
            } catch (err: any) {
                console.error('Error fetching students:', err);
                setError('Failed to load students');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [counselorId]);

    useEffect(() => {
        if (selectedStudentId && studentIvyServiceId) {
            fetchIvyScore();
        }
    }, [selectedStudentId, studentIvyServiceId]);

    const fetchIvyScore = async () => {
        try {
            setScoreLoading(true);
            setScoreError(null);
            const response = await axios.get(
                `http://localhost:5000/api/ivy-score/${selectedStudentId}`
            );

            if (response.data.success) {
                setScoreData(response.data.data);
            } else {
                setScoreError('Failed to load score data');
            }
        } catch (err: any) {
            console.error('Error fetching Ivy score:', err);
            setScoreError(err.response?.data?.message || 'Failed to load Ivy score');
        } finally {
            setScoreLoading(false);
        }
    };

    const getScoreColor = (score: number, maxScore: number): string => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getScoreGrade = (score: number, maxScore: number): string => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 80) return 'Very Good';
        if (percentage >= 70) return 'Good';
        if (percentage >= 60) return 'Fair';
        return 'Needs Improvement';
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading students...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    // If a student is selected, show the Ivy Score dashboard
    if (selectedStudentId && studentIvyServiceId) {
        const selectedStudent = students.find(s => s.studentId._id === selectedStudentId);
        
        if (scoreLoading) {
            return (
                <div className="p-20 text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Student Performance Data...</p>
                </div>
            );
        }

        if (scoreError) {
            return (
                <div className="p-12">
                    <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-10 text-center max-w-lg mx-auto shadow-xl shadow-red-50">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6 border-4 border-white shadow-lg">
                            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Load Failed</h3>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">{scoreError}</p>
                        <button
                            onClick={fetchIvyScore}
                            className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100 uppercase tracking-widest text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        if (!scoreData) return null;

        const totalMaxScore = 60;
        const overallPercentage = (scoreData.overallScore / totalMaxScore) * 100;

        return (
            <div className="p-8 md:p-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header */}
                <header className="mb-16">
                    <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4 leading-tight">
                        {selectedStudent?.studentId.name || 'Student'}'s<br />
                        <span className="text-indigo-600">Ivy League Readiness</span>
                    </h1>
                    <p className="text-xl text-gray-400 font-medium max-w-2xl leading-relaxed">
                        Track competitive trajectory across all core admission pillars. Scores are real-time and reflect current evaluations.
                    </p>
                </header>

                {/* Overall Score Card */}
                <div className="relative mb-16 group">
                    <div className="absolute inset-0 bg-indigo-600 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative bg-white rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(79,70,229,0.1)] border border-gray-100 p-12 overflow-hidden">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 text-center md:text-left">
                                <span className="text-[10px] font-black tracking-[0.4em] text-gray-400 uppercase mb-4 block">Calculated Potential</span>
                                <div className="flex items-baseline justify-center md:justify-start gap-4 mb-6">
                                    <span className="text-9xl font-black text-indigo-600 leading-none tracking-tighter">{scoreData.overallScore.toFixed(1)}</span>
                                    <span className="text-3xl font-black text-gray-300">/ {totalMaxScore}</span>
                                </div>
                                <div className="inline-flex items-center gap-3 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-full text-base font-black uppercase tracking-widest">
                                    <span className="h-2 w-2 bg-indigo-600 rounded-full animate-pulse"></span>
                                    {getScoreGrade(scoreData.overallScore, totalMaxScore)}
                                </div>
                            </div>

                            <div className="w-full md:w-[400px] space-y-6">
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Aggregate Readiness</span>
                                    <span className="text-2xl font-black text-indigo-600">{overallPercentage.toFixed(0)}%</span>
                                </div>
                                <div className="h-8 bg-gray-50 rounded-2xl overflow-hidden p-1.5 border border-gray-100 flex items-center">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-xl transition-all duration-1500 ease-out shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                        style={{ width: `${overallPercentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-center text-gray-400 font-bold italic">Last evaluated on {new Date(scoreData.generatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Individual Pointer Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {scoreData.pointerScores.map((pointer) => {
                        const percentage = (pointer.score / pointer.maxScore) * 100;
                        const colorClass = getScoreColor(pointer.score, pointer.maxScore);

                        return (
                            <div
                                key={pointer.pointerNo}
                                className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500 p-8 border border-gray-100 hover:border-indigo-100 group flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xl border border-indigo-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {pointer.pointerNo}
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">
                                            {pointerNames[pointer.pointerNo]}
                                        </h3>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-400 font-bold mb-8 leading-relaxed uppercase tracking-wide">
                                    {pointerDescriptions[pointer.pointerNo]}
                                </p>

                                <div className="mt-auto">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <span className="text-5xl font-black text-gray-900 tracking-tighter">
                                            {pointer.score.toFixed(1)}
                                        </span>
                                        <span className="text-sm font-black text-gray-300 uppercase italic">
                                            Target: {pointer.maxScore}
                                        </span>
                                    </div>

                                    <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                                        <div
                                            className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            {getScoreGrade(pointer.score, pointer.maxScore)}
                                        </span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${colorClass} text-white uppercase tracking-tighter`}>
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Panel */}
                <div className="mt-20 bg-gray-900 rounded-[3rem] p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                        <div className="flex-shrink-0 w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/20">
                            <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Understanding Student Profile</h4>
                            <p className="text-indigo-200/60 font-medium leading-relaxed max-w-3xl">
                                Each pointer follows the Ivy League evaluation matrix scaled from 0-10. Scores are manually verified based on submitted proofs. A score above 45/60 indicates high competitiveness for top-tier universities.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show student list when no student is selected

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Selection</h1>
                <p className="text-gray-600 mb-8">Select a student to manage their Ivy League journey.</p>

                <div className="bg-white shadow-sm overflow-hidden sm:rounded-xl border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {students.length === 0 ? (
                            <li className="px-6 py-8 text-center text-gray-500">No students assigned yet.</li>
                        ) : (
                            students.map((service) => (
                                <li key={service._id}>
                                    <Link href={`/counselor?studentId=${service.studentId._id}&studentIvyServiceId=${service._id}`} className="block hover:bg-gray-50 transition-colors">
                                        <div className="px-6 py-5 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12">
                                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                        {service.studentId.name ? service.studentId.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-base font-semibold text-gray-900">{service.studentId.name || 'Unknown Student'}</div>
                                                    <div className="text-sm text-gray-500">{service.studentId.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {service.status}
                                                </span>
                                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
