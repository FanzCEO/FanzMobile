import { apiClient } from './client';

export interface UploadResponse {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  size: number;
  url: string;
  created_at: string;
}

export interface FileMetadata {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  size: number;
  url: string;
  purpose?: string;
  created_at: string;
}

export const uploadsApi = {
  /**
   * Upload a file
   */
  async upload(file: File, purpose?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (purpose) {
      formData.append('purpose', purpose);
    }

    const { data } = await apiClient.post<UploadResponse>('/api/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Get file URL
   */
  getFileUrl(fileId: string): string {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
    return `${baseUrl}/api/uploads/${fileId}`;
  },

  /**
   * List user's files
   */
  async list(params?: { limit?: number; skip?: number; purpose?: string }): Promise<FileMetadata[]> {
    const { data } = await apiClient.get<FileMetadata[]>('/api/uploads', { params });
    return data;
  },

  /**
   * Delete a file
   */
  async delete(fileId: string): Promise<void> {
    await apiClient.delete(`/api/uploads/${fileId}`);
  },
};
