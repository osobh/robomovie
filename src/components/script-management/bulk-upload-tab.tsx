import { Upload } from "lucide-react";

export function BulkUploadTab() {
  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6">
      <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-gray-600 hover:border-gray-500">
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400 mb-2">
          Drag and drop multiple script images or documents here
        </p>
        <p className="text-sm text-gray-500">Supports: JPG, PNG, PDF, DOCX</p>
        <p className="text-sm text-gray-500 mt-2">
          Files will be processed using GPT-4 Vision and OCR
        </p>
      </div>
    </div>
  );
}
