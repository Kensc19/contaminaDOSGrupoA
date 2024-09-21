"use client";
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';
import { headers } from 'next/headers';

// Definir el tipo Game para las partidas
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
  const [rounds, setrounds] = useState([]);  
  const [leaderActual, setLeader] = useState('');
  const [resultActual, setResult] = useState('');
  const [statusActual, setStatus] = useState('');
  const [phaseActual, setPhase] = useState('');
  const [groupActual, setGroup] = useState([]);
  const [votesActual, setVotes] = useState([]);
  const [error, setError] = useState('');

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

  //Función para crear una partida
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

  //Función para unirse a una partida
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

  //Función para traer la información de la ronda
  const getAllRounds = async(gameId: string, playerName: string, password?: string) => {
    try{          
      setError('');
      //Crear la petición de las rondas a la API
      const response = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${gameId}/rounds`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'password': gamePassword || '',
          'player': playerName
        }
      });
      if (response.ok){             
        const data = await response.json();
        setrounds(data.data)        
      }else if(response.status === 400){
        alert('Bad Request'); 
      }else if(response.status === 401){
        alert('Credenciales Inválidas');
      }else if(response.status === 403){
        alert('No forma parte del juego');
      }else if(response.status === 404){
        alert('Not found');
      }
      else if(response.status === 408){
        alert('Request Timeout');
      }
      else{
        alert('Error desconocido');
      }
    }
    catch(err){
      alert('Ocurrió un error al traer la información de las rondas'+ err);
    }
  }

  //Ejecutar getAllRounds
  /*useEffect(()=> {
    if(view === 'gameStarted'){
      
    }
  }, [selectedGame?.currentRound])
  */
  const handleGetAllRounds = () => {
    if(selectedGame && selectedGame.id && selectedGame.password){      
        getAllRounds(selectedGame.id, playerName, selectedGame.password);
      }else{
        alert('Error al traer los datos')
      }
  }

  //Función para traer información de una ronda
  const getRound =  async(gameId: string, roundId:string, playerName: string, password?: string) =>{
    try{
      //crear la petición a la API
      const response = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${gameId}/rounds/${roundId}`,{
        method:'GET',
        headers: {
          'accept': 'application/json',
          'password': gamePassword || '',
          'player': playerName
        }
      });
         
      if (response.ok){
        const data = await response.json();        
        setLeader(data.data.leader);
        setResult(data.data.result);
        setStatus(data.data.status);
        setPhase(data.data.phase);
        setGroup(data.data.group);
        setVotes(data.data.votes);
      }
      else{
        alert('error en el getRound');
        //handleStartGameErrors(response);
      }
    }catch(err){
      alert('Ocurrió un error al traer la información de la ronda'+ err);
    }
  };

  /*useEffect(()=>{
    if(view === 'gameStarted'){
      
    }
  }, [rounds])
  */
  const handleGetRound = () => {
    if(selectedGame && selectedGame.id && selectedGame.currentRound && selectedGame.password){
      getRound(selectedGame.id, selectedGame.currentRound, playerName, selectedGame.password);
    }else{
      alert('No se pudo traer la información');
    }       
  }

  //Función para buscar la partida
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

  // Función para iniciar la partida
  const startGame = async (gameId: string, playerName: string, password: string) => {
    if (!selectedGame || !selectedGame.players) {
      alert('No hay información suficiente sobre los jugadores.');
      return;
    }

    const playerCount = selectedGame.players.length;

    if (playerCount < 5) {
      alert('Se necesitan al menos 5 jugadores para iniciar el juego.');
      return;
    }

    if (playerCount > 10) {
      alert('No puede haber más de 10 jugadores en el juego.');
      return;
    }

    try {
      const response = await fetch(`https://contaminados.akamai.meseguercr.com/api/games/${gameId}/start`, {
        method: 'HEAD', // El método es HEAD
        headers: {
          'Content-Type': 'application/json',
          'password': password,
          'player': playerName,
        },
      });

      if (response.ok) {
        alert('Juego iniciado correctamente');
        setView('gameStarted');  // Cambiar la vista a "gameStarted"
      } else {
        handleStartGameErrors(response);
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      alert('Error al iniciar el juego: ' + error);
    }
  };

  const handleStartGame = () => {
    if (selectedGame && selectedGame.id && selectedGame.password && selectedGame.currentRound) {
      startGame(selectedGame.id, playerName, selectedGame.password);      
    } else {
      alert('Faltan datos para iniciar el juego.');
    }
  };

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

  //Función para traer los datos del juegoi
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

  const handleStartGameErrors = (response: Response) => {
    if (response.status === 401) {
      alert('No autorizado para iniciar el juego.');
    } else if (response.status === 403) {
      alert('Acceso prohibido.');
    } else if (response.status === 404) {
      alert('Juego no encontrado.');
    } else if (response.status === 409) {
      alert('El juego ya ha sido iniciado.');
    } else if (response.status === 428) {
      alert('Se necesitan al menos 5 jugadores para iniciar el juego.');
    } else {
      alert('Error desconocido al intentar iniciar el juego.');
    }
  }

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

          {/* Mostrar el botón solo si el jugador es el propietario */}
          {selectedGame.owner === playerName && (
            <button type="button" className="btn btn-primary mt-4" onClick={handleStartGame}>
              Iniciar Juego
            </button>
          )}

        </div>
      )}

      {view === 'gameStarted' && selectedGame && (
        <div className="mt-4">
          <h2>El juego ha comenzado</h2>
          <p>¡Buena suerte a todos los jugadores!</p>
          {/*Información de la partida actual*/}
          <div>
            <h2>Ronda Actual</h2>
            <ul>              
                <li>                                
                    <strong>ID:</strong> {selectedGame.currentRound} <br />
                    <strong>Líder:</strong> {leaderActual}<br />
                    <strong>Resultado : </strong> {resultActual}<br/>
                    <strong>Estado:</strong> {statusActual} <br />
                    <strong>Fase:</strong> {phaseActual} <br />
                    <strong>Grupo:</strong> {groupActual && groupActual.length > 0 ? groupActual.join(', ') : 'Sin grupo'} <br />
                    <strong>Votos:</strong> {votesActual && votesActual.length > 0 ? votesActual.join(', ') : 'Sin votos'} <br />                    
                </li>              
            </ul>          
            <button type='button' className="btn btn-primary mt-4" onClick={() => { handleGetRound(); handleRefreshGame();}}>
              Actualizar Información
            </button>
          </div>
          <div>
          <button type= "button" className="btn btn-primary mt-4" onClick={handleGetAllRounds}>
              Obtener Rondas
            </button>
            <div>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
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
                    <td>{round.result ? round.result : 'No hay'}</td>
                    <td>{round.status}</td>
                    <td>{round.phase}</td>
                    <td>{round.group && round.group.length > 0 ? round.group.join(', ') : 'Sin grupo'}</td>
                    <td>{round.votes && round.votes.length > 0 ? round.votes.join(', ') : 'Sin votos'}</td>
                    </tr>
                    ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {
}
      {/*
      {errorMessage && (
        <div className="alert alert-danger mt-4" role="alert">
          {errorMessage}
        </div>
      )}*/}
    </div>
  );
}
