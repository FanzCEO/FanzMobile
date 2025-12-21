import { useState } from "react";
import { FileUpload, FileWithPreview } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadsApi } from "@/lib/api/uploads";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  original_filename: string;
  content_type: string;
  size: number;
}

export function FileUploadDemo() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (filesToUpload: File[]) => {
    setIsUploading(true);
    try {
      const uploadPromises = filesToUpload.map((file) =>
        uploadsApi.upload(file, "profile")
      );

      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results]);

      toast.success(`${results.length} file(s) uploaded successfully`);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await uploadsApi.delete(fileId);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted");
    } catch (error: unknown) {
      console.error("Delete error:", error);
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>
            Upload images, documents, and other files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            value={files}
            onChange={setFiles}
            onUpload={handleUpload}
            accept="image/jpeg,image/png,image/gif,application/pdf,.doc,.docx"
            maxSize={10 * 1024 * 1024}
            maxFiles={5}
            multiple={true}
            showPreview={true}
          />
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Files uploaded to the server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.original_filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.content_type} • {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(uploadsApi.getFileUrl(file.id), "_blank")}
                    >
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
