"use client";
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { FaCog } from 'react-icons/fa';

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


  const filteredGames: Game[] = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Función para obtener las partidas desde la API
  const fetchGames = async () => {
    try {
      const response = await fetch('https://contaminados.akamai.meseguercr.com/api/games');
      if (response.ok) {
        const result: ApiResponse = await response.json();
        console.log('Datos obtenidos:', result.data);
        if (Array.isArray(result.data)) {
          setGames(result.data);
          setGames(result.data);
        } else {
          console.error('La propiedad "data" no es un array', result.data);
          setGames([]);
        }
      } else {
        console.error('Error al obtener las partidas');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
    }
  };

  const createGame = async (game) => {
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
        console.log('Partida creada:', result);

        // Usar la respuesta directamente para redirigir al usuario
        setSelectedGame(result.data);
        setView('gameDetails'); // Redirigir a los detalles de la partida
      } else {
        console.error('Error al crear la partida');
        setErrorMessage('Error al crear la partida.');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      setErrorMessage('Error en la petición: ' + error);
    }
  };

  // Función para unirse a una partida
  const joinGame = async (gameId: string, playerName: string, password?: string) => {
    try {
      // Construir el cuerpo de la petición con el nombre del jugador
      const bodyData = { player: playerName };

      const response = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'password': password || '', // Contraseña en el header si existe
        },
        body: JSON.stringify(bodyData), // Cuerpo con el nombre del jugador
      });

      if (response.ok) {
        const result: Game = await response.json();
        console.log('Unido a la partida:', result);

        if (result && result.players) {
          setSelectedGame(result); // Establecer los detalles de la partida con los jugadores
        } else {
          console.warn('Los detalles de la partida no contienen jugadores o no se han recibido correctamente');
        }
        setView('gameDetails'); // Cambiar la vista para mostrar los detalles de la partida
      } else if (response.status === 400) {
        const errorResult = await response.json();
        console.error('Error al unirse a la partida', errorResult);
        alert('No se pudo unir a la partida. ' + (errorResult.msg || 'Verifica si la contraseña es correcta.'));
      } else {
        console.error('Error desconocido al unirse a la partida');
        alert('Error desconocido al unirse a la partida.');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      alert('Error en la petición: ' + error);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchGames();
    }
  }, [view]);

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
        <div className="mt-4">
          <h2>Lista de Partidas Disponibles</h2>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar partidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className="btn btn-primary mb-3" >Buscar</button>

          {games.length === 0 ? (
            <p>No hay partidas disponibles.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Propietario</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.name + game.owner}>
                      <td>{game.name}</td>
                      <td>{game.owner}</td>
                      <td>
                        <button className="btn btn-primary" onClick={() => handleSelectGame(game)}>
                          Unirse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <div className={`modal fade ${showSettings ? 'show' : ''}`} style={{ display: showSettings ? 'block' : 'none' }} tabIndex="-1">
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
          <p>Contraseña: {selectedGame.password ? 'Sí' : 'No'}</p>
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
          <button type="button" className="btn btn-secondary mt-4" onClick={() => setView('list')}>
            Volver a la Lista
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
