import React, { useState, useEffect } from "react";

interface Game {
  name: string;
  owner: string;
  password?: string;
  id?: string;
  players?: string[];
  status?: string;
  enemies?: string[];
  currentRound?: string;
}

interface GameDetailsProps {
  selectedGame: Game;
  playerName: string;
  gamePassword: string;
  isOwner: boolean;
  view: string;
  setView: (view: string) => void;
  setSelectedGame: (game: []) => void;
}

const GameDetails: React.FC<GameDetailsProps> = ({
  selectedGame,
  playerName,
  gamePassword,
  isOwner,
  view,
  setView,
  setSelectedGame,
}) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (selectedGame) {
        handleRefreshGame();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Clean up on component unmount
  }, [selectedGame, view]);

  const handleRefreshGame = async () => {
    if (!playerName) {
      alert(
        "El nombre del jugador es requerido para refrescar la información del juego."
      );
      return;
    }

    // Configura los headers de manera condicional
    const headers: HeadersInit = {
      accept: "application/json",
      player: playerName,
    };

    if (gamePassword && gamePassword.trim()) {
      headers.password = gamePassword.trim();
    }

    try {
      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${selectedGame.id}`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (response.ok) {
        const result: { data: Game } = await response.json();
        setSelectedGame(result.data);

        if (result.data.status === "rounds") {
          setView("gameStarted");
        }
      } else {
        alert("Error al refrescar el juego");
      }
    } catch (error) {
      alert("Error al refrescar el juego: " + error);
      throw new Error("Error al refrescar el juego:" + error);
    }
  };

  const handleStartGameErrors = (response: Response) => {
    if (response.status === 401) {
      alert("No autorizado para iniciar el juego.");
    } else if (response.status === 403) {
      alert("Acceso prohibido.");
    } else if (response.status === 404) {
      alert("Juego no encontrado.");
    } else if (response.status === 409) {
      alert("El juego ya ha sido iniciado.");
    } else if (response.status === 428) {
      alert("Se necesitan al menos 5 jugadores para iniciar el juego.");
    } else {
      alert("Error desconocido al intentar iniciar el juego.");
    }
  };

  const handleStartGame = async () => {
    if (!selectedGame || !selectedGame.players) {
      alert("No hay información suficiente sobre los jugadores.");
      return;
    }

    const playerCount = selectedGame.players.length;

    if (playerCount < 2) {
      alert("Se necesitan al menos 2 jugadores para iniciar el juego.");
      return;
    }

    if (playerCount > 10) {
      alert("No puede haber más de 10 jugadores en el juego.");
      return;
    }

    // Configura los headers de manera condicional
    const headers: HeadersInit = {
      accept: "application/json",
      player: playerName,
    };

    if (gamePassword && gamePassword.trim()) {
      headers.password = gamePassword.trim();
    }

    try {
      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${selectedGame.id}/start`,
        {
          method: "HEAD", // El método es HEAD
          headers: headers,
        }
      );

      if (response.ok) {
        alert("Juego iniciado correctamente");
        handleRefreshGame();

        setView("gameStarted");
      } else {
        handleStartGameErrors(response);
      }
    } catch (error) {
      alert("Error al iniciar el juego: " + error);
      throw new Error("Error en la petición:" + error);
    }
  };

  return (
    <div className="mt-4">
      <h2>Detalles de la Partida: {selectedGame.name}</h2>
      <p>Propietario: {selectedGame.owner}</p>
      <p>Estado: {selectedGame.status}</p>
      <p>Contraseña: {selectedGame.password ? "Sí" : "No"}</p>
      <p>Ronda Actual: {selectedGame.currentRound}</p>
      <h3>Jugadores:</h3>
      {selectedGame.players && selectedGame.players.length > 0 ? (
        <ul>
          {selectedGame.players.map((player, index) => (
            <li key={index}>{player}</li>
          ))}
        </ul>
      ) : (
        <p>No hay jugadores en la partida.</p>
      )}
      <h3>Enemigos:</h3>
      {selectedGame.enemies && selectedGame.enemies.length > 0 ? (
        <ul>
          {selectedGame.enemies.map((enemy, index) => (
            <li key={index}>{enemy}</li>
          ))}
        </ul>
      ) : (
        <p>No hay enemigos en la partida.</p>
      )}
      <div className="d-flex justify-content-between mt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setView("list")}
        >
          Volver a la Lista
        </button>
        <button
          type="button"
          className="btn btn-info"
          onClick={handleRefreshGame}
        >
          Refrescar Información
        </button>
        {isOwner && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartGame}
          >
            Iniciar Juego
          </button>
        )}
      </div>
    </div>
  );
};

export default GameDetails;
