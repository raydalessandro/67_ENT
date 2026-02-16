// ============================================================================
// Media Uploader — select, validate, upload with progress
// ============================================================================

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, Film } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { generateThumbnailSafe } from '@/lib/storage';
import { validateFile, isVideoFile, formatFileSize, sanitizeFilename } from '@/lib/utils';
import { ACCEPTED_MEDIA_TYPES } from '@/config/constants';

interface UploadedFile {
  id: string;
  path: string;
  name: string;
  type: string;
  size: number;
  thumbnailPath?: string;
  previewUrl: string;
}

interface Props {
  postId: string;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

export function MediaUploader({ postId, files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting same file

    for (const file of selected) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      setUploading(true);

      const fileId = crypto.randomUUID();
      const fileName = sanitizeFilename(file.name);
      const storagePath = `${postId}/${fileId}_${fileName}`;

      // Upload main file
      const result = await api.storage.upload('post-media', storagePath, file);

      if (!result.ok) {
        toast.error(`Errore upload ${file.name}: ${result.error.userMessage}`);
        setUploading(false);
        continue;
      }

      // Video: generate and upload thumbnail
      let thumbnailPath: string | undefined;
      if (isVideoFile(file)) {
        const thumbnail = await generateThumbnailSafe(file);
        if (thumbnail) {
          const thumbPath = `${postId}/thumb_${fileId}.jpg`;
          const thumbResult = await api.storage.upload('post-media', thumbPath, thumbnail, {
            contentType: 'image/jpeg',
          });
          if (thumbResult.ok) {
            thumbnailPath = thumbPath;
          }
        }
      }

      const newFile: UploadedFile = {
        id: fileId,
        path: storagePath,
        name: file.name,
        type: file.type,
        size: file.size,
        thumbnailPath,
        previewUrl: URL.createObjectURL(file),
      };

      onChange([...files, newFile]);
      setUploading(false);
    }
  };

  const removeFile = async (file: UploadedFile) => {
    const paths = [file.path];
    if (file.thumbnailPath) paths.push(file.thumbnailPath);
    await api.storage.delete('post-media', paths);

    URL.revokeObjectURL(file.previewUrl);
    onChange(files.filter((f) => f.id !== file.id));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MEDIA_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="media-input"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-3 w-full rounded-xl
                   bg-gray-800 border border-dashed border-gray-600 text-gray-400
                   hover:border-gray-500 hover:text-gray-300
                   disabled:opacity-50 transition-colors"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ImagePlus className="w-5 h-5" />
        )}
        <span className="text-sm">
          {uploading ? 'Caricamento...' : 'Aggiungi media'}
        </span>
      </button>

      {/* File previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((file) => (
            <div key={file.id} className="relative rounded-lg overflow-hidden bg-gray-800 aspect-square">
              {file.type.startsWith('video/') ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-8 h-8 text-gray-500" />
                </div>
              ) : (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(file)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 
                           flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              {/* Size label */}
              <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/60 px-1 rounded">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
