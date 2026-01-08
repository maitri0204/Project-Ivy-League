'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface CounselorMetrics {
    counselorId: string;
    counselorName: string;
    email: string;
    studentsHandled: number;
    averageStudentScore: number;
    taskCompletionRate: number;
}

type SortField = 'counselorName' | 'studentsHandled' | 'averageStudentScore' | 'taskCompletionRate';
type SortOrder = 'asc' | 'desc';

export default function AdminAnalyticsDashboard() {
    const [metrics, setMetrics] = useState<CounselorMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sorting & Filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('studentsHandled');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/counselor/performance');
            if (response.data.success) {
                setMetrics(response.data.data);
            } else {
                setError('Failed to fetch data');
            }
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            setError(err.response?.data?.message || 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc'); // Default to desc for new metrics usually
        }
    };

    const getSortedAndFilteredMetrics = () => {
        let filtered = metrics.filter(m =>
            m.counselorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            // Handle string comparison for names
            if (typeof valA === 'string' && typeof valB === 'string') {
                const comp = valA.localeCompare(valB);
                return sortOrder === 'asc' ? comp : -comp;
            }

            // Handle number comparison
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const processedMetrics = getSortedAndFilteredMetrics();

    const getCompletionColor = (rate: number) => {
        if (rate >= 80) return 'text-green-600 bg-green-100';
        if (rate >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getScoreColor = (score: number) => {
        const maxScore = 60;
        const pct = (score / maxScore) * 100;
        if (pct >= 80) return 'text-green-600';
        if (pct >= 50) return 'text-blue-600';
        if (pct >= 30) return 'text-yellow-600';
        return 'text-red-600'; // Low avg score might indicate tough grading or low performing students
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
                    <div className="text-red-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={fetchMetrics} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Counselor Performance</h1>
                        <p className="text-gray-600 mt-1">Analytics overview of effectiveness and task completion</p>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('counselorName')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Counselor
                                            {sortField === 'counselorName' && (
                                                <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('studentsHandled')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Students Handled
                                            {sortField === 'studentsHandled' && (
                                                <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('averageStudentScore')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Avg. Student Score
                                            {sortField === 'averageStudentScore' && (
                                                <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('taskCompletionRate')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Task Completion
                                            {sortField === 'taskCompletionRate' && (
                                                <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {processedMetrics.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            No counselors found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    processedMetrics.map((counselor) => (
                                        <tr key={counselor.counselorId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                            {counselor.counselorName.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{counselor.counselorName}</div>
                                                        <div className="text-sm text-gray-500">{counselor.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="text-sm text-gray-900 font-semibold">{counselor.studentsHandled}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className={`text-sm font-bold ${getScoreColor(counselor.averageStudentScore)}`}>
                                                    {counselor.averageStudentScore.toFixed(1)} <span className="text-gray-400 font-normal">/ 60</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-grow bg-gray-200 rounded-full h-2.5 w-24">
                                                        <div
                                                            className={`h-2.5 rounded-full ${counselor.taskCompletionRate >= 80 ? 'bg-green-500' : counselor.taskCompletionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${counselor.taskCompletionRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionColor(counselor.taskCompletionRate)}`}>
                                                        {counselor.taskCompletionRate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            * Showing performance metrics for {metrics.length} counselors. Task completion is based on evaluated submissions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
