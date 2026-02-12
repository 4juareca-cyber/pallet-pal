import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const operarioActual = useAppStore((s) => s.operarioActual);
  const registros = useAppStore((s) => s.registros);
  const cerrarSesion = useAppStore((s) => s.cerrarSesion);
  const resetearSesion = useAppStore((s) => s.resetearSesion);
  const exportarCSV = useAppStore((s) => s.exportarCSV);
  const borrarRegistros = useAppStore((s) => s.borrarRegistros);

  const [modalCerrar, setModalCerrar] = useState(false);
  const [modalExport, setModalExport] = useState(false);

  const handleExportCSV = () => {
    if (registros.length === 0) return;
    exportarCSV();
    setModalExport(true);
  };

  const menuItems = [
    { label: '🔍 CONSULTA', route: '/consulta', disabled: false },
    { label: '📋 INVENTARIO / REGULARIZACIÓN', route: '/inventario', disabled: false },
    { label: '📦 REALIZAR PEDIDO', route: '/pedido', disabled: false },
    { label: `📊 EXPORTAR CSV (${registros.length})`, action: handleExportCSV, disabled: registros.length === 0 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-primary">
        <span className="text-primary text-lg">OPERARIO: {operarioActual}</span>
        <button onClick={() => setModalCerrar(true)} className="btn-secondary text-sm py-2 px-4 min-h-0">
          CERRAR SESIÓN ✕
        </button>
      </div>

      {/* Menu buttons */}
      <div className="flex-1 flex flex-col justify-center p-6 gap-4 max-w-lg mx-auto w-full">
        <h2 className="text-primary text-2xl text-center mb-4">MENÚ PRINCIPAL</h2>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.disabled) return;
              if (item.action) item.action();
              else if (item.route) navigate(item.route);
            }}
            disabled={item.disabled}
            className="btn-primary text-xl min-h-[80px] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Modal cerrar sesión */}
      <Dialog open={modalCerrar} onOpenChange={setModalCerrar}>
        <DialogContent className="bg-card border-primary">
          <DialogHeader>
            <DialogTitle className="text-primary text-2xl text-center">
              ¿CÓMO CERRAR LA SESIÓN?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <button
              onClick={() => {
                cerrarSesion();
                setModalCerrar(false);
                navigate('/login');
              }}
              className="btn-primary w-full"
            >
              GUARDAR SESIÓN EN MEMORIA
              <span className="block text-xs mt-1 opacity-70">
                (MANTENER {registros.length} REGISTROS)
              </span>
            </button>
            <button
              onClick={() => {
                resetearSesion();
                setModalCerrar(false);
                navigate('/login');
              }}
              className="bg-destructive text-destructive-foreground w-full p-4 font-bold rounded min-h-[60px] transition-all hover:brightness-110 active:scale-95"
            >
              BORRAR TODO - NUEVA JORNADA
            </button>
            <button
              onClick={() => setModalCerrar(false)}
              className="btn-secondary w-full"
            >
              CANCELAR
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal post-exportación */}
      <Dialog open={modalExport} onOpenChange={setModalExport}>
        <DialogContent className="bg-card border-primary">
          <DialogHeader>
            <DialogTitle className="text-green-500 text-2xl text-center">
              ✓ ARCHIVO EXPORTADO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-foreground text-center text-lg">
              ¿DESEAS BORRAR LOS REGISTROS TEMPORALES?
            </p>
            <button
              onClick={() => {
                borrarRegistros();
                setModalExport(false);
              }}
              className="btn-primary w-full"
            >
              SÍ, BORRAR
            </button>
            <button
              onClick={() => setModalExport(false)}
              className="btn-secondary w-full"
            >
              NO, MANTENER
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Menu;
