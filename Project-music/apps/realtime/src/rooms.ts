import type { RoomState, PlaybackState, QueueItem, Participant } from '@syncjam/shared';

const rooms = new Map<string, RoomState>();

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export function createRoom(hostSocketId: string): RoomState {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();
  const state: RoomState = {
    code,
    hostId: hostSocketId,
    playback: {
      videoId: null,
      positionMs: 0,
      isPlaying: false,
      updatedAt: Date.now(),
    },
    tracks: [],
    currentIndex: -1,
    participants: [],
  };
  rooms.set(code, state);
  return state;
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code.toUpperCase());
}

export function addParticipant(code: string, p: Participant): RoomState | undefined {
  const room = rooms.get(code);
  if (!room) return;
  room.participants = room.participants.filter((x) => x.id !== p.id);
  room.participants.push(p);
  if (!room.hostId || !room.participants.find((x) => x.id === room.hostId)) {
    room.hostId = p.id;
    p.isHost = true;
  }
  return room;
}

export function removeParticipant(code: string, id: string): RoomState | undefined {
  const room = rooms.get(code);
  if (!room) return;
  room.participants = room.participants.filter((p) => p.id !== id);
  if (room.participants.length === 0) {
    rooms.delete(code);
    return;
  }
  if (room.hostId === id) {
    const next = room.participants[0];
    next.isHost = true;
    room.hostId = next.id;
  }
  return room;
}

export function updatePlayback(
  code: string,
  update: Partial<PlaybackState>,
): PlaybackState | undefined {
  const room = rooms.get(code);
  if (!room) return;
  room.playback = { ...room.playback, ...update, updatedAt: Date.now() };
  return room.playback;
}

type QueueResult = {
  tracks: QueueItem[];
  currentIndex: number;
  playback: PlaybackState;
  started: boolean;
};

export function addToQueue(code: string, item: QueueItem): QueueResult | undefined {
  const room = rooms.get(code);
  if (!room) return;
  room.tracks.push(item);
  if (room.currentIndex === -1) {
    room.currentIndex = room.tracks.length - 1;
    room.playback = {
      videoId: item.videoId,
      positionMs: 0,
      isPlaying: true,
      updatedAt: Date.now(),
    };
    return { tracks: room.tracks, currentIndex: room.currentIndex, playback: room.playback, started: true };
  }
  return { tracks: room.tracks, currentIndex: room.currentIndex, playback: room.playback, started: false };
}

export function jumpToIndex(
  code: string,
  index: number,
): { tracks: QueueItem[]; currentIndex: number; playback: PlaybackState } | undefined {
  const room = rooms.get(code);
  if (!room) return;
  if (index < 0 || index >= room.tracks.length) return;
  room.currentIndex = index;
  const picked = room.tracks[index];
  room.playback = {
    videoId: picked.videoId,
    positionMs: 0,
    isPlaying: true,
    updatedAt: Date.now(),
  };
  return { tracks: room.tracks, currentIndex: room.currentIndex, playback: room.playback };
}

export function skipTrack(
  code: string,
): { tracks: QueueItem[]; currentIndex: number; playback: PlaybackState } | undefined {
  const room = rooms.get(code);
  if (!room) return;
  const nextIndex = room.currentIndex + 1;
  if (nextIndex >= room.tracks.length) {
    room.currentIndex = room.tracks.length;
    room.playback = {
      videoId: null,
      positionMs: 0,
      isPlaying: false,
      updatedAt: Date.now(),
    };
    return { tracks: room.tracks, currentIndex: room.currentIndex, playback: room.playback };
  }
  room.currentIndex = nextIndex;
  const next = room.tracks[nextIndex];
  room.playback = {
    videoId: next.videoId,
    positionMs: 0,
    isPlaying: true,
    updatedAt: Date.now(),
  };
  return { tracks: room.tracks, currentIndex: room.currentIndex, playback: room.playback };
}
