import React, { useState, useEffect } from 'react';

interface Game {
  id?: string;
  name: string;
  owner: string;
}

interface GameListProps {
  onSelectGame: (game: Game) => void;
  onBack: () => void;
  backEndAddress: string;
}

const GameList: React.FC<GameListProps> = ({
  onSelectGame,
  onBack,
  backEndAddress,
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limitPerPage = 15;

  useEffect(() => {
    // Función para obtener todas las partidas, recorriendo todas las páginas
    const fetchAllGames = async () => {
      setLoading(true);
      let allGames: Game[] = [];
      let page = 0;
      let fetchedData: Game[] = [];

      do {
        try {
          // Hacer la solicitud al backend por cada página con `fetch`
          const response = await fetch(
            `${backEndAddress}/api/games?page=${page}&limit=50`
          );
          const result = await response.json();

          fetchedData = result.data as Game[]; // Asumimos que la respuesta sigue la estructura { data: Game[] }
          allGames = [...allGames, ...fetchedData];
          page += 1; // Avanzar a la siguiente página
        } catch (error) {
          console.error('Error al cargar las partidas', error);
          setLoading(false);
          return;
        }
      } while (fetchedData.length > 0); // Detener si ya no hay más resultados

      setGames(allGames);
      setLoading(false);
    };

    fetchAllGames();
  }, [backEndAddress]);

  // Filtrar los juegos por nombre cada vez que se cambia la búsqueda
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const filtered = games.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGames(filtered);
    } else {
      setFilteredGames(games); // Si no hay búsqueda, mostrar todos los juegos
    }
  }, [searchQuery, games]);

  // Obtener las partidas a mostrar en la página actual
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * limitPerPage,
    currentPage * limitPerPage
  );

  const totalPages = Math.ceil(filteredGames.length / limitPerPage);

  return (
    <div className="game-list-container">
      <button className="back-button" onClick={onBack}>Regresar</button>

      <input
        type="text"
        className="search-input"
        placeholder="Buscar partida..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading ? (
        <p>Cargando partidas...</p>
      ) : (
        <div>
          <table className="game-table">
            <thead>
              <tr>
                <th>Nombre de la partida</th>
                <th>Propietario</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGames.map((game) => (
                <tr key={game.id}>
                  <td>{game.name}</td>
                  <td>{game.owner}</td>
                  <td>
                    <button className="select-button" onClick={() => onSelectGame(game)}>
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>

            <span>Página {currentPage} de {totalPages}</span>

            <button
              className="pagination-button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameList;
