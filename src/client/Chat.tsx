import { useRef, useState, useEffect } from "react";
import { ClientMessage, ServerMessage } from "./types";

type ChatProps = {
  username: string;
}

const Chat = ({ username }: ChatProps) => {
  const [to, setTo] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [messages, setMessages] = useState<ServerMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    wsRef.current = ws;

    ws.onopen = () => {
      const login: ClientMessage = { type: 'login', userId: username };
      ws.send(JSON.stringify(login));
    }

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    }

    return () => ws.close();
  }, [username]);

  const sendMessage = () => {
    if (!to.trim() || !content.trim()) return;
    const message: ClientMessage = {
      type: 'message',
      from: username,
      to,
      content,
    };

    wsRef.current?.send(JSON.stringify(message));
    setMessages(prev => [...prev, { type: 'message', from: username, content }]);
    setContent('');
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Connecté en tant que : {username}</h2>

      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Envoyer à (pseudo)..."
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          placeholder="Message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={sendMessage}>Envoyer</button>
      </div>

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>
            {msg.type === 'message' ? (
              <>
                <strong>{msg.from}:</strong> {msg.content}
              </>
            ) : (
              <em>Erreur : {msg.message}</em>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Chat;
