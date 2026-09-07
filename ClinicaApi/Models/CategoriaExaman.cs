using System;
using System.Collections.Generic;

namespace ClinicaApi.Models;

public partial class CategoriaExaman
{
    public int IdCategoria { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public virtual ICollection<SignoClinico> SignoClinicos { get; set; } = new List<SignoClinico>();
}
