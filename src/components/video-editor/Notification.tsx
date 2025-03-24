import { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  duration?: number;
  onClose: () => void;
  index: number;
}

export function Notification({ message, duration = 2000, onClose, index }: NotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, duration - 200); // Start fade out animation 200ms before closing

    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div 
      style={{
        bottom: `${2 + (index * 3)}rem`,
      }}
      className={`
        fixed left-1/2 transform -translate-x-1/2 
        bg-[#2A2A2A] text-white px-4 py-2 rounded-lg shadow-lg z-50 
        transition-all duration-200
        ${isClosing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        animate-fade-in
      `}
    >
      {message}
    </div>
  );
}

interface NotificationState {
  message: string;
  id: number;
  index: number;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [counter, setCounter] = useState(0);

  const show = (message: string) => {
    const id = counter;
    setCounter(prev => prev + 1);
    setNotifications(prev => [...prev, { message, id, index: prev.length }]);
  };

  const hide = (id: number) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      // Update indices after removal
      return filtered.map((n, i) => ({ ...n, index: i }));
    });
  };

  return {
    notifications,
    show,
    hide,
  };
}
