"use client";
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';

// Definir el tipo Game para las partidas
interface Game {
  name: string;
  owner: string;
  password?: string;
  id?: string;
  players?: string[];
  status?: string;
  enemies?: string[];
  currentRound?: number;
}

interface ApiResponse {
  status: number;
  msg: string;
  data: Game;
  others: any;
}

// Definir el tipo Game para las partidas
interface Game {
  name: string;
  owner: string;
  password?: string;
  id?: string;
  players?: string[];  // Lista de jugadores en la sala
}

interface ApiResponse {
  status: number;
  msg: string;
  data: Game;
  others: any;
}

export default function Home() {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      require('bootstrap/dist/js/bootstrap.bundle.min.js');
    }
  }, []);


  const [view, setView] = useState('home');
  const [gameDetails, setGameDetails] = useState<Game>({ name: '', owner: '', password: '' });
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [playerName, setPlayerName] = useState(''); // Nombre del jugador
  const [gamePassword, setGamePassword] = useState(''); // Contraseña de la partida
  const [searchQuery, setSearchQuery] = useState('');
  const [backendAddress, setBackendAddress] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const MAX_PLAYERS = 10 // Establecer el límite máximo de jugadores por sala

  // Función para obtener las partidas desde la API
  const fetchGames = async () => {
    try {
      const response = await fetch('https://contaminados.akamai.meseguercr.com/api/games');
      if (response.ok) {
        const result: ApiResponse = await response.json();
        console.log('Datos obtenidos:', result.data);
        if (Array.isArray(result.data)) {
          setGames(result.data);
          setFilteredGames(result.data.slice(0, limit));
        } else {
          console.error('La propiedad "data" no es un array', result.data);
          setGames([]);
          setFilteredGames([]);
        }
      } else {
        console.error('Error al obtener las partidas');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
    }
  };

  const createGame = async (game: Game) => {
    try {
      const response = await fetch('https://contaminados.akamai.meseguercr.com/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(game),
      });

      if (response.ok) {
        const result: ApiResponse = await response.json();
        setSelectedGame(result.data);
        setGamePassword(game.password || ''); // Almacenar la contraseña en el estado
        setPlayerName(game.owner); // Establecer el nombre del jugador como el propietario
        fetchGames();
        setView('gameDetails');
      } else {
        console.error('Error al crear la partida');
        setErrorMessage('Error al crear la partida.');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      setErrorMessage('Error en la petición: ' + error);
    }
  };

  const joinGame = async (gameId: string, playerName: string, password?: string) => {
    try {
      // Obtener los detalles del juego para verificar el estado actual
      const gameDetailsResponse = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${gameId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'password': password || '',
          'player': playerName
        }
      });

      if (gameDetailsResponse.status === 401) {
        // El jugador no es parte del juego, puede intentar unirse
        console.log('El jugador no es parte del juego, puede intentar unirse.');

        const gameDetails: ApiResponse = await gameDetailsResponse.json();

        // Validar límite de jugadores
        if (gameDetails.data.players && gameDetails.data.players.length >= MAX_PLAYERS) {
          alert('La sala está llena. No se pueden unir más jugadores.');
          return;
        }

        // Construir el cuerpo de la petición con el nombre del jugador
        const bodyData = { player: playerName };

        const response = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${gameId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'password': password || '', // Contraseña en el header si existe
          },
          body: JSON.stringify(bodyData),
        });

        if (response.ok) {
          const result: ApiResponse = await response.json();
          console.log('Unido a la partida:', result.data);

          if (result.data && result.data.players) {
            setSelectedGame(result.data);
            setGamePassword(password || ''); // Almacenar la contraseña en el estado
          } else {
            console.warn('Los detalles de la partida no contienen jugadores o no se han recibido correctamente');
          }
          setView('gameDetails');
        } else if (response.status === 400) {
          const errorResult = await response.json();
          console.error('Error al unirse a la partida', errorResult);
          alert('No se pudo unir a la partida. ' + (errorResult.msg || 'Verifica si la contraseña es correcta.'));
        } else {
          console.error('Error desconocido al unirse a la partida');
          alert('Error desconocido al unirse a la partida.');
        }
      } else if (gameDetailsResponse.ok) {
        // El jugador ya es parte del juego, no se le permite unirse nuevamente
        alert('El jugador ya es parte del juego. No se puede unir nuevamente.');
      } else {
        const errorResult = await gameDetailsResponse.json();
        console.error('Error al obtener los detalles del juego', errorResult);
        alert('Error al obtener los detalles del juego: ' + (errorResult.msg || `Status: ${gameDetailsResponse.status}`));
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      alert('Error en la petición: ' + error);
    }
  };

  const handleSearch = async (page = 0) => {
    if (searchQuery.length >= 3) {
      try {
        const response = await axios.get(`https://contaminados.akamai.meseguercr.com/api/games`, {
          params: {
            name: searchQuery,
            status: 'lobby',
            page: page,
            limit: limit
          }
        });
        if (response.status === 200) {
          setFilteredGames(response.data.data);
          setCurrentPage(page);
        } else {
          console.error('Error fetching games:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    } else {
      setFilteredGames(games.slice(page * limit, (page + 1) * limit)); // Mostrar juegos paginados si la búsqueda es menor a 3 caracteres
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    const fetchAndSearchGames = async () => {
      if (view === 'list') {
        if (searchQuery.length >= 3) {
          try {
            const response = await axios.get(`https://contaminados.meseguercr.com/api/games`, {
              params: {
                name: searchQuery,
                status: 'lobby',
                page: 0,
                limit: 50
              }
            });
            if (response.status === 200) {
              setFilteredGames(response.data.data);
            } else {
              console.error('Error fetching games:', response.statusText);
            }
          } catch (error) {
            console.error('Error fetching games:', error);
          }
        } else {
          fetchGames();
        }
      }
    };

    fetchAndSearchGames();
  }, [view, searchQuery]);

  // Manejar el formulario de unirse a la partida
  const handleJoinGameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedGame) {
      joinGame(selectedGame.id!, playerName, gamePassword);
    }
  };

  const handleCreateGame = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createGame(gameDetails);
  };

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setView('joinGame'); // Cambiar a la vista de unirse a la partida
  };
  const fetchGameDetails = async (gameId: string) => {
    try {
      const response = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${gameId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'password': gamePassword, // Utilizar la contraseña almacenada en el estado
          'player': playerName
        }
      });
      if (response.ok) {
        const result: ApiResponse = await response.json();
        setSelectedGame(result.data);
      } else {
        const errorResult = await response.json();
        console.error('Error al obtener los detalles del juego', errorResult);

        if (response.status === 400) {
          console.error('Error 400: Bad Request. Detalles:', errorResult);
          alert(`Error 400: Bad Request. ${errorResult.msg || 'Verifica los parámetros de la solicitud.'}`);
        } else {
          alert('Error al obtener los detalles del juego: ' + (errorResult.msg || `Status: ${response.status}`));
        }
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      alert('Error en la petición: ' + error);
    }
  };
  // Función para refrescar toda la información del juego
  const handleRefreshGame = async () => {
    if (selectedGame && selectedGame.id) {
      if (playerName.trim() === '') {
        alert('El nombre del jugador es obligatorio.');
        return;
      }
      try {
        await fetchGameDetails(selectedGame.id);
      } catch (error) {
        console.error('Error al refrescar el juego:', error);
        alert('Error al refrescar el juego: ' + error);
      }
    } else {
      console.error('No hay un juego seleccionado o el ID del juego es inválido');
      alert('No se puede refrescar: no hay un juego seleccionado o el ID es inválido');
    }
  };
  return (
    <div className="container mt-5">
      <button type="button" className="btn btn-secondary float-end" onClick={() => setShowSettings(true)}>
        <FaCog /> Configuración
      </button>

      {view === 'home' && (
        <>
          <h1 className="mb-4">Bienvenido</h1>
          <div className="d-flex justify-content-around">
            <button className="btn btn-primary" onClick={() => setView('create')}>Crear Partida</button>
            <button className="btn btn-success" onClick={() => setView('list')}>Unirse a Partida</button>
          </div>
        </>
      )}

      {view === 'create' && (
        <form onSubmit={handleCreateGame} className="mt-4">
          <h2>Crear Partida</h2>
          <div className="mb-3">
            <label className="form-label">Nombre de la Partida</label>
            <input
              type="text"
              className="form-control"
              value={gameDetails.name}
              onChange={(e) => setGameDetails({ ...gameDetails, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Propietario</label>
            <input
              type="text"
              className="form-control"
              value={gameDetails.owner}
              onChange={(e) => setGameDetails({ ...gameDetails, owner: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={gameDetails.password}
              onChange={(e) => setGameDetails({ ...gameDetails, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">Crear</button>
          <button type="button" className="btn btn-secondary ms-2" onClick={() => setView('home')}>Cancelar</button>
        </form>
      )}
      {view === 'list' && (
        <form onSubmit={handleJoinGameSubmit} className="mt-4">
          <h2>Lista de Partidas Disponibles</h2>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar partidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // Prevenir el comportamiento por defecto del Enter
                handleSearch(0); // Iniciar la búsqueda desde la primera página
              }
            }}
          />
          <button type="button" className="btn btn-primary mb-3" onClick={() => handleSearch(0)}>Buscar</button>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Nombre de la Partida</th>
                <th>Propietario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredGames) && filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                  <tr key={game.id}>
                    <td>{game.name}</td>
                    <td>{game.owner}</td>
                    <td className="text-end">
                      <button className="btn btn-success" onClick={() => handleSelectGame(game)}>Unirse</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No hay partidas disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="gap-3 d-md-flex justify-content-md-end mb-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSearch(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSearch(currentPage + 1)}
              disabled={filteredGames.length < limit}
            >
              Siguiente
            </button>
          </div>
          <button type="button" className="btn btn-secondary mt-3" onClick={() => setView('home')}>Volver</button>
        </form>
      )}
      {/* Modal */}
      <div className={`modal fade ${showSettings ? 'show' : ''}`} style={{ display: showSettings ? 'block' : 'none' }} tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Configuración</h5>
              <button type="button" className="btn-close" onClick={() => setShowSettings(false)}></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Dirección del Backend</label>
                <input
                  type="text"
                  className="form-control"
                  value={backendAddress}
                  onChange={(e) => setBackendAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary">Guardar</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
      {view === 'joinGame' && selectedGame && (
        <form onSubmit={handleJoinGameSubmit} className="mt-4">
          <h2>Unirse a la Partida</h2>
          <div className="mb-3">
            <label className="form-label">Nombre de Jugador</label>
            <input
              type="text"
              className="form-control"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
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
          <button type="submit" className="btn btn-primary">Unirse</button>
          <button type="button" className="btn btn-secondary ms-2" onClick={() => setView('list')}>
            Cancelar
          </button>
        </form>
      )}
      {view === 'gameDetails' && selectedGame && (
        <div className="mt-4">
          <h2>Detalles de la Partida: {selectedGame.name}</h2>
          <p>Propietario: {selectedGame.owner}</p>
          <p>Estado: {selectedGame.status}</p>
          <p>Contraseña: {selectedGame.password ? 'Sí' : 'No'}</p>
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
          <button type="button" className="btn btn-secondary mt-4" onClick={() => setView('list')}>
            Volver a la Lista
          </button>
          <button type="button" className="btn btn-primary mt-4 ms-2" onClick={handleRefreshGame}>
            Refrescar Información del Juego
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-danger mt-4" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
