import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadInvoice, confirmValidation } from '../lib/api';
import { FileText, Upload, Check, X, Loader2, AlertCircle } from 'lucide-react';

export default function AIBillingForm() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        throw new Error('Please select an image or PDF file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }

      // Process the file with AI
      setIsProcessing(true);
      const result = await uploadInvoice(file);
      setExtractedData(result.parsed_json);
    } catch (error: any) {
      setError(error.message);
      event.target.value = '';
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setExtractedData(null);
    setError(null);
  };

  const handleConfirm = async (confirmed: boolean) => {
    try {
      setError(null);
      
      // Send data to FastAPI for validation
      await confirmValidation(extractedData, confirmed);

      if (confirmed) {
        // Redirect to manual form with pre-filled data
        navigate('/new', { 
          state: { 
            prefillData: extractedData,
            uploadedFile: selectedFile
          } 
        });
      } else {
        // Redirect to empty manual form
        navigate('/new');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">AI-Assisted Billing Form</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-600">{error}</span>
        </div>
      )}

      {/* AI Processing Status */}
      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-600">Processing invoice with AI...</span>
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer flex items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
            <div className="text-center">
              <Upload className="mx-auto w-12 h-12 text-gray-400" />
              <span className="mt-4 block text-lg text-gray-600">
                Click to upload or drag and drop
              </span>
              <span className="mt-2 block text-sm text-gray-500">
                PDF or Image up to 5MB
              </span>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-6">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto rounded-lg shadow-md"
            />
            <button
              onClick={clearSelectedFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Extracted Data Review */}
      {extractedData && !isProcessing && (
        <div className="mb-6 p-6 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-green-800">AI Extracted Data</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleConfirm(false)}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded-md"
              >
                Start Over
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Continue to Form
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(extractedData).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-white rounded-md">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-600">{key}:</span>
                  <span className="ml-2 text-sm text-gray-900">{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}