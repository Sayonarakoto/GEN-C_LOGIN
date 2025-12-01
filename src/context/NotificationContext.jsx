import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../hooks/useAuth'; // Import useAuth
import { socket } from '../socket'; // Import the global socket instance

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth(); // Get user from auth context

  const addNotification = useCallback((message, type = 'info', link = null) => {
    const newNotification = {
      id: uuidv4(),
      message,
      type,
      link,
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  useEffect(() => {
    if (!user) {
      // If user logs out, disconnect the socket and clear notifications
      if (socket.connected) {
        socket.disconnect();
      }
      setNotifications([]);
      return;
    }

    // If user is authenticated, ensure socket is connected and authenticate
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('authenticate', user.id);

    const handleNewNotification = (notification) => {
      console.log('Received new notification:', notification);
      addNotification(notification.message, notification.type, notification.link);
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
      // Do NOT disconnect the global socket here, as it might be used elsewhere
      // The global socket manages its own connection/disconnection based on autoConnect
    };
  }, [user, addNotification]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};