import React, { useState, useEffect } from "react";

interface Game {
  id?: string;
  name: string;
  owner: string;
}

interface gameListProps {
  onSelectGame: (game: Game) => void;
  onBack: () => void;
}

const GameList: React.FC<gameListProps> = ({ onSelectGame, onBack }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15; // Limitar a 15 juegos por página

  useEffect(() => {
    fetchGames(currentPage);
  }, [currentPage]);

  // Efecto para filtrar los juegos localmente
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const filtered = games.filter((game) =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setGames(filtered);
    } else {
      fetchGames(currentPage); // Si la búsqueda está vacía o es muy corta, vuelve a cargar los juegos
    }
  }, [searchQuery]);

  // Función para obtener los juegos
  const fetchGames = async (page: number) => {
    try {
      const response = await fetch(
        `https://contaminados.akamai.meseguercr.com/api/games?page=${page + 1}&limit=${limit}`
      );
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        setGames(data.data); // Guardar los juegos obtenidos
        setTotalPages(Math.ceil(data.total / limit)); // Calcular el total de páginas
      }
    } catch (error) {
      throw new Error("Error fetching games:"+ error);
    }
  };

  // Función que se activa al hacer clic en "Buscar"
  const handleSearch = () => {
    setCurrentPage(0); // Reiniciamos a la primera página al realizar una nueva búsqueda
    fetchGames(0); // Buscar desde la primera página
  };

  return (
    <div className="mt-4">
      <h2>Lista de Partidas Disponibles</h2>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar partidas..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)} // Actualizamos el término de búsqueda
      />
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nombre de la Partida</th>
            <th>Propietario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {games.length > 0 ? (
            games.map((game) => (
              <tr key={game.id}>
                <td>{game.name}</td>
                <td>{game.owner}</td>
                <td className="text-end">
                  <button
                    className="btn btn-success"
                    onClick={() => onSelectGame(game)}
                  >
                    Unirse
                  </button>
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
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Anterior
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage + 1 >= totalPages}
        >
          Siguiente
        </button>
      </div>
      <button type="button" className="btn btn-secondary mt-3" onClick={onBack}>
        Volver
      </button>
    </div>
  );
};

export default GameList;
