import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client'; // Import socket.io-client
import { useAuth } from '../hooks/useAuth'; // Import useAuth

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
    if (!user) return; // Don't connect if user is not authenticated

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000'); // Changed this line

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socket.emit('authenticate', user.id);
    });

    socket.on('newNotification', (notification) => {
      console.log('Received new notification:', notification);
      addNotification(notification.message, notification.type, notification.link);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    return () => {
      socket.disconnect();
    };
  }, [user, addNotification]); // Reconnect if user changes or addNotification changes

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