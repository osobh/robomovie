import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerateScript } from "./generate-script";
import { BulkUploadTab } from "@/components/script-management/bulk-upload-tab";
import { ScriptEditorTab } from "@/components/script-management/script-editor-tab";

export function ScriptManagement() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "generate";
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-[#FFA500]">
        Script Management
      </h1>
      <p className="text-lg mb-8 text-gray-300">
        Create, upload, and edit your scripts.
      </p>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-[#1A1A1A] border border-[#2A2A2A]">
          <TabsTrigger
            value="generate"
            className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white"
          >
            Generate Script
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white"
          >
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white"
          >
            Script Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <GenerateScript />
        </TabsContent>

        <TabsContent value="upload">
          <BulkUploadTab />
        </TabsContent>

        <TabsContent value="editor">
          <ScriptEditorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
