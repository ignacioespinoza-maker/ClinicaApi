using System;
using System.Collections.Generic;

namespace ClinicaApi.Models;

public partial class SignoClinico
{
    public int IdSigno { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public int IdCategoria { get; set; }

    public virtual ICollection<Evaluacion> Evaluacions { get; set; } = new List<Evaluacion>();

    public virtual CategoriaExaman IdCategoriaNavigation { get; set; } = null!;
}
