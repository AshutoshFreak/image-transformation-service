import { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { uploadImage, deleteImage } from './api/imageApi';
import './App.css';

interface ProcessedImage {
  id: string;
  url: string;
  originalName: string;
}

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(
    null
  );

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadImage(file);

      if (response.success && response.data) {
        setProcessedImage({
          id: response.data.id,
          url: response.data.url,
          originalName: response.data.originalName,
        });
      } else {
        setError(response.error || 'Failed to process image');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to upload image';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!processedImage) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteImage(processedImage.id);

      if (response.success) {
        setProcessedImage(null);
      } else {
        setError(response.error || 'Failed to delete image');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete image';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = () => {
    setProcessedImage(null);
    setError(null);
  };

  return (
    <div className="app">
      <header>
        <h1>Image Transformation Service</h1>
        <p>Remove background and flip your images horizontally</p>
      </header>

      <main>
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {processedImage ? (
          <ResultDisplay
            imageUrl={processedImage.url}
            imageId={processedImage.id}
            originalName={processedImage.originalName}
            onDelete={handleDelete}
            onReset={handleReset}
            isDeleting={isDeleting}
          />
        ) : (
          <ImageUploader onUpload={handleUpload} isLoading={isUploading} />
        )}
      </main>

      <footer>
        <p>Powered by Clipdrop and Cloudinary</p>
      </footer>
    </div>
  );
}

export default App;
