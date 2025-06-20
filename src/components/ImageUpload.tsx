import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (image: HTMLImageElement) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => onImageUpload(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="text-center">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <ImageIcon className="h-12 w-12 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Image</h3>
            <p className="text-gray-600 mb-4">Upload a photo to create custom locket prints</p>
            <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Upload className="h-5 w-5" />
              <span>Select Image</span>
            </div>
          </div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};