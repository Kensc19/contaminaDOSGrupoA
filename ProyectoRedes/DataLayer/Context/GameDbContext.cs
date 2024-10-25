using Microsoft.EntityFrameworkCore;
using ProyectoRedes.DataLayer.Models;
using System.Collections.Generic;

namespace ProyectoRedes.DataLayer.Context
{
    public class GameDbContext : DbContext
    {
        public GameDbContext(DbContextOptions<GameDbContext> options) : base(options) { }

        public DbSet<Game> Games { get; set; }
        public DbSet<Player> Players { get; set; }
        public DbSet<Enemy> Enemies { get; set; }
        public DbSet<Round> Rounds { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Mapear la entidad Game a la tabla games
            modelBuilder.Entity<Game>()
                .ToTable("games")
                .Property(g => g.Id).HasColumnName("id");
            modelBuilder.Entity<Game>()
                .Property(g => g.Name).HasColumnName("name");
            modelBuilder.Entity<Game>()
                .Property(g => g.Password).HasColumnName("password");
            modelBuilder.Entity<Game>()
                .Property(g => g.Status).HasColumnName("status");
            modelBuilder.Entity<Game>()
                .Property(g => g.CurrentRound).HasColumnName("current_round");

            // Mapear la entidad Player a la tabla players
            modelBuilder.Entity<Player>()
                .ToTable("players")
                .Property(p => p.GameId).HasColumnName("game_id");
            modelBuilder.Entity<Player>()
                .Property(p => p.PlayerName).HasColumnName("player_name");

            // Mapear la entidad Enemy a la tabla enemies
            modelBuilder.Entity<Enemy>()
                .ToTable("enemies")
                .Property(e => e.GameId).HasColumnName("game_id");
            modelBuilder.Entity<Enemy>()
                .Property(e => e.EnemyName).HasColumnName("enemy_name");

            // Mapear la entidad Round a la tabla rounds
            modelBuilder.Entity<Round>()
                   .ToTable("rounds")
                   .Property(r => r.Id) // Mapeo del Id
                   .HasColumnName("id")
                   .IsRequired();

            modelBuilder.Entity<Round>()
                .Property(r => r.GameId)
                .HasColumnName("game_id")
                .IsRequired();

            modelBuilder.Entity<Round>()
                .Property(r => r.Leader)
                .HasColumnName("leader")
                .IsRequired();

            modelBuilder.Entity<Round>()
                .Property(r => r.Status)
                .HasColumnName("status")
                .HasDefaultValue("waiting-on-leader");

            modelBuilder.Entity<Round>()
                .Property(r => r.Result)
                .HasColumnName("result")
                .HasDefaultValue("none");

            modelBuilder.Entity<Round>()
                .Property(r => r.Phase)
                .HasColumnName("phase")
                .HasDefaultValue("vote1");

            modelBuilder.Entity<Round>()
                .Property(r => r.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("GETDATE()");

        }
    }
}