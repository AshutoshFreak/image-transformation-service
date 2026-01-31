import { useCallback, useState } from 'react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function ImageUploader({ onUpload, isLoading }: ImageUploaderProps) {
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

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isLoading ? (
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Processing your image...</p>
          <p className="loading-hint">Removing background and flipping</p>
        </div>
      ) : (
        <>
          <div className="upload-icon">📷</div>
          <p>Drag and drop an image here</p>
          <p className="or-text">or</p>
          <label className="file-input-label">
            Choose File
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
          </label>
          <p className="file-hint">Supports JPEG, PNG, WebP (max 10MB)</p>
        </>
      )}
    </div>
  );
}
