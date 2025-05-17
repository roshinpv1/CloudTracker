import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Notification, useNotification } from '../context/NotificationContext';

const ToastNotification: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <Toast 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
};

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const { type, message } = notification;

  const bgColor = {
    success: 'bg-green-100 border-green-500',
    error: 'bg-red-100 border-red-500',
    warning: 'bg-yellow-100 border-yellow-500',
    info: 'bg-blue-100 border-blue-500'
  }[type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }[type];

  return (
    <div 
      className={`${bgColor} ${textColor} px-4 py-3 rounded-md shadow-md border-l-4 min-w-[300px] max-w-md flex items-start justify-between transition-all duration-300 ease-in-out`}
      role="alert"
    >
      <div className="flex items-start">
        <Icon className="h-5 w-5 mr-3 mt-0.5" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="ml-4 text-gray-500 hover:text-gray-700"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastNotification; 