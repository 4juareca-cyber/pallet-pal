import { create } from 'zustand';
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
  agregarOperario: (nombre: string) => void;
  agregarRegistro: (registro: RegistroOperacion) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  inventario: [],
  proveedores: [],
  operarioActual: null,
  operarios: JSON.parse(localStorage.getItem('operarios') || '["OPERARIO 1", "OPERARIO 2"]'),
  registros: [],
  excelCargado: false,

  cargarExcel: async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Leer INVENTARIO
    const wsInventario = workbook.Sheets['INVENTARIO'];
    if (!wsInventario) throw new Error('No se encontró la hoja INVENTARIO');

    const inventarioRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsInventario);
    const inventario: ArticuloInventario[] = inventarioRaw.map((row) => ({
      CODIGO: String(row['CODIGO'] ?? '').toUpperCase(),
      DESCRIPCION: String(row['DESCRIPCION'] ?? '').toUpperCase(),
      STOCK_ACTUAL: Number(row['STOCK ACTUAL'] ?? 0),
      UBICACION: String(row['UBICACION'] ?? '').toUpperCase(),
    }));

    // Leer PROVEEDORES
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
    localStorage.setItem('operarioActual', nombre.toUpperCase());
  },

  cerrarSesion: () => {
    set({ operarioActual: null });
    localStorage.removeItem('operarioActual');
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
}));
