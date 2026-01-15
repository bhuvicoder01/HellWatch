import { api } from "./api";

class MultipartUpload {
  constructor(file, chunkSize = 20 * 1024 * 1024) { // 5MB chunks
    this.file = file;
    this.chunkSize = chunkSize;
    this.totalChunks = Math.ceil(file.size / chunkSize);
    this.uploadId = null;
    this.key = null;
    this.parts = [];
  }

  async initiate() {
    const response = await api.post('/videos/multipart/initiate', {
      fileName: this.file.name,
      fileType: this.file.type
    });

    this.uploadId = response.data.uploadId;
    this.key = response.data.key;
    return response.data;
  }

  async getPresignedUrls() {
    const response = await api.post('/videos/multipart/urls', {
      key: this.key,
      uploadId: this.uploadId,
      parts: this.totalChunks
    });

    return response.data;
  }

  async uploadPart(partNumber, url, chunk) {
    const response = await fetch(url, {
      method: 'PUT',
      body: chunk
    });

    return {
      partNumber,
      etag: response.headers.get('ETag')
    };
  }

  async upload(onProgress) {
    try {
      // Step 1: Initiate multipart upload
      await this.initiate();

      // Step 2: Get presigned URLs for all parts
      const { urls } = await this.getPresignedUrls();

      // Step 3: Upload parts in parallel
      const uploadPromises = urls.map(async ({ partNumber, url }) => {
        const start = (partNumber - 1) * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunk = this.file.slice(start, end);

        const result = await this.uploadPart(partNumber, url, chunk);
        
        if (onProgress) {
          onProgress(partNumber, this.totalChunks);
        }

        return result;
      });

      this.parts = await Promise.all(uploadPromises);

      // Step 4: Complete multipart upload
      const response = await api.post('/videos/multipart/complete', {
        key: this.key,
        uploadId: this.uploadId,
        parts: this.parts
      });

      return response.data;
    } catch (error) {
      await this.abort();
      throw error;
    }
  }

  async abort() {
    if (this.uploadId && this.key) {
      await api.post('/videos/multipart/abort', {
        key: this.key,
        uploadId: this.uploadId
      });
    }
  }
}

export default MultipartUpload;