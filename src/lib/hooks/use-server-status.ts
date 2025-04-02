import { useEffect } from "react";
import { useStore } from "../store";
import { getBackendUrl } from "../utils";

export function useServerStatus() {
  const isServerRunning = useStore((state) => state.server.isRunning);
  const setServerStatus = useStore((state) => state.setServerStatus);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const baseUrl = getBackendUrl();
        const response = await fetch(`${baseUrl}/api/health`);
        setServerStatus(response.ok);
      } catch (error) {
        console.error("Server health check failed:", error);
        setServerStatus(false);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);

    return () => clearInterval(interval);
  }, [setServerStatus]);

  return isServerRunning;
}
