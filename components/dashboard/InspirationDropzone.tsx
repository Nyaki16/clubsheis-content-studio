'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { InspirationFile } from '@/types';

interface Props {
  files: InspirationFile[];
  onFilesChange: (files: InspirationFile[]) => void;
  inspirationUrl: string;
  onUrlChange: (url: string) => void;
  label?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export default function InspirationDropzone({
  files,
  onFilesChange,
  inspirationUrl,
  onUrlChange,
  label = 'Drop your inspiration here — a screenshot, reference image, competitor example, or anything that captures the vibe you\'re going for.',
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
  },
  maxSize = 10 * 1024 * 1024,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      const newFiles: InspirationFile[] = [];

      for (const file of acceptedFiles) {
        if (file.size > maxSize) {
          setError(
            `That file is too large (max ${Math.round(maxSize / 1024 / 1024)}MB). Try compressing it or pasting the URL instead.`
          );
          continue;
        }

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });

        newFiles.push({
          name: file.name,
          type: file.type,
          base64,
          mediaType: file.type,
        });
      }

      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
  });

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="font-ui text-xs font-semibold tracking-wider text-grey-mid uppercase">
        Inspiration
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-yellow bg-yellow/5'
            : 'border-grey-mid/50 hover:border-yellow bg-grey-light/40'
        }`}
      >
        <input {...getInputProps()} />
        <svg
          className="w-8 h-8 mx-auto mb-3 text-grey-mid"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="font-ui text-sm text-grey-mid">{label}</p>
        <p className="font-ui text-xs text-grey-mid/60 mt-1">
          JPG, PNG, WEBP, GIF, or PDF — max {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 bg-grey-light text-sm font-ui"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                onClick={() => removeFile(i)}
                className="text-grey-mid hover:text-red transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="font-ui text-xs text-grey-mid">
          Or paste a URL / screenshot link
        </label>
        <input
          type="url"
          value={inspirationUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
          className="w-full mt-1 px-3 py-2 border border-grey-light font-ui text-sm focus:outline-none focus:border-yellow"
        />
      </div>

      {error && (
        <p className="font-ui text-sm text-red">{error}</p>
      )}
    </div>
  );
}
