'use client';

import { useState, useRef, DragEvent } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FileUploadProps {
  onUploaded: (fileUrl: string, fileName: string) => void;
  currentFile?: string;
  onRemove: () => void;
}

export default function FileUpload({ onUploaded, currentFile, onRemove }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        onUploaded(json.data.fileUrl, json.data.fileName);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (currentFile) {
    return (
      <div className="file-attached">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span className="file-attached-name">{currentFile}</span>
        <button className="file-attached-remove" onClick={onRemove}>×</button>
      </div>
    );
  }

  return (
    <div
      className={`file-upload-zone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {/* Cloud upload icon */}
      <div className="file-upload-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 16V8m0 0l-3 3m3-3l3 3" />
          <path d="M20.66 10.19A5.5 5.5 0 0 0 12 4.5a5.5 5.5 0 0 0-5.19 3.69A4.5 4.5 0 0 0 8 17h8a5 5 0 0 0 4.66-6.81z" />
        </svg>
      </div>
      <div className="file-upload-text">
        {uploading ? 'Uploading...' : 'Choose a file or drag & drop it here'}
      </div>
      <div className="file-upload-hint">JPEG, PNG, upto 10MB</div>
      <button
        type="button"
        className="file-upload-browse"
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
      >
        Browse Files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />
    </div>
  );
}
