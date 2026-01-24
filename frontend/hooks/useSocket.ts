import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext'; // Припускаю, у вас є AuthContext

export const useSocket = (onMessage: (data: any) => void) => {
    const { token } = useAuth(); // Потрібен токен для авторизації, якщо використовуєте JWT в query params або cookies
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Якщо використовуєте cookies для auth, токен в URL не обов'язковий, Django Channels зчитає сесію
        const ws = new WebSocket('ws://localhost:8000/ws/notifications/');

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        socketRef.current = ws;

        return () => {
            ws.close();
        };
    }, [token, onMessage]);

    return socketRef.current;
};