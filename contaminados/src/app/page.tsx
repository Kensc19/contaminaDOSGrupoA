"use client";
import React, { useState, useEffect } from 'react';

interface Game {
  id: string;
  name: string;
  owner: string;
}
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';

export default function Home() {
  const [view, setView] = useState('home');
  const [gameDetails, setGameDetails] = useState({ name: '', owner: '', password: '' });
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [backendAddress, setBackendAddress] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filteredGames, setFilteredGames] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const fetchGames = async () => {
    try {
      const response = await fetch('https://contaminados.akamai.meseguercr.com/api/games');
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result.data)) {
          setGames(result.data);
          setFilteredGames(result.data.slice(0, limit));
        } else {
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
        const result = await response.json();
        fetchGames();
        setView('list');
      } else {
        console.error('Error al crear la partida');
      }
    } catch (error) {
      console.error('Error en la petición:', error);
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

  const handleCreateGame = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createGame(gameDetails);
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
          <h2>Lista de Partidas</h2>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar partidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          <div className="d-flex justify-content-between">
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
    </div>
  );
}