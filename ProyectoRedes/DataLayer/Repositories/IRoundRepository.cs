using ProyectoRedes.DataLayer.Models;

namespace ProyectoRedes.DataLayer.Repositories
{
    public interface IRoundRepository
    {
        Task CreateRound(Round round);
    }
}
