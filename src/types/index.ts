export interface ArticuloInventario {
  CODIGO: string;
  DESCRIPCION: string;
  STOCK_ACTUAL: number;
  UBICACION: string;
}

export interface ArticuloProveedor {
  CODIGO: string;
  DESCRIPCION: string;
  PRECIO: number;
  PVP: number;
}

export interface Proveedor {
  nombre: string;
  articulos: ArticuloProveedor[];
}

export interface RegistroOperacion {
  FECHA_HORA: string;
  OPERARIO: string;
  CODIGO: string;
  DESCRIPCION: string;
  TIPO_OPERACION: 'CONSULTA' | 'INVENTARIO' | 'PEDIDO';
  STOCK_ANTERIOR: number | null;
  STOCK_REAL: number | null;
  DIFERENCIA: number | null;
  UBICACION_ANTERIOR: string | null;
  UBICACION_NUEVA: string | null;
  PROVEEDOR: string | null;
  CANTIDAD_PEDIDO: number | null;
}
