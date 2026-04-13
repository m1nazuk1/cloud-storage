import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { groupApi } from '../api/group';

function wsBaseUrl(): string {
    const raw = import.meta.env.VITE_WS_URL as string | undefined;
    if (raw !== undefined && raw !== '') {
        return raw.replace(/\/$/, '');
    }
    return '';
}

export function useGroupPresence(groupId: string | undefined): string[] {
    const [onlineIds, setOnlineIds] = useState<string[]>([]);

    useEffect(() => {
        if (!groupId) {
            return;
        }
        let client: Client | null = null;
        let intervalId: number | undefined;
        let cancelled = false;

        const token = localStorage.getItem('access_token');
        if (!token) {
            return;
        }

        void groupApi.getOnlineUserIds(groupId).then((ids) => {
            if (!cancelled) {
                setOnlineIds(ids);
            }
        }).catch(() => {
            void 0;
        });

        const base = wsBaseUrl();
        const url = base ? `${base}/ws` : '/ws';

        client = new Client({
            webSocketFactory: () => new SockJS(url) as WebSocket,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                if (!client || cancelled) {
                    return;
                }
                client.subscribe(`/topic/group.${groupId}.presence`, (message) => {
                    try {
                        const rawBody = message.body;
                        const parsed = JSON.parse(rawBody) as unknown;
                        if (Array.isArray(parsed)) {
                            setOnlineIds(parsed.map(String));
                        }
                    }
                    catch {
                        void 0;
                    }
                });
                const ping = () => {
                    if (client?.connected) {
                        client.publish({ destination: `/app/presence.ping/${groupId}` });
                    }
                };
                ping();
                intervalId = window.setInterval(ping, 20000);
            },
        });
        client.activate();

        return () => {
            cancelled = true;
            if (intervalId !== undefined) {
                window.clearInterval(intervalId);
            }
            client?.deactivate();
        };
    }, [groupId]);

    return onlineIds;
}
