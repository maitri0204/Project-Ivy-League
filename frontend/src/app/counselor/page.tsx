'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

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

export default function CounselorDashboard() {
    const [students, setStudents] = useState<StudentService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) return <div className="p-8 text-center">Loading students...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Counselor Dashboard</h1>
                <p className="text-gray-600 mb-6">Select a student to manage their Ivy League journey.</p>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {students.length === 0 ? (
                            <li className="px-6 py-4 text-center text-gray-500">No students assigned yet.</li>
                        ) : (
                            students.map((service) => (
                                <li key={service._id}>
                                    <Link href={`/counselor/${service.studentId._id}?serviceId=${service._id}`} className="block hover:bg-gray-50 transition-colors">
                                        <div className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                        {service.studentId.name ? service.studentId.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-indigo-600 truncate">{service.studentId.name || 'Unknown Student'}</div>
                                                    <div className="text-sm text-gray-500">{service.studentId.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {service.status}
                                                </span>
                                                <svg className="ml-5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
