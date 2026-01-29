"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Activity {
  _id: string;
  title: string;
  description: string;
  pointerNo: number;
  documentUrl?: string;
  documentName?: string;
  source: string;
  createdAt: string;
}

export default function SuperadminPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pointerNo: "2",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/activities");
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Activity name is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Activity description is required");
      return;
    }

    if (!selectedFile) {
      setError("Please select a Word document");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("pointerNo", formData.pointerNo);
      formDataToSend.append("document", selectedFile);

      const response = await axios.post(
        "http://localhost:5000/api/activities",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Activity created successfully!");
        setFormData({ name: "", description: "", pointerNo: "2" });
        setSelectedFile(null);
        fetchActivities();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create activity");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/activities/${id}`
      );

      if (response.data.success) {
        setSuccess("Activity deleted successfully!");
        fetchActivities();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete activity");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Activity Management
        </h1>

        {/* Add Activity Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Add New Activity
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Activity Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter activity name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-y"
                placeholder="Enter activity description"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Pointer
              </label>
              <select
                value={formData.pointerNo}
                onChange={(e) =>
                  setFormData({ ...formData, pointerNo: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="2">Pointer 2</option>
                <option value="3">Pointer 3</option>
                <option value="4">Pointer 4</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Document (Word only)
              </label>
              <input
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) =>
                  setSelectedFile(e.target.files ? e.target.files[0] : null)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Creating..." : "Create Activity"}
            </button>
          </form>
        </div>

        {/* Activities List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            All Activities
          </h2>

          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No activities found. Create your first activity above.
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                      {activity.title}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Pointer:</span> Pointer{" "}
                        {activity.pointerNo}
                      </p>
                      {activity.documentName && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Document:</span>{" "}
                          {activity.documentName}
                        </p>
                      )}
                        <p className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(activity._id)}
                      className="ml-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
