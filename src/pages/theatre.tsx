import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function Theatre() {
  const [videoUrl] = useState<string | null>('https://example.com/sample-movie.mp4'); // Replace with actual video URL

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = ''; // This will use the original filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FFA500]">Theatre</h1>
        <p className="text-lg text-gray-300 mt-2">Watch and download your finished movie.</p>
      </div>

      <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full rounded-md"
          >
            Your browser does not support the video element.
          </video>
        ) : (
          <div className="aspect-video bg-[#2A2A2A] rounded-md flex items-center justify-center">
            <p className="text-gray-400">No video available</p>
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="bg-[#1ABC9C] hover:bg-[#1ABC9C]/90 text-white"
        onClick={handleDownload}
        disabled={!videoUrl}
      >
        <Download className="w-5 h-5 mr-2" />
        Download Movie
      </Button>
    </div>
  );
}
