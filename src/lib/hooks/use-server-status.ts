import { useEffect } from 'react';
import { useStore } from '../store';

export function useServerStatus() {
  const isServerRunning = useStore((state) => state.server.isRunning);
  const setServerStatus = useStore((state) => state.setServerStatus);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        setServerStatus(response.ok);
      } catch (error) {
        setServerStatus(false);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);

    return () => clearInterval(interval);
  }, [setServerStatus]);

  return isServerRunning;
}
