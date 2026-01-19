import { api } from "./api";

class MultipartUpload {
  constructor(file, chunkSize = 50 * 1024 * 1024) { // 50MB chunks
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
      fileType: this.file.type,
      totalParts: this.totalChunks
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

  async uploadPart(partNumber, url, chunk, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(partNumber, event.loaded, event.total);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const etag = xhr.getResponseHeader('ETag');
          resolve({ partNumber, etag });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      
      xhr.open('PUT', url);
      xhr.send(chunk);
    });
  }

  async upload(onProgress) {
    try {
      await this.initiate();
      const { urls } = await this.getPresignedUrls();

      const partProgress = new Map();
      urls.forEach(({ partNumber }) => {
        partProgress.set(partNumber, { loaded: 0, total: 0 });
      });

      const uploadPromises = urls.map(async ({ partNumber, url }) => {
        const start = (partNumber - 1) * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunk = this.file.slice(start, end);

        const result = await this.uploadPart(partNumber, url, chunk, (pn, loaded, total) => {
          partProgress.set(pn, { loaded, total });
          
          let totalLoaded = 0;
          let totalSize = 0;
          partProgress.forEach(p => {
            totalLoaded += p.loaded;
            totalSize += p.total;
          });
          
          if (onProgress) {
            onProgress(totalLoaded, this.file.size);
          }
        });

        return result;
      });

      this.parts = await Promise.all(uploadPromises);

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