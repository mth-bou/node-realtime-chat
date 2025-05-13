import { useState } from "react";
import Chat from "./Chat";

const App = () => {
  const [username, setUsername] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);

  const handleConnect = () => {
    if (username.trim()) setConnected(true);
  };

  return connected ? (
    <Chat username={username} />
  ) : (
    <div style={{ padding: 40 }}>
      <h1>Connexion</h1>
      <input
        placeholder="Ton pseudo"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleConnect}>Entrer</button>
    </div>
  );
}

export default App;
