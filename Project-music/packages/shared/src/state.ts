export interface PlaybackState {
  videoId: string | null;
  positionMs: number;
  isPlaying: boolean;
  updatedAt: number;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

export interface QueueItem {
  videoId: string;
  title: string;
  thumbnail: string;
  addedBy: string;
}

export interface RoomState {
  code: string;
  hostId: string;
  playback: PlaybackState;
  tracks: QueueItem[];
  currentIndex: number;
  participants: Participant[];
  allowAllControl: boolean;
}
