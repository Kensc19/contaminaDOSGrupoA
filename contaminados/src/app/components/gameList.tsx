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

const gameList: React.FC<gameListProps> = ({ onSelectGame, onBack }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 15;

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch(
        "https://contaminados.akamai.meseguercr.com/api/games?page=1&limit=250"
      );
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        setGames(data.data);
        setFilteredGames(data.data.slice(0, limit));
      }
    } catch (error) {
      throw new Error("Error fetching games:" + error);
    }
  };

  const handleSearch = (page = 0) => {
    if (searchQuery.length >= 3) {
      const filtered = games.filter((game) =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGames(filtered.slice(page * limit, (page + 1) * limit));
      setCurrentPage(page);
    } else {
      setFilteredGames(games.slice(page * limit, (page + 1) * limit));
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    handleSearch(0);
  }, [searchQuery]);

  return (
    <div className="mt-4">
      <h2>Lista de Partidas Disponibles</h2>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar partidas..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch(0);
          }
        }}
      />
      <button
        type="button"
        className="btn btn-primary mb-3"
        onClick={() => handleSearch(0)}
      >
        Buscar
      </button>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nombre de la Partida</th>
            <th>Propietario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
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
      <button type="button" className="btn btn-secondary mt-3" onClick={onBack}>
        Volver
      </button>
    </div>
  );
};

export default gameList;
