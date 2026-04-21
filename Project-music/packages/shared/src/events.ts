import type { PlaybackState, QueueItem, RoomState } from './state.js';

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  at: number;
}

export interface ServerToClientEvents {
  ROOM_STATE: (state: RoomState) => void;
  PLAYBACK_UPDATE: (playback: PlaybackState) => void;
  QUEUE_UPDATE: (tracks: QueueItem[], currentIndex: number) => void;
  PARTICIPANT_JOINED: (participantId: string, name: string) => void;
  PARTICIPANT_LEFT: (participantId: string) => void;
  CHAT_MESSAGE: (message: ChatMessage) => void;
  ERROR: (message: string) => void;
}

export interface ClientToServerEvents {
  JOIN_ROOM: (code: string, name: string, ack: (state: RoomState | null) => void) => void;
  PLAYBACK_CONTROL: (action: 'play' | 'pause' | 'seek', positionMs: number) => void;
  QUEUE_ADD: (item: QueueItem) => void;
  QUEUE_SKIP: () => void;
  QUEUE_JUMP: (index: number) => void;
  HEARTBEAT: (ack: (serverNow: number, playback: PlaybackState) => void) => void;
  CHAT_SEND: (text: string) => void;
}
