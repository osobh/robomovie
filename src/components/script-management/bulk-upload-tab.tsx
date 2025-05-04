import { useState, useRef } from "react";
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface UploadProgress {
  id: string;
  fileName: string;
  status: "uploading" | "processing" | "complete" | "error";
  progress: number;
  currentPage?: number;
  totalPages?: number;
  stage?: string;
  error?: string;
  textPath?: string;
}

export function BulkUploadTab() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const acceptedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = newFiles.filter((file) =>
      acceptedTypes.includes(file.type)
    );

    if (validFiles.length !== newFiles.length) {
      setError(
        "Some files were skipped. Only JPG, PNG, PDF, and DOCX files are allowed."
      );
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, index: number) => {
    if (!user) return;

    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Start upload
      setUploadProgress((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${index}`,
          fileName: file.name,
          status: "uploading",
          progress: 0,
        },
      ]);

      const response = await fetch(`${API_URL}/api/process-documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { jobId } = await response.json();

      // Poll for processing status
      const pollStatus = async () => {
        const statusResponse = await fetch(
          `${API_URL}/api/process-status/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error("Failed to get processing status");
        }

        const status = await statusResponse.json();

        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name
              ? {
                  ...p,
                  status: status.status,
                  progress: status.progress,
                  textPath: status.textPath,
                  error: status.error,
                }
              : p
          )
        );

        if (status.status === "processing") {
          setTimeout(pollStatus, 2000);
        }
      };

      await pollStatus();
    } catch (err) {
      setUploadProgress((prev) =>
        prev.map((p) =>
          p.fileName === file.name
            ? {
                ...p,
                status: "error",
                error:
                  err instanceof Error ? err.message : "Failed to upload file",
              }
            : p
        )
      );
    }
  };

  const handleUpload = async () => {
    if (!user || files.length === 0) return;

    // Upload each file
    files.forEach((file, index) => {
      uploadFile(file, index);
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-[#1ABC9C]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? "border-[#FFA500] bg-[#FFA500]/10"
              : "border-gray-600 hover:border-gray-500"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400 mb-2">
          Drag and drop multiple script images or documents here
        </p>
        <p className="text-sm text-gray-500">Supports: JPG, PNG, PDF, DOCX</p>
        <p className="text-sm text-gray-500 mt-2">
          Files will be processed using GPT-4 Vision and OCR
        </p>
      </div>

      {/* File List with Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-4">
          {uploadProgress.map((progress) => (
            <div
              key={progress.id}
              className="bg-[#1A1A1A] rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(progress.status)}
                  <span className="text-sm text-white">
                    {progress.fileName}
                  </span>
                </div>
                {progress.status !== "complete" && (
                  <button
                    onClick={() =>
                      removeFile(
                        uploadProgress.findIndex((p) => p.id === progress.id)
                      )
                    }
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <Progress value={progress.progress} className="h-1" />
                {progress.status === "processing" && progress.stage && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{progress.stage}</span>
                    {progress.currentPage && progress.totalPages && (
                      <span>
                        Page {progress.currentPage} of {progress.totalPages}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {progress.status === "error" && progress.error && (
                <p className="text-sm text-red-500">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-4 text-red-500">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && uploadProgress.length === 0 && (
        <Button
          onClick={handleUpload}
          className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90"
        >
          Process {files.length} file{files.length === 1 ? "" : "s"}
        </Button>
      )}

      {/* Open in Editor Button */}
      {uploadProgress.some((p) => p.status === "complete") && (
        <Button
          onClick={() => {
            /* TODO: Navigate to editor */
          }}
          className="w-full bg-[#FFA500] hover:bg-[#FFA500]/90"
        >
          Open in Script Editor
        </Button>
      )}
    </div>
  );
}
