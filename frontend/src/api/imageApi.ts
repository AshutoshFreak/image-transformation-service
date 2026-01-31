import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UploadResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    originalName: string;
  };
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post<UploadResponse>(
    `${API_BASE_URL}/api/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function deleteImage(id: string): Promise<DeleteResponse> {
  const response = await axios.delete<DeleteResponse>(
    `${API_BASE_URL}/api/images/${encodeURIComponent(id)}`
  );

  return response.data;
}
