export interface CompletionChunk {
  model: string;
  createdAt: Date;
  response: string;
  done: boolean;
  doneReason?: string;
}

export interface ImageResponse {
  url: string;
}
