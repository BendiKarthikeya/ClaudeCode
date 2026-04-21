import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@syncjam/shared';
import { getRealtimeUrl } from './realtime-url';

export type SyncSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: SyncSocket | null = null;
let socketUrl: string | null = null;

export function getSocket(): SyncSocket {
  const url = getRealtimeUrl();
  if (socket && socketUrl === url) return socket;
  if (socket) socket.disconnect();
  socketUrl = url;
  socket = io(url, { transports: ['websocket'], autoConnect: true });
  return socket;
}
