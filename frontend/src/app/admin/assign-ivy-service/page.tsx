'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AssignIvyServicePage() {
  const [students, setStudents] = useState<User[]>([]);
  const [counselors, setCounselors] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedCounselor, setSelectedCounselor] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

  // Fetch students and counselors on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setMessage(null); // Clear any previous messages
      
      try {
        // Fetch students and counselors in parallel
        const [studentsResponse, counselorsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/users?role=STUDENT'),
          axios.get('http://localhost:5000/api/users?role=COUNSELOR'),
        ]);

        if (studentsResponse.data.success) {
          setStudents(studentsResponse.data.data || []);
        } else {
          setStudents([]);
        }

        if (counselorsResponse.data.success) {
          setCounselors(counselorsResponse.data.data || []);
        } else {
          setCounselors([]);
        }

        // Clear any error messages on success
        setMessage(null);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Failed to load students and counselors. Please ensure the backend server is running on http://localhost:5000';
        setMessage({ type: 'error', text: errorMessage });
        setStudents([]);
        setCounselors([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedStudent || !selectedCounselor) {
      setMessage({ type: 'error', text: 'Please select both student and counselor' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/ivy-service', {
        studentId: selectedStudent,
        counselorId: selectedCounselor,
      });

      setMessage({ type: 'success', text: response.data.message || 'Ivy League service assigned successfully!' });
      setSelectedStudent('');
      setSelectedCounselor('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to assign Ivy League service';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Assign Ivy League Service
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Dropdown */}
          <div>
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              id="student"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={loadingUsers}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="text-gray-500">
                {loadingUsers ? 'Loading students...' : '-- Choose Student --'}
              </option>
              {students.map((student) => (
                <option key={student._id} value={student._id} className="text-gray-900">
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          {/* Counselor Dropdown */}
          <div>
            <label htmlFor="counselor" className="block text-sm font-medium text-gray-700 mb-2">
              Select Counselor
            </label>
            <select
              id="counselor"
              value={selectedCounselor}
              onChange={(e) => setSelectedCounselor(e.target.value)}
              disabled={loadingUsers}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" className="text-gray-500">
                {loadingUsers ? 'Loading counselors...' : '-- Choose Counselor --'}
              </option>
              {counselors.map((counselor) => (
                <option key={counselor._id} value={counselor._id} className="text-gray-900">
                  {counselor.name} ({counselor.email})
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Assigning...' : 'Assign Service'}
            </button>
          </div>
        </form>

        {/* Success or Error Message */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

