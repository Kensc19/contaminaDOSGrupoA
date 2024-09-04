// pages/index.js
"use client";
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Definir el tipo Game para las partidas
interface Game {
  name: string;
  owner: string;
  password?: string;
  id?: string; // Opcional ya que no se utiliza para crear un juego
}

//variables
interface ApiResponse {
  status: number;
  msg: string;
  data: Game[];
  others: any;
}

export default function Home() {
  const [view, setView] = useState('home');
  const [gameDetails, setGameDetails] = useState<Game>({ name: '', owner: '', password: '' });
  const [games, setGames] = useState<Game[]>([]); // Usamos un array del tipo Game

  // Función para obtener las partidas desde la API
  const fetchGames = async () => {
    try {
      const response = await fetch('https://contaminados.akamai.meseguercr.com/api/games');
      if (response.ok) {
        const result: ApiResponse = await response.json();
        console.log('Datos obtenidos:', result.data); // Mostrar datos obtenidos
        if (Array.isArray(result.data)) {
          setGames(result.data); // Guardar las partidas obtenidas
        } else {
          console.error('La propiedad "data" no es un array', result.data);
          setGames([]); // Asegurarse de que `games` sea un array vacío si la respuesta no es un array
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
        const result = await response.json();
        console.log('Partida creada:', result);
        // Actualizar la lista de partidas después de crear una nueva
        fetchGames(); // Obtener la lista actualizada de partidas
        setView('list'); // Cambiar la vista a la lista de partidas
      } else {
        console.error('Error al crear la partida');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
    }
  };

  // Efecto para cargar las partidas cuando se muestra la vista de lista
  useEffect(() => {
    if (view === 'list') {
      fetchGames();
    }
  }, [view]);

  const handleCreateGame = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createGame(gameDetails); // Llamar a la función para crear la partida
  };

  return (
    <div className="container mt-5">
      {view === 'home' && (
        <>
          <h1 className="mb-4">Bienvenido</h1>
          <div className="d-flex justify-content-around">
            <button
              className="btn btn-primary"
              onClick={() => setView('create')}
            >
              Crear Partida
            </button>
            <button
              className="btn btn-success"
              onClick={() => setView('list')}
            >
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
          <button type="button" className="btn btn-secondary ms-2" onClick={() => setView('home')}>
            Cancelar
          </button>
        </form>
      )}

      {view === 'list' && (
        <div className="mt-4">
          <h2>Lista de Partidas</h2>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Nombre de la Partida</th>
                <th>Propietario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(games) && games.length > 0 ? (
                games.map((game) => (
                  <tr key={game.id}>
                    <td>{game.name}</td>
                    <td>{game.owner}</td>
                    <td>
                      <button className="btn btn-success">Unirse</button>
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
          <button type="button" className="btn btn-secondary" onClick={() => setView('home')}>
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
