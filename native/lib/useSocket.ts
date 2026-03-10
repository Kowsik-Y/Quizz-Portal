import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

export function useSocket(testId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState<any>(null);

  useEffect(() => {
    if (!testId) return;

    // Derive WebSocket URL from API_URL by removing the /api path
    const wsUrl = API_URL.replace(/\/api\/?$/, '');
    
    console.log(`🔌 Connecting to WebSocket at ${wsUrl}`);
    
    // Initialize socket connection
    const newSocket = io(wsUrl, {
      transports: ['websocket'], // Use WebSocket first, fallback to polling
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Event listeners
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setIsConnected(true);
      
      // Join the test room to receive updates
      newSocket.emit('join-test', testId);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('live-update', (data) => {
      console.log('📥 Received live update via WebSocket');
      setLatestData(data);
    });

    // Cleanup on unmount or testId change
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (newSocket.connected) {
        newSocket.emit('leave-test', testId);
      }
      newSocket.disconnect();
    };
  }, [testId]);

  return { socket, isConnected, latestData };
}
