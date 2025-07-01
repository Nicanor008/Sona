export interface TranscriptMessage {
  id: string;
  text?: string;
  role: 'user' | 'system' | 'assistant';
  isFinal: boolean;
}

export interface Voice {
  provider: string;
  voiceId: string;
}

export interface SavedConversation {
  id: string | number;
  dateCreated: string;
  duration: string;
  interview: TranscriptMessage[];
  startTime: number;
  endTime?: number;
  messageCount: number;
}
