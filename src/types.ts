export type ClientMessage =
  | { type: 'login'; userId: string }
  | { type: 'message'; from: string; to: string; content: string }

export type ServerMessage =
  | { type: 'message'; from: string; content: string }
  | { type: 'error'; message: string }

export type Message = { from: string; content: string }