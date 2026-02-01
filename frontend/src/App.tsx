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
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadImage(file);

      if (response.success && response.data) {
        const newImage = {
          id: response.data.id,
          url: response.data.url,
          originalName: response.data.originalName,
        };
        setImages(prev => {
          const updated = [...prev, newImage];
          setCurrentIndex(updated.length - 1);
          return updated;
        });
      } else {
        setError(response.error || 'Failed to process image');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      setError(message);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);
    }
  };

  const handleDelete = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteImage(currentImage.id);

      if (response.success) {
        const newImages = images.filter((_, i) => i !== currentIndex);
        setImages(newImages);

        if (newImages.length === 0) {
          setCurrentIndex(0);
        } else if (currentIndex >= newImages.length) {
          setCurrentIndex(newImages.length - 1);
        }
      } else {
        setError(response.error || 'Failed to delete image');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete image';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectImage = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];
  const showUploader = images.length === 0;

  return (
    <div className="app">
      <header>
        <h1>Remove Background & Flip</h1>
        <p>Transform your images instantly</p>
      </header>

      <main>
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {showUploader ? (
          <>
            <ImageUploader
              onUpload={handleUpload}
              isLoading={isUploading}
              previewUrl={previewUrl}
            />
            {!isUploading && (
              <div className="demo-image">
                <img src="/demo.png" alt="Example: before and after" />
              </div>
            )}
          </>
        ) : (
          <ResultDisplay
            imageUrl={currentImage.url}
            imageId={currentImage.id}
            originalName={currentImage.originalName}
            onDelete={handleDelete}
            onUpload={handleUpload}
            isDeleting={isDeleting}
            isUploading={isUploading}
            images={images}
            currentIndex={currentIndex}
            onSelectImage={handleSelectImage}
          />
        )}
      </main>

      <footer>
        <p>Powered by Clipdrop and Cloudinary</p>
      </footer>
    </div>
  );
}

export default App;
