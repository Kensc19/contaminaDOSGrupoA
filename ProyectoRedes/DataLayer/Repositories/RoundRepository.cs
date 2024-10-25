using Microsoft.EntityFrameworkCore;
using ProyectoRedes.DataLayer.Context;
using ProyectoRedes.DataLayer.Models;

namespace ProyectoRedes.DataLayer.Repositories
{
    public class RoundRepository : IRoundRepository
    {
        private readonly GameDbContext _context;

        public RoundRepository(GameDbContext context)
        {
            _context = context;
        }

        public async Task CreateRound(Round round)
        {
            bool savedSuccessfully = false;
            int retryCount = 0;

            while (!savedSuccessfully && retryCount < 3) // Intentos de reintento
            {
                try
                {
                    _context.Rounds.Add(round);
                    await _context.SaveChangesAsync();
                    savedSuccessfully = true; // Marcamos éxito al guardar
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    retryCount++;
                    Console.WriteLine($"Concurrency Exception: Reintento {retryCount}");

                    foreach (var entry in ex.Entries)
                    {
                        if (entry.Entity is Round)
                        {
                            var databaseValues = await entry.GetDatabaseValuesAsync();

                            if (databaseValues == null)
                            {
                                throw new Exception("Unable to save the changes. The round was deleted.");
                            }

                            entry.OriginalValues.SetValues(databaseValues);
                        }
                    }
                }
            }

            if (!savedSuccessfully)
            {
                throw new Exception("Unable to save the round after multiple retries.");
            }
        }
    }
}