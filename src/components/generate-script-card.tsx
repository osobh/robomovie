import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

export function GenerateScriptCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Generate Scripts</h2>
      <p className="text-gray-300 mb-6">Create custom scripts using AI assistance. Generate professional screenplays with customizable settings.</p>
      <Button 
        className="w-full bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
        onClick={() => navigate('/script')}
      >
        <Wand2 className="w-5 h-5 mr-2" />
        Generate New Script
      </Button>
    </div>
  );
}
