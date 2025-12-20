import * as React from "react";
import { Upload, X, File, FileImage, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface FileUploadProps {
  value?: FileWithPreview[];
  onChange?: (files: FileWithPreview[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

export interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  uploaded?: boolean;
  error?: string;
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      value = [],
      onChange,
      onUpload,
      accept = "image/jpeg,image/png,image/gif,application/pdf,.doc,.docx",
      maxSize = 10 * 1024 * 1024, // 10MB default
      maxFiles = 5,
      multiple = true,
      disabled = false,
      className,
      showPreview = true,
    },
    ref
  ) => {
    const [files, setFiles] = React.useState<FileWithPreview[]>(value);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      setFiles(value);
    }, [value]);

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const validateFile = (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        return `File size must be less than ${formatFileSize(maxSize)}`;
      }

      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim());
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const isAccepted = acceptedTypes.some(
          (type) =>
            type === file.type ||
            type === fileExtension ||
            (type.endsWith("/*") && file.type.startsWith(type.slice(0, -2)))
        );

        if (!isAccepted) {
          return "File type not accepted";
        }
      }

      return null;
    };

    const processFiles = async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const newFiles: FileWithPreview[] = [];
      const maxAllowed = multiple ? maxFiles : 1;

      for (let i = 0; i < Math.min(fileList.length, maxAllowed - files.length); i++) {
        const file = fileList[i];
        const error = validateFile(file);

        const fileWithPreview: FileWithPreview = Object.assign(file, {
          preview: undefined,
          progress: 0,
          uploaded: false,
          error,
        });

        // Generate preview for images
        if (file.type.startsWith("image/")) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        newFiles.push(fileWithPreview);
      }

      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onChange?.(updatedFiles);

      // Auto-upload if onUpload is provided
      if (onUpload && newFiles.filter((f) => !f.error).length > 0) {
        await handleUpload(newFiles.filter((f) => !f.error));
      }
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      await processFiles(droppedFiles);
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      await processFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    const handleUpload = async (filesToUpload: FileWithPreview[]) => {
      if (!onUpload) return;

      setIsUploading(true);
      try {
        await onUpload(filesToUpload);

        // Mark files as uploaded
        setFiles((prev) =>
          prev.map((f) => {
            if (filesToUpload.includes(f)) {
              return { ...f, uploaded: true, progress: 100 };
            }
            return f;
          })
        );
      } catch (error) {
        console.error("Upload failed:", error);
        // Mark files with error
        setFiles((prev) =>
          prev.map((f) => {
            if (filesToUpload.includes(f)) {
              return { ...f, error: "Upload failed", progress: 0 };
            }
            return f;
          })
        );
      } finally {
        setIsUploading(false);
      }
    };

    const removeFile = (index: number) => {
      const file = files[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onChange?.(updatedFiles);
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const getFileIcon = (file: File) => {
      if (file.type.startsWith("image/")) {
        return <FileImage className="h-8 w-8 text-blue-500" />;
      } else if (file.type.startsWith("application/pdf")) {
        return <FileText className="h-8 w-8 text-red-500" />;
      } else {
        return <File className="h-8 w-8 text-gray-500" />;
      }
    };

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInputChange}
            disabled={disabled || (files.length >= maxFiles && multiple)}
            className="sr-only"
            id="file-upload-input"
          />
          <label
            htmlFor="file-upload-input"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 p-8 text-center",
              disabled && "cursor-not-allowed"
            )}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                {accept && `Accepted: ${accept}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Max size: {formatFileSize(maxSize)} | Max files: {maxFiles}
              </p>
            </div>
          </label>
        </div>

        {showPreview && files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Files ({files.length})</p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    getFileIcon(file)
                  )}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-500">{file.error}</p>
                    )}
                    {file.progress !== undefined && file.progress > 0 && !file.uploaded && (
                      <Progress value={file.progress} className="h-1" />
                    )}
                    {file.uploaded && (
                      <p className="text-xs text-green-600">Uploaded</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={disabled || isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading files...</span>
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";
