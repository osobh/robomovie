import { FileText } from "lucide-react";

export function ScriptEditorTab() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Script List Sidebar */}
      <div className="col-span-1 bg-[#1A1A1A] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Scripts
        </h3>
        <div className="space-y-2">
          {/* Placeholder script items */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded hover:bg-[#2A2A2A] cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#1ABC9C]" />
              <div>
                <p className="text-sm text-white">Example Script {i}</p>
                <p className="text-xs text-gray-400">Modified 2h ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="col-span-3 bg-[#1A1A1A] rounded-lg p-4">
        <div className="h-[600px] bg-[#2A2A2A] rounded border border-[#3A3A3A] p-4">
          <p className="text-gray-400 text-center mt-[250px]">
            Monaco Editor will be integrated here with screenplay format syntax
            highlighting
          </p>
        </div>
      </div>
    </div>
  );
}
