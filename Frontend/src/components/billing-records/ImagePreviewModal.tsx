import React from 'react';
import { X } from 'lucide-react';

type ImagePreviewModalProps = {
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
};

export function ImagePreviewModal({ previewImage, setPreviewImage }: ImagePreviewModalProps) {
  if (!previewImage) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-lg max-w-3xl max-h-[90vh] overflow-auto">
        <button
          onClick={() => setPreviewImage(null)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={previewImage}
          alt="Bill"
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
}