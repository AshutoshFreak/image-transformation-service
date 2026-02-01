/**
 * Drag-and-drop image uploader with loading state preview.
 */
import { useCallback, useState } from 'react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  previewUrl: string | null;
}

export function ImageUploader({ onUpload, isLoading, previewUrl }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  // Show processing state with image preview
  if (isLoading && previewUrl) {
    return (
      <div className="processing-container">
        <div className="image-preview-wrapper">
          <img src={previewUrl} alt="Processing" />
          <div className="processing-overlay">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="upload-icon">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      </div>
      <h3>Upload an image</h3>
      <p>Drag and drop or click to browse</p>
      <label className="upload-btn">
        Choose File
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
        />
      </label>
      <p className="file-hint">PNG, JPG, WebP up to 10MB</p>
    </div>
  );
}
