using Microsoft.AspNetCore.Mvc;
using ProyectoRedes.DTOs;
using ProyectoRedes.Services;

namespace ProyectoRedes.Controllers
{
    [ApiController]
    [Route("api/games")]
    public class GameController : Controller
    {
        private readonly IGameService _gameService;

        public GameController(IGameService gameService)
        {
            _gameService = gameService;
        }
        [HttpPost]
        public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
        {
            var game = await _gameService.CreateGame(request.Name, request.Owner, request.Password);

            return CreatedAtAction(nameof(GetGame), new { gameId = game.Id }, new
            {
                status = 201,
                msg = "Game Created",
                data = new
                {
                    game.Id,
                    game.Name,
                    game.Status,
                    password = game.HasPassword,  
                    game.CurrentRound,
                    Players = game.Players.Select(p => p.PlayerName).ToList(),
                    Enemies = game.Enemies.Select(e => e.EnemyName).ToList()
                }
            });
        }


        [HttpGet]
        public async Task<IActionResult> GetGames([FromQuery] string? name, [FromQuery] string? status = "lobby", [FromQuery] int page = 0, [FromQuery] int limit = 50)
        {
            var games = await _gameService.SearchGames(name, status, page, limit);

            var result = games.Select(game => new
            {
                game.Id,
                game.Name,
                game.Status,
                password = game.HasPassword,
                game.CurrentRound,
                Players = game.Players.Select(p => p.PlayerName).ToList(),
                Enemies = game.Enemies.Select(e => e.EnemyName).ToList()
            });

            return Ok(new { status = 200, msg = "Games Retrieved", data = result });
        }



        [HttpGet("{gameId}")]
        public async Task<IActionResult> GetGame([FromRoute] Guid gameId, [FromHeader] string password, [FromHeader] string player)
        {
            // Lógica para obtener el juego por ID
            var game = await _gameService.GetGameById(gameId);
            if (game == null)
                return NotFound(new { status = 404, msg = "Game not found" });

            if (game.HasPassword && game.Password != password)
            {
                return Unauthorized(new { status = 401, msg = "Invalid password" });
            }

            var playerExists = game.Players.Any(p => p.PlayerName == player);
            if (!playerExists)
            {
                return Unauthorized(new { status = 401, msg = "Player not in the game" });
            }

            return Ok(new
            {
                status = 200,
                msg = "Game Retrieved",
                data = new
                {
                    game.Id,
                    game.Name,
                    game.Status,
                    password = game.HasPassword,
                    game.CurrentRound,
                    Players = game.Players.Select(p => p.PlayerName).ToList(),
                    Enemies = game.Enemies.Select(e => e.EnemyName).ToList()
                }
            });
        }


        [HttpPut("{gameId}")]
        public async Task<IActionResult> JoinGame(Guid gameId, [FromHeader(Name = "player")] string playerHeader, [FromHeader] string? password, [FromBody] JoinGameRequest request)
        {
            try
            {
                if (playerHeader != request.Player)
                {
                    return BadRequest(new
                    {
                        status = 400,
                        msg = "Player name in the header and body must be the same"
                    });
                }

                var game = await _gameService.JoinGame(gameId, request.Player, password);

                return Ok(new
                {
                    status = 200,
                    msg = "Player joined successfully",
                    data = new
                    {
                        game.Id,
                        game.Name,
                        game.Status,
                        game.CurrentRound,
                        Players = game.Players.Select(p => p.PlayerName).ToList(),
                        Enemies = game.Enemies.Select(e => e.EnemyName).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    status = 400,
                    msg = ex.Message
                });
            }
        }

        [HttpHead("{gameId}/start")]
        public async Task<IActionResult> StartGame(Guid gameId, [FromHeader] string player, [FromHeader] string password)
        {
            try
            {
                // Obtener el juego por ID para verificar la contraseña
                var game = await _gameService.GetGameById(gameId);
                if (game == null)
                {
                    Response.Headers.Add("X-msg", "Game not found.");
                    return StatusCode(404, new { status = 404, msg = "Game not found." });
                }

                // Verificar la contraseña
                if (game.HasPassword && game.Password != password)
                {
                    Response.Headers.Add("X-msg", "Invalid password.");
                    return StatusCode(401, new { status = 401, msg = "Unauthorized: Incorrect password." });
                }

                // Llamar al servicio para crear una nueva ronda
                await _gameService.StartGame(gameId, player);

                // Incluir una cabecera para indicar éxito
                Response.Headers.Add("X-msg", "Round created successfully.");
                return Ok(new { status = 200, msg = "Round created successfully." });
            }
            catch (Exception ex)
            {
                // Capturar más detalles del error
                Response.Headers.Add("X-msg", $"Error: {ex.Message}");
                return BadRequest(new
                {
                    status = 400,
                    msg = $"Error: {ex.Message}",
                    detail = ex.InnerException?.Message ?? "",
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}
