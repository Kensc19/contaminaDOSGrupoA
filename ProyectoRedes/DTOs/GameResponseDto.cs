using ProyectoRedes.DataLayer.Models;

namespace ProyectoRedes.DTOs
{
    public class GameResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Status { get; set; }
        public bool HasPassword { get; set; }
        public Guid? CurrentRound { get; set; }
        public List<Player> Players { get; set; }  
        public List<Enemy> Enemies { get; set; }  
    }
}

