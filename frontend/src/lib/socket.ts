import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (!socket) {
    const { io } = await import('socket.io-client');
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export async function connectSocket() {
  if (typeof window === 'undefined') return;
  const s = await getSocket();
  const token = localStorage.getItem('accessToken');
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
}

export async function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
