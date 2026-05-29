import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: { isOnline, lastSeen } }

  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      const socketConn = io('http://localhost:5000', {
        auth: {
          token: token,
        },
      });

      setSocket(socketConn);

      socketConn.on('connect', () => {
        console.log('Connected to socket server');
      });

      // Listen for online status updates of users
      socketConn.on('user-status', ({ userId, isOnline, lastSeen }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: { isOnline, lastSeen },
        }));
      });

      return () => {
        socketConn.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
