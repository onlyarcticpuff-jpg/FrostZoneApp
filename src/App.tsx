import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  return (
    <div className="app">
      <div className="overlay" />

      <div className="content">
        <h1>❄️ FrostLab</h1>

        <p className="subtitle">
          Frozen TON ecosystem hub
        </p>

        <div className="card">
          <h2>Telegram User</h2>

          {user ? (
            <>
              <p>{user.first_name}</p>
              <p>@{user.username}</p>
            </>
          ) : (
            <p>Open inside Telegram</p>
          )}
        </div>

        <button className="button">
          Connect TON Wallet
        </button>
      </div>
    </div>
  );
}
