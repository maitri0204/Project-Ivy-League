'use client';

import { useState } from 'react';
import axios from 'axios';

interface UploadResult {
  pointerNo: number;
  filename: string;
  totalRows: number;
  created: number;
  updated?: number;
  skipped: number;
}

export default function UploadExcelPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedPointer, setDetectedPointer] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);

  const getPointerName = (filename: string): string | null => {
    if (filename === 'Spike in One area.xlsx') {
      return 'Pointer 2: Spike in One Area';
    }
    if (filename === 'Leadership & Initiative.xlsx') {
      return 'Pointer 3: Leadership & Initiative';
    }
    if (filename === 'Global & Social Impact.xlsx') {
      return 'Pointer 4: Global & Social Impact';
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const pointerName = getPointerName(file.name);
      setDetectedPointer(pointerName);
      setMessage(null);
      setUploadResult(null);
      setConfirmOverwrite(false);

      if (!pointerName) {
        setMessage({
          type: 'error',
          text: `Invalid filename. Allowed files: "Spike in One area.xlsx", "Leadership & Initiative.xlsx", "Global & Social Impact.xlsx"`,
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    if (!detectedPointer) {
      setMessage({ type: 'error', text: 'Invalid file name' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('excelFile', selectedFile);

      // Add overwrite parameter if checkbox is checked
      const uploadUrl = confirmOverwrite 
        ? 'http://localhost:5000/api/excel-upload?overwrite=true'
        : 'http://localhost:5000/api/excel-upload';

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message || 'Excel file uploaded successfully!' });
        setUploadResult(response.data.data);
        setConfirmOverwrite(false);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to upload Excel file. Please check the backend console for details.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Upload Ivy League Master Excel Files
        </h1>

        <div className="space-y-6">
          {/* File Upload Input */}
          <div>
            <label htmlFor="excelFile" className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <input
              type="file"
              id="excelFile"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Allowed files: "Spike in One area.xlsx", "Leadership & Initiative.xlsx", "Global & Social Impact.xlsx"
            </p>
          </div>

          {/* Detected Pointer Display */}
          {detectedPointer && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-900">
                Detected Pointer:
              </p>
              <p className="text-sm text-blue-700 mt-1">{detectedPointer}</p>
            </div>
          )}

          {/* Confirm Overwrite Checkbox - Show before upload */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confirmOverwrite"
              checked={confirmOverwrite}
              onChange={(e) => setConfirmOverwrite(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="confirmOverwrite" className="ml-2 block text-sm text-gray-700">
              Overwrite existing data (delete all existing records for this pointer and add new ones)
            </label>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-900 mb-2">Upload Summary:</p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Total Rows: {uploadResult.totalRows}</li>
                <li>• Created: {uploadResult.created}</li>
                {uploadResult.updated && uploadResult.updated > 0 && (
                  <li>• Updated: {uploadResult.updated}</li>
                )}
                <li>• Skipped (duplicates): {uploadResult.skipped}</li>
              </ul>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || !selectedFile || !detectedPointer}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload Excel File'}
            </button>
          </div>

          {/* Success or Error Message */}
          {message && (
            <div
              className={`p-4 rounded-md ${
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
    </div>
  );
}

