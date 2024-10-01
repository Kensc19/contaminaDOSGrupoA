import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CustomModal from "./customModal";

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
  view: string;
  setView: (view: string) => void;
}

const GameStart: React.FC<GameStartProps> = ({
  selectedGame,
  playerName,
  gamePassword,
  view,
  setView,
}) => {
  const [idRondaActual, setIdRondaActual] = useState<string>("");
  const [leaderActual, setLeaderActual] = useState<string>("");
  const [resultActual, setResultActual] = useState<string>("none");
  const [statusActual, setStatusActual] = useState<string>("waiting-on-leader");
  const [phaseActual, setPhaseActual] = useState<string>("");
  const [groupActual, setGroupActual] = useState<string[]>([]);
  const [votesActual, setVotesActual] = useState<string[]>([]);
  const [votesState, setVotesState] = useState<{
    [key: string]: boolean | null;
  }>({});
  const [rounds, setRounds] = useState<Round[]>([]);
  const [error, setError] = useState<string>("");

  const [proposedGroup, setProposedGroup] = useState<string[]>([]);
  const [citizensScore, setCitizensScore] = useState<number>(0);
  const [enemiesScore, setEnemiesScore] = useState<number>(0);
  const [roundAlreadyCounted, setRoundAlreadyCounted] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const handleCloseModal = () => setShowModal(false);

  const groupSizesPerRound = {
    5: [2, 3, 2, 3, 3],
    6: [2, 3, 4, 3, 4],
    7: [2, 3, 3, 4, 4],
    8: [3, 4, 4, 5, 5],
    9: [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
  };

  useEffect(() => {
    if (selectedGame.status === "ended") {
      setView("gameEnded"); // Cambiar la vista a "gameEnded"
    }
  }, [selectedGame.status, setView]);

  useEffect(() => {
    if (selectedGame.status === "rounds") {
      getAllRounds(selectedGame.id, playerName, gamePassword);
    }
  }, [selectedGame.id, playerName, gamePassword]);

  useEffect(() => {
    const currentRound = rounds.find((round) => round.status !== "ended");
    const lastRound = rounds[rounds.length - 1];

    if (lastRound && lastRound.status === "ended") {
      handleRoundEnd(lastRound);
    } else if (currentRound) {
      setIdRondaActual(currentRound.id);
      getRound(selectedGame.id, currentRound.id, playerName, gamePassword);
    }
  }, [rounds]);

  useEffect(() => {
    const handleModalClose = () => {
      setProposedGroup([]);
    };

    const modal = document.getElementById("leaderModal");
    modal?.addEventListener("hidden.bs.modal", handleModalClose);

    return () => {
      modal?.removeEventListener("hidden.bs.modal", handleModalClose);
    };
  }, []);

  const handleApiErrors = (response: Response) => {
    let message = "";
    if (response.status === 400) {
      message = "Bad Request";
    } else if (response.status === 401) {
      message = "Credenciales Inválidas";
    } else if (response.status === 403) {
      message = "No forma parte del juego";
    } else if (response.status === 404) {
      message = "Not found";
    } else if (response.status === 408) {
      message = "Request Timeout";
    } else if (response.status === 428) {
      message = "Esta acción no está permitida en este momento";
    } else {
      message = "Error desconocido";
    }
    // Actualiza el mensaje y muestra el modal
    setModalTitle("Error");
    setModalMessage(message);
    setShowModal(true);
  };

  const validateGroupSize = (currentRoundIndex: number) => {
    const numPlayers = selectedGame.players?.length || 0;

    if (numPlayers < 5 || numPlayers > 10) {
      setModalTitle("Error");
      setModalMessage("El número de jugadores debe estar entre 5 y 10.");
      setShowModal(true);
      return false;
    }

    const requiredGroupSize =
      groupSizesPerRound[numPlayers as keyof typeof groupSizesPerRound][
        currentRoundIndex
      ];

    if (proposedGroup.length !== requiredGroupSize) {
      setModalTitle("Aviso");
      setModalMessage(
        `Debes seleccionar ${requiredGroupSize} jugadores para esta ronda.`
      );
      setShowModal(true);
      return false;
    }

    return true;
  };

  const getAllRounds = async (
    gameId: string,
    playerName: string,
    password?: string
  ) => {
    try {
      const headers: Record<string, string> = {
        accept: "application/json",
        player: playerName,
        ...(password && { password }),
      };

      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${gameId}/rounds`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRounds(data.data);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage(
        "Ocurrió un error al traer la información de las rondas: " + err
      );
      setShowModal(true);
    }
  };

  const getRound = async (
    gameId: string,
    roundId: string,
    playerName: string,
    password?: string
  ) => {
    try {
      const headers: Record<string, string> = {
        accept: "application/json",
        player: playerName,
        ...(password && { password }),
      };

      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${gameId}/rounds/${roundId}`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderActual(data.data.leader);
        setResultActual(data.data.result);
        setStatusActual(data.data.status);
        setPhaseActual(data.data.phase);
        setGroupActual(data.data.group);
        setVotesActual(data.data.votes);
        resetVotesState();
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage(
        "Ocurrió un error al traer la información de la ronda: " + err
      );
      setShowModal(true);
    }
  };

  const resetVotesState = () => {
    const initialVotes: { [key: string]: boolean | null } = {};
    selectedGame.players?.forEach((player) => {
      initialVotes[player] = null;
    });
    setVotesState(initialVotes);
  };

  const handleRoundEnd = (lastRound: Round) => {
    if (lastRound.id !== roundAlreadyCounted) {
      if (lastRound.result === "citizens") {
        setCitizensScore((prevScore) => prevScore + 1);
      } else if (lastRound.result === "enemies") {
        setEnemiesScore((prevScore) => prevScore + 1);
      }
      setRoundAlreadyCounted(lastRound.id);
    }

    const newRound = rounds.find(
      (round) => round.status === "waiting-on-leader"
    );
    if (newRound) {
      setIdRondaActual(newRound.id);
      setLeaderActual(newRound.leader);
      setStatusActual(newRound.status);
      setPhaseActual(newRound.phase);
      setGroupActual(newRound.group);
      setVotesActual(newRound.votes);
      resetVotesState();

      setModalTitle("Nueva Ronda");
      setModalMessage("Una nueva ronda ha comenzado. ¡Escoge un nuevo grupo!");
      setShowModal(true);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      await getAllRounds(selectedGame.id, playerName, gamePassword);

      const currentRound = rounds.find((round) => round.status !== "ended");
      if (currentRound) {
        setIdRondaActual(currentRound.id);
        getRound(selectedGame.id, currentRound.id, playerName, gamePassword);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("Ocurrió un error al actualizar la información: " + err);
      setShowModal(true);
    }
  };

  /*useEffect(() => {
    const intervalId = setInterval(() => {
      if (selectedGame) {
        handleUpdateInfo();
      }
    }, 6000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Clean up on component unmount
  }, [selectedGame, view]);*/

  const submitVote = async (voteValue: boolean) => {
    try {
      const currentRound = rounds.find((round) => round.status !== "ended");
      if (!currentRound) {
        setModalTitle("Error");
        setModalMessage("No hay una ronda disponible para votar.");
        setShowModal(true);
        return;
      }

      const headers: Record<string, string> = {
        accept: "application/json",
        "Content-Type": "application/json",
        player: playerName,
        ...(gamePassword && { password: gamePassword }),
      };

      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${selectedGame.id}/rounds/${currentRound.id}`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            vote: voteValue,
          }),
        }
      );

      if (response.ok) {
        setModalTitle("Vote enviado");
        setModalMessage("Voto enviado correctamente");
        setShowModal(true);
        setVotesState((prevState) => ({
          ...prevState,
          [playerName]: voteValue,
        }));
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("Ocurrió un error al enviar el voto: " + err);
      setShowModal(true);
    }
  };

  const submitGroupProposal = async () => {
    if (statusActual !== "waiting-on-leader") {
      setModalTitle("Error");
      setModalMessage("No puedes proponer un grupo en esta fase.");
      setShowModal(true);
      return;
    }

    const currentRoundIndex = rounds.findIndex(
      (round) => round.status === "waiting-on-leader"
    );

    if (!validateGroupSize(currentRoundIndex)) {
      return;
    }

    const currentRound = rounds.find(
      (round) => round.status === "waiting-on-leader"
    );
    if (!currentRound) {
      setModalTitle("Error");
      setModalMessage(
        "No hay una ronda actual disponible para proponer un grupo."
      );
      setShowModal(true);
      return;
    }

    try {
      const headers = {
        accept: "application/json",
        "Content-Type": "application/json",
        player: playerName,
        ...(gamePassword && { password: gamePassword }),
      };

      const body = {
        group: proposedGroup,
      };

      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${selectedGame.id}/rounds/${currentRound.id}`,
        {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify(body),
        }
      );
      if (response.ok) {
        setModalTitle("Éxito");
        setModalMessage("Propuesta de grupo enviada correctamente");
        setShowModal(true);
        resetVotesState();
      } else if (response.status === 428) {
        setModalTitle("Error");
        setModalMessage("Esta acción no está permitida en este momento.");
        setShowModal(true);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("Error al proponer grupo: " + err);
      setShowModal(true);
    }
  };

  const submitAction = async (actionValue: boolean) => {
    try {
      const currentRound = rounds.find((round) => round.status !== "ended");
      if (!currentRound) {
        setModalTitle("Ronda no disponible");
        setModalMessage("No hay una ronda disponible para realizar la acción.");
        setShowModal(true);
        return;
      }

      const headers: Record<string, string> = {
        accept: "application/json",
        "Content-Type": "application/json",
        player: playerName,
        ...(gamePassword && { password: gamePassword }),
      };

      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games/${selectedGame.id}/rounds/${currentRound.id}`,
        {
          method: "PUT",
          headers: headers,
          body: JSON.stringify({
            action: actionValue,
          }),
        }
      );

      if (response.ok) {
        setModalTitle("Éxito");
        setModalMessage("Acción realizada correctamente.");
        setShowModal(true);
      } else {
        handleApiErrors(response);
      }
    } catch (err) {
      setModalTitle("Error");
      setModalMessage("Ocurrió un error al realizar la acción: " + err);
      setShowModal(true);
    }
  };

  const handlePlayerSelection = (player: string) => {
    setProposedGroup((prevGroup) =>
      prevGroup.includes(player)
        ? prevGroup.filter((p) => p !== player)
        : [...prevGroup, player]
    );
  };

  const isLeader = leaderActual === playerName;
  const isEnemy =
    selectedGame.enemies && selectedGame.enemies.includes(playerName);

  return (
    <div className="mt-4">
      <h2>El juego ha comenzado</h2>
      <p>¡Buena suerte a todos los jugadores!</p>

      <div className="mt-4">
        <h3>Marcador</h3>
        <p>Ciudadanos: {citizensScore}</p>
        <p>Enemigos: {enemiesScore}</p>
      </div>

      {view === "gameStarted" && selectedGame && (
        <div>
          <h2>Ronda Actual</h2>
          <ul className="list-group">
            <li className="list-group-item">
              <strong>ID:</strong> {idRondaActual}
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

          {selectedGame.enemies &&
            selectedGame.enemies.length > 0 &&
            selectedGame.enemies.includes(playerName) && (
              <div>
                <h3>Enemigos:</h3>
                <ul>
                  {selectedGame.enemies.map((enemy, index) => (
                    <li key={index}>{enemy}</li>
                  ))}
                </ul>
              </div>
            )}

          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={handleUpdateInfo}
          >
            Actualizar Información
          </button>

          {isLeader && (
            <button
              type="button"
              className="btn btn-primary mt-4"
              data-bs-toggle="modal"
              data-bs-target="#leaderModal"
              onClick={submitGroupProposal}
            >
              Proponer Grupo
            </button>
          )}
        </div>
      )}

      <div className="mt-4">
        <h3>Votación</h3>
        {votesState[playerName] === null ? (
          <div>
            <button
              className="btn btn-success me-2"
              onClick={() => submitVote(true)}
            >
              De acuerdo
            </button>
            <button
              className="btn btn-danger"
              onClick={() => submitVote(false)}
            >
              En desacuerdo
            </button>
          </div>
        ) : (
          <p>
            Ya has votado:{" "}
            {votesState[playerName] ? "De acuerdo" : "En desacuerdo"}
          </p>
        )}
      </div>

      {groupActual.includes(playerName) && (
        <div className="mt-4">
          <h3>Acción en el grupo</h3>
          <button
            className="btn btn-success me-2"
            onClick={() => submitAction(true)}
          >
            Colaborar
          </button>
          {isEnemy && (
            <button
              className="btn btn-danger"
              onClick={() => submitAction(false)}
            >
              Sabotear
            </button>
          )}
          
        </div>
      )}

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
                Seleccionar Grupo
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form id="groupForm">
                {selectedGame.players?.map((player, index) => (
                  <div key={index} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value={player}
                      onChange={() => handlePlayerSelection(player)}
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
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitGroupProposal}
              >
                Enviar Propuesta
              </button>
            </div>
          </div>
        </div>
      </div>

      <CustomModal
        show={showModal}
        handleClose={handleCloseModal}
        title={modalTitle}
        message={modalMessage}
      />

      
    </div>
  );
};

export default GameStart;
