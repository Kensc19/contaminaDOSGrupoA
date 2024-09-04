// pages/index.js
"use client";
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const [view, setView] = useState('home');
  const [gameDetails, setGameDetails] = useState({ name: '', owner: '', password: '' });
  const [games, setGames] = useState([
    { name: 'Partida 1', owner: 'Usuario1' },
    { name: 'Partida 2', owner: 'Usuario2' },
  ]);

  const handleCreateGame = (e) => {
    e.preventDefault();
    setGames([...games, gameDetails]);
    setView('list');
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
              {games.map((game, index) => (
                <tr key={index}>
                  <td>{game.name}</td>
                  <td>{game.owner}</td>
                  <td>
                    <button className="btn btn-success">Unirse</button>
                  </td>
                </tr>
              ))}
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
