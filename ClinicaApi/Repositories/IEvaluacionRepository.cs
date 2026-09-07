using ClinicaApi.Models;

namespace ClinicaApi.Repositories
{
    public interface IEvaluacionRepository
    {
        Task<IEnumerable<Evaluacion>> GetAllAsync();
        Task<Evaluacion?> GetByIdAsync(int id);
        Task<Evaluacion> AddAsync(Evaluacion evaluacion);
        Task UpdateAsync(Evaluacion evaluacion);
        Task DeleteAsync(Evaluacion evaluacion);
    }
}