import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
          Ivy League Premium Service
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Comprehensive preparation platform for top-tier university admissions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link href="/student" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all transform hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600">Student Portal</h2>
              <p className="text-gray-500">Manage tasks, upload proofs, and track your score.</p>
            </div>
          </Link>

          <Link href="/counselor" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all transform hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600">Counselor Portal</h2>
              <p className="text-gray-500">Manage students, evaluate tasks, and guide progress.</p>
            </div>
          </Link>

          <Link href="/parent" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all transform hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600">Parent Portal</h2>
              <p className="text-gray-500">View child's progress and readiness insights.</p>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all transform hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600">Admin Portal</h2>
              <p className="text-gray-500">System configuration, assignments, and analytics.</p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-400">
          Ivy League Module &copy; 2026
        </div>
      </div>
    </div>
  );
}
