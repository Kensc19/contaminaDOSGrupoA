import React, { useState, useEffect } from "react";

interface Game {
  id: string;
  name: string;
  owner: string;
  password?: string;
  players?: string[];
  status?: string;
  enemies?: string[];
  currentRound?: string;
}

interface Round {
  id: string;
  leader: string;
  result: string;
  status: string;
  phase: string;
  group: string[];
  votes: string[];
}

interface GameStartProps {
  selectedGame: Game;
  playerName: string;
  gamePassword: string;
  setView: (view: string) => void;
  currentRound: string | undefined; // Añadir currentRound a las props
}

const GameStart: React.FC<GameStartProps> = ({
  selectedGame,
  playerName,
  gamePassword,
  setView,
  currentRound, // Usar currentRound en el componente
}) => {
  const [leaderActual, setLeaderActual] = useState<string>("");
  const [resultActual, setResultActual] = useState<string>("");
  const [statusActual, setStatusActual] = useState<string>("");
  const [phaseActual, setPhaseActual] = useState<string>("");
  const [groupActual, setGroupActual] = useState<string[]>([]);
  const [votesActual, setVotesActual] = useState<string[]>([]);
  const [vote, setVote] = useState<boolean | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getAllRounds(selectedGame.id, playerName, gamePassword);
    if (currentRound) {
      getRound(selectedGame.id, currentRound, playerName, gamePassword);
    }
  }, [selectedGame.id, currentRound, playerName, gamePassword]);

  const handleApiErrors = (response: Response) => {
    if (response.status === 400) {
      alert("Bad Request");
    } else if (response.status === 401) {
      alert("Credenciales Inválidas");
    } else if (response.status === 403) {
      alert("No forma parte del juego");
    } else if (response.status === 404) {
      alert("Not found");
    } else if (response.status === 408) {
      alert("Request Timeout");
    } else {
      alert("Error desconocido");
    }
  };

  const getAllRounds = async (
    gameId: string,
    playerName: string,
    password: string
  ) => {
    try {
      setError("");
      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${gameId}/rounds`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            password: password,
            player: playerName,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRounds(data.data);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      alert("Ocurrió un error al traer la información de las rondas: " + err);
    }
  };

  const getRound = async (gameId: string, roundId: string, playerName: string, password: string) => {
    try {
      const response = await fetch( `https://contaminados.akamai.meseguercr.com/api/games/${gameId}/rounds/${roundId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            password: password,
            player: playerName,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderActual(data.leader);
        setResultActual(data.result);
        setStatusActual(data.status);
        setPhaseActual(data.phase);
        setGroupActual(data.group);
        setVotesActual(data.votes);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      alert("Ocurrió un error al traer la información de la ronda: " + err);
    }
  };

  const submitVote = async (gameId: string, roundId: string, vote: boolean) => {
    // Submit vote
    setVote(vote);
  };

  const isLeader = currentRound && leaderActual === playerName;
  const isEnemy = selectedGame.enemies && selectedGame.enemies.includes(playerName);

  return (
    <div className="mt-4">
      <h2>El juego ha comenzado</h2>
      <p>¡Buena suerte a todos los jugadores!</p>

      {/* Información de la partida actual visible para todos los jugadores */}
      <div>
        <h2>Ronda Actual</h2>
        <ul className="list-group">
          <li className="list-group-item">
            <strong>ID:</strong> {currentRound}
          </li>
          <li className="list-group-item">
            <strong>Líder:</strong> {leaderActual}
          </li>
          <li className="list-group-item">
            <strong>Resultado :</strong> {resultActual}
          </li>
          <li className="list-group-item">
            <strong>Estado:</strong> {statusActual}
          </li>
          <li className="list-group-item">
            <strong>Fase:</strong> {phaseActual}
          </li>
          <li className="list-group-item">
            <strong>Grupo:</strong>{" "}
            {groupActual && groupActual.length > 0
              ? groupActual.join(", ")
              : "Sin grupo"}
          </li>
          <li className="list-group-item">
            <strong>Votos:</strong>{" "}
            {votesActual && votesActual.length > 0
              ? votesActual.join(", ")
              : "Sin votos"}
          </li>
        </ul>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => {
            getAllRounds(selectedGame.id, playerName, gamePassword);
            if (currentRound) {
              getRound(selectedGame.id, currentRound, playerName, gamePassword);
            }
          }}
        >
          Actualizar Información
        </button>
        {isLeader && (
          <button
            type="button"
            className="btn btn-primary mt-4"
            data-bs-toggle="modal"
            data-bs-target="#leaderModal"
          >
            Proponer Líderes
          </button>
        )}
      </div>

      {/* Modal para proponer líderes */}
      <div
        className="modal fade"
        id="leaderModal"
        tabIndex={-1}
        aria-labelledby="leaderModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="leaderModalLabel">
                Seleccionar Nuevos Líderes
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form id="leaderForm">
                {selectedGame.players?.map((player, index) => (
                  <div key={index} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value={player}
                      id={`player${index}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`player${index}`}
                    >
                      {player}
                    </label>
                  </div>
                ))}
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de votación accesible para todos */}
      <div className="mt-4">
        <h3>Votación</h3>
        {vote === null ? (
          <div>
            <button
              className="btn btn-success me-2"
              onClick={() =>
                submitVote(
                  selectedGame.id,
                  currentRound!,
                  true
                )
              }
            >
              Colaborar
            </button>
            {isEnemy && (
              <button
                className="btn btn-danger"
                onClick={() =>
                  submitVote(
                    selectedGame.id,
                    currentRound!,
                    false
                  )
                }
              >
                Sabotear
              </button>
            )}
          </div>
        ) : (
          <p>Ya has votado: {vote ? "Colaborar" : "Sabotear"}</p>
        )}
      </div>

      {/* Tabla de rondas */}
      <div className="mt-4">
        <h3>Rondas</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Líder</th>
              <th>Resultado</th>
              <th>Estado</th>
              <th>Fase</th>
              <th>Grupo</th>
              <th>Votos</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round) => (
              <tr key={round.id}>
                <td>{round.id}</td>
                <td>{round.leader}</td>
                <td>{round.result}</td>
                <td>{round.status}</td>
                <td>{round.phase}</td>
                <td>{round.group.join(", ")}</td>
                <td>{round.votes.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameStart;