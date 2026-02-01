/**
 * Displays processed images with gallery navigation, download, copy URL, and delete actions.
 */
import { useState, useRef } from 'react';

interface ProcessedImage {
  id: string;
  url: string;
  originalName: string;
}

interface ResultDisplayProps {
  imageUrl: string;
  imageId: string;
  originalName: string;
  onDelete: () => void;
  onUpload: (file: File) => void;
  isDeleting: boolean;
  isUploading: boolean;
  images: ProcessedImage[];
  currentIndex: number;
  onSelectImage: (index: number) => void;
}

export function ResultDisplay({
  imageUrl,
  originalName,
  onDelete,
  onUpload,
  isDeleting,
  isUploading,
  images,
  currentIndex,
  onSelectImage,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    window.open(imageUrl, '_blank');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="result-container">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Thumbnail bar */}
      <div className="history-bar">
        {images.map((img, i) => (
          <button
            key={img.id}
            className={`history-thumb ${i === currentIndex ? 'active' : ''}`}
            onClick={() => onSelectImage(i)}
          >
            <img src={img.url} alt={img.originalName} />
          </button>
        ))}
        {isUploading && (
          <div className="history-thumb loading">
            <div className="thumb-spinner"></div>
          </div>
        )}
        <button
          className="history-thumb add-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="checkered-bg">
        <img src={imageUrl} alt="Processed" />
      </div>

      <p className="original-name">{originalName}</p>

      <div className="url-container">
        <input type="text" value={imageUrl} readOnly />
        <button onClick={handleCopy} className="copy-btn">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="action-buttons">
        <button onClick={handleDownload} className="download-btn">
          Download
        </button>
        <button onClick={onDelete} className="delete-btn" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
