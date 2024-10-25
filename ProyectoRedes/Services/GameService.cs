using ProyectoRedes.DTOs;
using ProyectoRedes.DataLayer.Models;
using ProyectoRedes.DataLayer.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ProyectoRedes.Services
{
    public class GameService : IGameService
    {
        private readonly IGameRepository _gameRepository;
        private readonly IPlayerRepository _playerRepository;
        private readonly IRoundRepository _roundRepository;
        private readonly IEnemyRepository _enemyRepository;

        public GameService(IGameRepository gameRepository, IPlayerRepository playerRepository, IRoundRepository roundRepository, IEnemyRepository enemyRepository)
        {
            _gameRepository = gameRepository;
            _playerRepository = playerRepository;
            _roundRepository = roundRepository;
            _enemyRepository = enemyRepository;
        }

        public async Task<Game> CreateGame(string name, string owner, string? password)
        {
            var game = new Game
            {
                Id = Guid.NewGuid(),
                Name = name,
                Password = password,
                Status = "lobby",
                Players = new List<Player>
        {
            new Player { Id = Guid.NewGuid(), PlayerName = owner }
        },
                Enemies = new List<Enemy>()
            };

            await _gameRepository.CreateGame(game);
            return game;
        }

        public async Task<IEnumerable<GameResponseDto>> GetAllGames()
        {
            var games = await _gameRepository.GetAllGames();

            return games.Select(g => new GameResponseDto
            {
                Id = g.Id,
                Name = g.Name,
                Status = g.Status,
                HasPassword = g.HasPassword,
                CurrentRound = g.CurrentRound,
                Players = g.Players.ToList(),
                Enemies = g.Enemies.ToList()
            });
        }

        public async Task<Game> GetGameById(Guid gameId)
        {
            return await _gameRepository.GetGameById(gameId);
        }

        public async Task<Game> JoinGame(Guid gameId, string playerName, string? password)
        {
            var game = await _gameRepository.GetGameById(gameId);

            if (game == null)
                throw new Exception("Game not found");

            if (game.HasPassword && game.Password != password)
                throw new Exception("Invalid password");

            var existingPlayer = await _playerRepository.GetPlayerByGameAndName(gameId, playerName);
            if (existingPlayer != null)
                throw new Exception("Player is already in the game");

            var newPlayer = new Player
            {
                Id = Guid.NewGuid(),
                PlayerName = playerName,
                GameId = gameId,
                CreatedAt = DateTime.Now
            };

            await _playerRepository.AddPlayer(newPlayer);

            return game; // Retorna el juego modificado
        }

        public async Task UpdateGame(Game game)
        {
            await _gameRepository.UpdateGame(game);
        }

        public async Task<IEnumerable<GameResponseDto>> SearchGames(string? name, string? status, int page, int limit)
        {
            var games = await _gameRepository.SearchGames(name, status, page, limit);

            return games.Select(g => new GameResponseDto
            {
                Id = g.Id,
                Name = g.Name,
                Status = g.Status,
                HasPassword = g.HasPassword,
                CurrentRound = g.CurrentRound,
                Players = g.Players.ToList(),  // Devuelve la lista completa de Player
                Enemies = g.Enemies.ToList()   // Devuelve la lista completa de Enemy
            });
        }
        public async Task StartGame(Guid gameId, string playerName)
        {
            // Retrieve the game and its players
            var game = await _gameRepository.GetGameById(gameId);

            if (game == null)
                throw new Exception("Game not found");

            int numPlayers = game.Players.Count;

            // Determine the number of enemies based on the number of players
            int numEnemies = numPlayers switch
            {
                5 or 6 => 2,
                7 or 8 or 9 => 3,
                10 => 4,
                _ => throw new Exception("Invalid number of players. Must be between 5 and 10.")
            };

            // Make sure the game has enough players
            if (numPlayers < 5 || numPlayers > 10)
                throw new Exception("Invalid number of players. Game must have between 5 and 10 players.");

            // Select the required number of random players to be enemies
            Random random = new Random();
            var selectedEnemies = game.Players
                .OrderBy(p => random.Next())
                .Take(numEnemies)
                .ToList();

            // Create enemy entries for the selected players
            foreach (var enemyPlayer in selectedEnemies)
            {
                var enemy = new Enemy
                {
                    Id = Guid.NewGuid(),
                    GameId = gameId,
                    EnemyName = enemyPlayer.PlayerName, // Use the player's name as the enemy name
                };

                // Insert the enemy into the Enemies table using the repository
                await _enemyRepository.AddEnemy(enemy);
            }

            // Create a new round as before
            var newRound = new Round
            {
                Id = Guid.NewGuid(),
                GameId = gameId,
                Leader = playerName,
                Status = "waiting-on-leader",
                Result = "none",
                Phase = "vote1",
                CreatedAt = DateTime.Now
            };

            Console.WriteLine("Creating new round:");
            Console.WriteLine($"Round Id: {newRound.Id}");
            Console.WriteLine($"Game Id: {newRound.GameId}");
            Console.WriteLine($"Leader: {newRound.Leader}");
            Console.WriteLine($"Status: {newRound.Status}");
            Console.WriteLine($"Result: {newRound.Result}");
            Console.WriteLine($"Phase: {newRound.Phase}");
            Console.WriteLine($"Created At: {newRound.CreatedAt}");

            // Register the round in the database
            await _roundRepository.CreateRound(newRound);
        }
    }
}

