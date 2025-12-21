import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinGroup: (groupId: string) => void;
    leaveGroup: (groupId: string) => void;
    sendMessage: (groupId: string, content: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const socketInstance = io('http://localhost:8080', {
            path: '/ws',
            transports: ['websocket', 'polling'],
            withCredentials: true,
            auth: {
                token: localStorage.getItem('access_token'),
            },
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    const joinGroup = (groupId: string) => {
        if (socket && isConnected) {
            socket.emit('join', { groupId });
        }
    };

    const leaveGroup = (groupId: string) => {
        if (socket && isConnected) {
            socket.emit('leave', { groupId });
        }
    };

    const sendMessage = (groupId: string, content: string) => {
        if (socket && isConnected) {
            socket.emit('chat.send', { groupId, content });
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, joinGroup, leaveGroup, sendMessage }}>
            {children}
        </SocketContext.Provider>
    );
};