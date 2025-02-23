import React from 'react';
import { Camera, Upload, X } from 'lucide-react';

type ImageUploadProps = {
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCameraCapture: () => void;
  clearSelectedFile: () => void;
  previewUrl: string | null;
  isUploading: boolean;
};

export function ImageUpload({ 
  handleFileSelect, 
  handleCameraCapture, 
  clearSelectedFile, 
  previewUrl,
  isUploading 
}: ImageUploadProps) {
  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Bill Image
      </label>
      <div className="flex items-center gap-4">
        <label className="cursor-pointer flex items-center justify-center w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
          <Upload className="w-6 h-6 text-gray-400" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload image"
            disabled={isUploading}
          />
        </label>
        <button
          type="button"
          onClick={handleCameraCapture}
          className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors"
          aria-label="Capture image with camera"
          disabled={isUploading}
        >
          <Camera className="w-6 h-6 text-gray-400" />
        </button>
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={clearSelectedFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              aria-label="Remove image"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {isUploading && (
          <span className="text-sm text-gray-600">Uploading image...</span>
        )}
      </div>
    </div>
  );
}