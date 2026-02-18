import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jcb_proveedores_custom';
const DEFAULT_PROVEEDORES = ['JCB', 'GREGOIRE', 'CORVUS'];

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProveedores(JSON.parse(stored));
      } catch {
        setProveedores(DEFAULT_PROVEEDORES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROVEEDORES));
      }
    } else {
      setProveedores(DEFAULT_PROVEEDORES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROVEEDORES));
    }
  }, []);

  const addProveedor = (nombre: string): { success: boolean; error?: string } => {
    const normalizado = nombre.trim().toUpperCase();
    if (!normalizado) return { success: false, error: 'EL NOMBRE NO PUEDE ESTAR VACÍO' };
    if (proveedores.includes(normalizado)) return { success: false, error: 'EL PROVEEDOR YA EXISTE' };

    const nuevaLista = [...proveedores, normalizado].sort();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
    setProveedores(nuevaLista);
    return { success: true };
  };

  const deleteProveedor = (nombre: string): { success: boolean; error?: string } => {
    if (proveedores.length <= 1) return { success: false, error: 'DEBE EXISTIR AL MENOS UN PROVEEDOR' };
    const nuevaLista = proveedores.filter((p) => p !== nombre);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
    setProveedores(nuevaLista);
    return { success: true };
  };

  return { proveedores, addProveedor, deleteProveedor };
};
