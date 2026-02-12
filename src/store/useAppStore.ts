import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as XLSX from 'xlsx';
import type { ArticuloInventario, Proveedor, RegistroOperacion } from '@/types';

interface AppState {
  inventario: ArticuloInventario[];
  proveedores: Proveedor[];
  operarioActual: string | null;
  operarios: string[];
  registros: RegistroOperacion[];
  excelCargado: boolean;

  cargarExcel: (file: File) => Promise<{ articulos: number; proveedores: number }>;
  setOperario: (nombre: string) => void;
  cerrarSesion: () => void;
  resetearSesion: () => void;
  agregarOperario: (nombre: string) => void;
  agregarRegistro: (registro: RegistroOperacion) => void;
  actualizarInventario: (codigo: string, datos: Partial<ArticuloInventario>) => void;
  agregarArticulo: (articulo: ArticuloInventario) => void;
  exportarCSV: () => void;
  borrarRegistros: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      inventario: [],
      proveedores: [],
      operarioActual: null,
      operarios: JSON.parse(localStorage.getItem('operarios') || '["OPERARIO 1", "OPERARIO 2"]'),
      registros: [],
      excelCargado: false,

      cargarExcel: async (file: File) => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const wsInventario = workbook.Sheets['INVENTARIO'];
        if (!wsInventario) throw new Error('No se encontró la hoja INVENTARIO');

        const inventarioRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsInventario);
        const inventario: ArticuloInventario[] = inventarioRaw.map((row) => ({
          CODIGO: String(row['CODIGO'] ?? '').toUpperCase(),
          DESCRIPCION: String(row['DESCRIPCION'] ?? '').toUpperCase(),
          STOCK_ACTUAL: Number(row['STOCK ACTUAL'] ?? 0),
          UBICACION: String(row['UBICACION'] ?? '').toUpperCase(),
        }));

        const proveedores: Proveedor[] = workbook.SheetNames
          .filter((name) => name !== 'INVENTARIO')
          .map((nombre) => {
            const ws = workbook.Sheets[nombre];
            const articulosRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
            const articulos = articulosRaw.map((row) => ({
              CODIGO: String(row['CODIGO'] ?? '').toUpperCase(),
              DESCRIPCION: String(row['DESCRIPCION'] ?? '').toUpperCase(),
              PRECIO: Number(row['PRECIO'] ?? 0),
              PVP: Number(row['PVP'] ?? 0),
            }));
            return { nombre, articulos };
          });

        set({ inventario, proveedores, excelCargado: true });
        return { articulos: inventario.length, proveedores: proveedores.length };
      },

      setOperario: (nombre: string) => {
        set({ operarioActual: nombre.toUpperCase() });
      },

      cerrarSesion: () => {
        set({ operarioActual: null });
      },

      resetearSesion: () => {
        set({ operarioActual: null, registros: [], inventario: [], proveedores: [], excelCargado: false });
      },

      agregarOperario: (nombre: string) => {
        const upper = nombre.toUpperCase();
        const current = get().operarios;
        if (!current.includes(upper)) {
          const updated = [...current, upper];
          set({ operarios: updated });
          localStorage.setItem('operarios', JSON.stringify(updated));
        }
      },

      agregarRegistro: (registro: RegistroOperacion) => {
        set((state) => ({ registros: [...state.registros, registro] }));
      },

      actualizarInventario: (codigo: string, datos: Partial<ArticuloInventario>) => {
        set((state) => ({
          inventario: state.inventario.map((a) =>
            a.CODIGO === codigo ? { ...a, ...datos } : a
          ),
        }));
      },

      agregarArticulo: (articulo: ArticuloInventario) => {
        set((state) => ({ inventario: [...state.inventario, articulo] }));
      },

      exportarCSV: () => {
        const { registros, operarioActual } = get();
        if (registros.length === 0) return;

        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
        const nombreArchivo = `SGA_${fecha}_${hora}_${operarioActual || 'SIN_OPERARIO'}.csv`;

        let csv = 'FECHA_HORA;OPERARIO;CODIGO;DESCRIPCION;TIPO_OPERACION;STOCK_ANTERIOR;STOCK_REAL;DIFERENCIA;UBICACION_ANTERIOR;UBICACION_NUEVA;PROVEEDOR;CANTIDAD_PEDIDO\n';

        registros.forEach((r) => {
          csv += `${r.FECHA_HORA};${r.OPERARIO};${r.CODIGO};${r.DESCRIPCION};${r.TIPO_OPERACION};`;
          csv += `${r.STOCK_ANTERIOR ?? ''};${r.STOCK_REAL ?? ''};${r.DIFERENCIA ?? ''};`;
          csv += `${r.UBICACION_ANTERIOR ?? ''};${r.UBICACION_NUEVA ?? ''};`;
          csv += `${r.PROVEEDOR ?? ''};${r.CANTIDAD_PEDIDO ?? ''}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nombreArchivo;
        link.click();
        URL.revokeObjectURL(link.href);
      },

      borrarRegistros: () => {
        set({ registros: [] });
      },
    }),
    {
      name: 'sga-jcb-storage',
      partialize: (state) => ({
        operarioActual: state.operarioActual,
        registros: state.registros,
        operarios: state.operarios,
      }),
    }
  )
);
