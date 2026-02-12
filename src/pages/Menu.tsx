import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const operarioActual = useAppStore((s) => s.operarioActual);
  const cerrarSesion = useAppStore((s) => s.cerrarSesion);

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  const menuItems = [
    { label: '🔍 CONSULTA', route: '/consulta' },
    { label: '📋 INVENTARIO / REGULARIZACIÓN', route: '/inventario', disabled: true },
    { label: '📦 REALIZAR PEDIDO', route: '/pedido', disabled: true },
    { label: '📊 EXPORTAR CSV', route: '', disabled: true },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-primary">
        <span className="text-primary text-lg">OPERARIO: {operarioActual}</span>
        <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4 min-h-0">
          CERRAR SESIÓN
        </button>
      </div>

      {/* Menu buttons */}
      <div className="flex-1 flex flex-col justify-center p-6 gap-4 max-w-lg mx-auto w-full">
        <h2 className="text-primary text-2xl text-center mb-4">MENÚ PRINCIPAL</h2>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => !item.disabled && navigate(item.route)}
            disabled={item.disabled}
            className="btn-primary text-xl min-h-[80px] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {item.label}
            {item.disabled && <span className="block text-xs mt-1 opacity-60">(PRÓXIMAMENTE)</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Menu;
