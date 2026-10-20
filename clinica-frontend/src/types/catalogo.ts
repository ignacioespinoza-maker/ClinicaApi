export interface CategoriaExamen {
  idCategoria: number;
  nombre: string;
  descripcion?: string | null;
}

export interface SignoClinico {
  idSigno: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string;
  idCategoria?: number;
}

export interface CrearCategoriaRequest {
  nombre: string;
  descripcion?: string | null;
}

export interface CrearSignoRequest {
  nombre: string;
  descripcion?: string | null;
  idCategoria: number;
}
