// src/app/components/GameEnd.tsx
import React from "react";

interface GameEndProps {
  citizensScore: number;
  enemiesScore: number;
  onReload: () => void;
}

const GameEnd: React.FC<GameEndProps> = ({
  citizensScore,
  enemiesScore,
  onReload,
}) => {
  const winner = citizensScore > enemiesScore ? "Ciudadanos" : "Enemigos";

  return (
    <div className="mt-4">
      <h2>¡Han ganado los {winner}!</h2>
      <p>Ciudadanos: {citizensScore}</p>
      <p>Enemigos: {enemiesScore}</p>

      <button className="btn btn-warning mt-4" onClick={onReload}>
        Recargar página
      </button>
    </div>
  );
};

export default GameEnd;
