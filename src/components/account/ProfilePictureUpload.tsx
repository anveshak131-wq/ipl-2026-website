'use client';

import React, { useRef, useState } from 'react';

interface ProfilePictureUploadProps {
  currentInitials?: string;
  onUpload?: (file: File) => void;
  isLoading?: boolean;
}

export default function ProfilePictureUpload({
  currentInitials = 'U',
  onUpload,
  isLoading = false,
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(0);
          onUpload?.(file);
        } else {
          setUploadProgress(progress);
        }
      }, 200);
    }
  };

  return (
    <>
    <style>{`
      @keyframes uploadPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes uploadSuccess {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes progressFill {
        0% { width: 0%; }
        100% { width: var(--progress); }
      }
      .upload-zone {
        transition: all 0.3s ease;
      }
      .upload-zone.dragging {
        background-color: rgba(251, 191, 36, 0.1);
        border-color: #fbbf24;
        transform: scale(1.02);
      }
      .upload-pulse {
        animation: uploadPulse 2s ease-in-out infinite;
      }
      .upload-success {
        animation: uploadSuccess 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      .progress-bar {
        animation: progressFill 0.3s ease-out forwards;
      }
    `}</style>
  ) || (
    <div className="space-y-4">
      <div
        className={`upload-zone relative w-32 h-32 mx-auto rounded-full border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer overflow-hidden ${
          isDragging ? 'dragging' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold to-yellow-400 opacity-0 group-hover:opacity-10 transition-opacity" />

        {/* Avatar */}
        <div className={`upload-pulse relative z-10 text-5xl font-black text-white bg-gradient-to-br from-ipl-gold to-yellow-400 w-full h-full flex items-center justify-center rounded-full ${
          isLoading ? 'opacity-50' : ''
        }`}>
          {currentInitials}
        </div>

        {/* Upload icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full">
          <span className="text-2xl">📤</span>
        </div>

        {/* Progress bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="progress-bar h-full bg-gradient-to-r from-ipl-gold to-yellow-400"
              style={{ '--progress': `${uploadProgress}%` } as React.CSSProperties}
            />
          </div>
        )}

        {/* Success checkmark */}
        {uploadProgress === 100 && (
          <div className="upload-success absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-full">
            <span className="text-4xl">✓</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      <p className="text-center text-sm text-gray-400">
        {uploadProgress > 0 && uploadProgress < 100
          ? `Uploading... ${Math.round(uploadProgress)}%`
          : 'Drag or click to upload'}
      </p>
    </div>
    </>
  );
}
