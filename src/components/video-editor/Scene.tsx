import { useRef, useEffect, useState } from 'react';
import { SceneComposition } from './SceneComposition';

export function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative flex items-center justify-center">
      <div className="w-full max-h-[calc(50vh-4rem)] aspect-video">
        {dimensions.width > 0 && dimensions.height > 0 && (
          <SceneComposition 
            width={dimensions.width} 
            height={dimensions.height}
          />
        )}
      </div>
    </div>
  );
}
