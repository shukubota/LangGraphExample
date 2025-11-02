'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '@/types';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sessionId: string | null;
  sendMessage: (message: any) => void;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
}

export function useWebSocket(url: string = 'http://localhost:5001'): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('Connecting to WebSocket server:', url);
    
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      setSessionId(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Session established:', data.session_id);
      setSessionId(data.session_id);
      
      // セッションIDをローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('session_id', data.session_id);
      }
    });

    newSocket.on('session_joined', (data) => {
      console.log('Joined session:', data.session_id);
    });

    newSocket.on('graph_update', (data: WebSocketMessage) => {
      console.log('Received graph update:', data.type);
      setLastMessage(data);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      console.log('Cleaning up WebSocket connection');
      newSocket.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message', message);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [isConnected]);

  return {
    socket,
    isConnected,
    sessionId,
    sendMessage,
    lastMessage,
    connectionError,
  };
}