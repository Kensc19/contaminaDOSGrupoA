using ProyectoRedes.DTOs;
using ProyectoRedes.DataLayer.Models;

namespace ProyectoRedes.Services
{
    public interface IGameService
    {
        Task<Game> CreateGame(string name, string owner, string password);
        Task<IEnumerable<GameResponseDto>> GetAllGames();
        Task<IEnumerable<GameResponseDto>> SearchGames(string? name, string? status, int page, int limit);
        Task<Game> GetGameById(Guid gameId);
        Task<Game> JoinGame(Guid gameId, string playerName, string? password);
        Task UpdateGame(Game game);  
        Task StartGame(Guid gameId, string player);  
    }
}
