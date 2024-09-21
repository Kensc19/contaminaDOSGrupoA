"use client";
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

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
  data: Game | Game[]; // Puede ser un array de juegos o un solo juego
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

  // Función para obtener las partidas desde la API
  const fetchGames = async () => {
    try {
      const response = await fetch('https://contaminados.akamai.meseguercr.com/api/games');
      if (response.ok) {
        const result: ApiResponse = await response.json();
        console.log('Datos obtenidos:', result.data);
        if (Array.isArray(result.data)) {
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

  // Función para crear una nueva partida
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
        console.log('Partida creada:', result);

        // Usar la respuesta directamente para redirigir al usuario
        setSelectedGame(result.data as Game);
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

  const refreshGameDetails = async () => {
    if (selectedGame?.id) {
      try {
        const bodyData = { player: playerName }; 
  
        const response = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${selectedGame.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_ACCESS_TOKEN`, // Reemplaza con el token adecuado
          },
          body: JSON.stringify(bodyData),
        });
  
        if (response.ok) {
          const result: Game = await response.json();
          console.log('Detalles actualizados de la partida:', result);
          setSelectedGame(result);
        } else {
          const errorResult = await response.json();
          console.error('Error al obtener los detalles de la partida', errorResult);
          setErrorMessage(`Error ${response.status}: ${errorResult.msg || 'Detalles no disponibles'}`);
        }
      } catch (error) {
        console.error('Error en la petición:', error);
        setErrorMessage('Error en la petición: ' + error);
      }
    } else {
      setErrorMessage('No se puede refrescar sin un ID de partida válido.');
    }
  };
  

  // Efecto para cargar las partidas cuando se muestra la vista de lista
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
      {view === 'home' && (
        <>
          <h1 className="mb-4">Bienvenido</h1>
          <div className="d-flex justify-content-around">
            <button className="btn btn-primary" onClick={() => setView('create')}>
              Crear Partida
            </button>
            <button className="btn btn-success" onClick={() => setView('list')}>
              Unirse a Partida
            </button>
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
        </form>
      )}

      {view === 'list' && (
        <div className="mt-4">
          <h2>Lista de Partidas Disponibles</h2>
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
          <button className="btn btn-secondary mt-2" onClick={() => setView('home')}>Volver al Inicio</button>
        </div>
      )}

      {view === 'joinGame' && selectedGame && (
        <form onSubmit={handleJoinGameSubmit} className="mt-4">
          <h2>Unirse a la Partida</h2>
          <p><strong>Nombre:</strong> {selectedGame.name}</p>
          <p><strong>Propietario:</strong> {selectedGame.owner}</p>
          <p><strong>Contraseña:</strong> {selectedGame.password}</p>
          <div className="mb-3">
            <label className="form-label">Nombre del Jugador</label>
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
          <button className="btn btn-secondary mt-2" onClick={() => setView('home')}>Volver al Inicio</button>
        </form>
      )}

      {view === 'gameDetails' && selectedGame && (
        <div className="mt-4">
          <h2>Detalles de la Partida</h2>
          <p><strong>Nombre:</strong> {selectedGame.name}</p>
          <p><strong>Propietario:</strong> {selectedGame.owner}</p>
          <p><strong>Contraseña:</strong> {selectedGame.password}</p>
          <p><strong>Jugadores:</strong> {selectedGame.players?.join(', ') || 'Ninguno'}</p>
          <button className="btn btn-primary" onClick={refreshGameDetails}>Refrescar</button>
          <button className="btn btn-secondary mt-2" onClick={() => setView('home')}>Volver al Inicio</button>
          {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>}
        </div>
      )}
    </div>
  );
}
