import * as XLSX from 'xlsx';

export interface ItemInventarioExport {
  CODIGO: string;
  DESCRIPCION: string;
  STOCK_ACTUAL: number;
  STOCK_REAL: number;
  NUEVA_UBICACION: string;
}

export interface ItemPedidoExport {
  CODIGO: string;
  DESCRIPCION: string;
  UBICACION: string;
  STOCK_ACTUAL: number;
  CANTIDAD: number;
}

function getNow() {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-ES').replace(/\//g, '-');
  const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-');
  return { fecha, hora };
}

export const exportInventario = (data: ItemInventarioExport[], usuario: string) => {
  const { fecha, hora } = getNow();

  const rows = data.map((item) => ({
    USUARIO: usuario,
    FECHA: fecha,
    HORA: hora,
    CODIGO: item.CODIGO,
    DESCRIPCION: item.DESCRIPCION,
    'STOCK ACTUAL': item.STOCK_ACTUAL,
    'STOCK REAL': item.STOCK_REAL,
    'NUEVA UBICACION': item.NUEVA_UBICACION,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'INVENTARIO');

  const fileName = `INVENTARIO_${usuario}_${fecha}_${hora}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportPedidos = (
  data: ItemPedidoExport[],
  usuario: string,
  proveedor: string,
  tipoPedido: string
) => {
  const { fecha, hora } = getNow();

  const metadatos = [
    ['USUARIO', usuario],
    ['FECHA', fecha],
    ['HORA', hora],
    ['PROVEEDOR', proveedor],
    ['TIPO DE PEDIDO', tipoPedido],
    ['TOTAL LINEAS', data.length],
    [],
    ['CODIGO', 'DESCRIPCION', 'UBICACION', 'STOCK ACTUAL', 'CANTIDAD PEDIDA'],
  ];

  const filas = data.map((item) => [
    item.CODIGO,
    item.DESCRIPCION,
    item.UBICACION,
    item.STOCK_ACTUAL,
    item.CANTIDAD,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...metadatos, ...filas]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PEDIDO');

  const fileName = `PEDIDO_${proveedor}_${tipoPedido}_${fecha}_${hora}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
