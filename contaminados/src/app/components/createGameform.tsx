"use client";
import React, { useState } from "react";

interface Game {
  name: string;
  owner: string;
  password?: string;
}

interface ApiResponse {
  status: number;
  msg: string;
  data: Game;
  others: any;
}

interface createGameFormProps {
  onGameCreated: (game: Game, password: string) => void;
  onCancel: () => void;
  setErrorMessage: (message: string) => void;
}

const createGameForm: React.FC<createGameFormProps> = ({
  onGameCreated,
  onCancel,
  setErrorMessage,
}) => {
  const [gameDetails, setGameDetails] = useState<Game>({
    name: "",
    owner: "",
    password: "",
  });

  const createGame = async (game: Game) => {
    try {
      // Aquí aseguramos que si no hay contraseña, se envíe como ""
      const gameData: any = {
        name: game.name,
        owner: game.owner,
      };

      if (game.password?.trim()) {
        gameData.password = game.password.trim();
      }
      const response = await fetch(
        "https://contaminados.akamai.meseguercr.com/api/games",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gameData),
        }
      );

      if (response.ok) {
        const result: ApiResponse = await response.json();
        onGameCreated(result.data, game.password || "");
      } else {
        console.error("Error al crear la partida");
        setErrorMessage("Error al crear la partida.");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      setErrorMessage("Error en la petición: " + error);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createGame(gameDetails);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <h2>Crear Partida</h2>
      <div className="mb-3">
        <label className="form-label">Nombre de la Partida</label>
        <input
          type="text"
          className="form-control"
          value={gameDetails.name}
          onChange={(e) =>
            setGameDetails({ ...gameDetails, name: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Propietario</label>
        <input
          type="text"
          className="form-control"
          value={gameDetails.owner}
          onChange={(e) =>
            setGameDetails({ ...gameDetails, owner: e.target.value })
          }
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Contraseña</label>
        <input
          type="password"
          className="form-control"
          value={gameDetails.password}
          onChange={(e) =>
            setGameDetails({ ...gameDetails, password: e.target.value })
          }
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Crear
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

export default createGameForm;
