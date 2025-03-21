import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Film } from 'lucide-react';

export function MovieCreation() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-[#FFA500]">Movie Creation</h1>
      <p className="text-lg text-gray-300">Transform your scenes into a visual story.</p>
    </div>
  );
}
