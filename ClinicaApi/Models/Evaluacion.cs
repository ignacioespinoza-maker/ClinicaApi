using System;
using System.Collections.Generic;

namespace ClinicaApi.Models;

public partial class Evaluacion
{
    public int IdEvaluacion { get; set; }

    public DateTime FechaEvaluacion { get; set; }

    public string Observaciones { get; set; } = null!;

    public string Resultado { get; set; } = null!;

    public int IdPaciente { get; set; }

    public int IdUsuario { get; set; }

    public int IdSigno { get; set; }

    public virtual Paciente IdPacienteNavigation { get; set; } = null!;

    public virtual SignoClinico IdSignoNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
