import React, { useState, useRef } from "react";

interface Game {
  id?: string;
  name: string;
  owner: string;
  password?: string;
  players?: string[];
  status?: string;
  enemies?: string[];
  currentRound?: string;
}

interface JoinGameProps {
  selectedGame: Game | null;
  onJoinGame: (gameId: string, playerName: string, password: string) => void;
  onCancel: () => void;
  playerNameRef: React.RefObject<HTMLInputElement>;
}

export const joinGame = async (
  gameId: string,
  playerName: string,
  password: string
) => {
  try {
    const gameData: any = {
      "Content-Type": "application/json",
      accept: "application/json",
      player: playerName,
    };

    if (password?.trim()) {
      gameData.password = password.trim();
    }

    const bodyData = { player: playerName };
    const joinResponse = await fetch(
      `https://contaminados.akamai.meseguercr.com/api/games/${gameId}`,
      {
        method: "PUT",
        headers: gameData,
        body: JSON.stringify(bodyData),
      }
    );

    if (joinResponse.ok) {
      const result = await joinResponse.json();
      return { success: true, data: result.data };
    } else if (joinResponse.status === 409) {
      return {
        success: false,
        error: "Ya hay un jugador con ese nombre en la partida",
      };
    } else {
      const errorResult = await joinResponse.json();
      return {
        success: false,
        error: errorResult.msg || "Error al unirse a la partida",
      };
    }
  } catch (error) {
    return { success: false, error: "Error en la petición: " + error };
  }
};

const JoinGame: React.FC<JoinGameProps> = ({
  selectedGame,
  onJoinGame,
  onCancel,
  playerNameRef,
}) => {
  const [playerName, setPlayerName] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessageLocal] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedGame && selectedGame.id) {
      onJoinGame(selectedGame.id, playerName, gamePassword);
    }
  };

  if (!selectedGame) {
    return <div>No game selected</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <h2>Unirse a la Partida: {selectedGame.name}</h2>
      <div className="mb-3">
        <label className="form-label">Nombre de Jugador</label>
        <input
          type="text"
          className="form-control"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
          ref={playerNameRef}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Contraseña (si es necesaria)</label>
        <input
          type="password"
          className="form-control"
          value={gamePassword}
          onChange={(e) => setGamePassword(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Unirse
      </button>
      <button
        type="button"
        className="btn btn-secondary ms-2"
        onClick={onCancel}
      >
        Cancelar
      </button>
    </form>
  );
};

export default JoinGame;
