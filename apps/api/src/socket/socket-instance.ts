import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@free2talk/shared';

let socketInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function setSocketInstance(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    socketInstance = io;
}

export function getSocketInstance(): Server<ClientToServerEvents, ServerToClientEvents> | null {
    return socketInstance;
}
