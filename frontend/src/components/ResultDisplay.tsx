import { useState } from 'react';

interface ResultDisplayProps {
  imageUrl: string;
  imageId: string;
  originalName: string;
  onDelete: () => void;
  onReset: () => void;
  isDeleting: boolean;
}

export function ResultDisplay({
  imageUrl,
  originalName,
  onDelete,
  onReset,
  isDeleting,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-container">
      <h2>Processed Image</h2>
      <p className="original-name">{originalName}</p>

      <div className="image-preview">
        <img src={imageUrl} alt="Processed" />
      </div>

      <div className="url-container">
        <input type="text" value={imageUrl} readOnly />
        <button onClick={handleCopy} className="copy-btn">
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
      </div>

      <div className="action-buttons">
        <button onClick={onReset} className="new-btn">
          Process Another Image
        </button>
        <button onClick={onDelete} className="delete-btn" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete Image'}
        </button>
      </div>
    </div>
  );
}
