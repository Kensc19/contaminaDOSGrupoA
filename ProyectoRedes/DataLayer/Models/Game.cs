using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace ProyectoRedes.DataLayer.Models
{
    public class Game
    {
        [Key]
        public Guid Id { get; set; }

        [Column("name")]
        public string Name { get; set; }

        // Aquí almacenamos la contraseña como string
        [Column("password")]
        public string? Password { get; set; }

        [Column("status")]
        public string Status { get; set; }

        [Column("current_round")]
        public Guid? CurrentRound { get; set; }

        [NotMapped]
        public bool HasPassword => !string.IsNullOrEmpty(Password);

        // Navigation properties
        public List<Player> Players { get; set; }
        public List<Enemy> Enemies { get; set; }
    }
}
