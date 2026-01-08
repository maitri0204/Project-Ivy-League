import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Admin Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/admin/assign-ivy-service" className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full">
                            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">Assign Service</h2>
                            <p className="text-gray-600 text-sm">Assign counselors to students for Ivy League Service.</p>
                        </div>
                    </Link>

                    <Link href="/admin/upload-excel" className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full">
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600">Upload Master Data</h2>
                            <p className="text-gray-600 text-sm">Upload Excel files for Pointers 2, 3, and 4 activities.</p>
                        </div>
                    </Link>

                    <Link href="/admin/analytics" className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full">
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600">Counselor Analytics</h2>
                            <p className="text-gray-600 text-sm">Monitor counselor performance and task completion rates.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
