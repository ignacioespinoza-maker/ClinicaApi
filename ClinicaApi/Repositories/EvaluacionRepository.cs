using ClinicaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicaApi.Repositories
{
    public class EvaluacionRepository : IEvaluacionRepository
    {
        private readonly EvaluacionesClinicasDbContext _context;

        public EvaluacionRepository(EvaluacionesClinicasDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Evaluacion>> GetAllAsync()
        {
            return await _context.Evaluacions
                .Include(e => e.IdPacienteNavigation)
                .Include(e => e.IdSignoNavigation)
                .Include(e => e.IdUsuarioNavigation)
                .AsNoTracking()
                .OrderByDescending(e => e.FechaEvaluacion)
                .ToListAsync();
        }

        public async Task<Evaluacion?> GetByIdAsync(int id)
        {
            return await _context.Evaluacions
                .Include(e => e.IdPacienteNavigation)
                .Include(e => e.IdSignoNavigation)
                .Include(e => e.IdUsuarioNavigation)
                .FirstOrDefaultAsync(e => e.IdEvaluacion == id);
        }

        public async Task<Evaluacion> AddAsync(Evaluacion evaluacion)
        {
            _context.Evaluacions.Add(evaluacion);
            await _context.SaveChangesAsync();
            return evaluacion;
        }

        public async Task UpdateAsync(Evaluacion evaluacion)
        {
            _context.Evaluacions.Update(evaluacion);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Evaluacion evaluacion)
        {
            _context.Evaluacions.Remove(evaluacion);
            await _context.SaveChangesAsync();
        }
    }
}