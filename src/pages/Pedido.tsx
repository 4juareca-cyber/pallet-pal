import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useOrientation } from '@/hooks/useOrientation';
import NumPad from '@/components/NumPad';
import type { Proveedor } from '@/types';

interface LineaPedido {
  CODIGO: string;
  DESCRIPCION: string;
  stockActual: number;
  pvp: number;
  cantidad: number;
}

type Paso = 'seleccion' | 'escaneo';

const Pedido: React.FC = () => {
  const navigate = useNavigate();
  const isLandscape = useOrientation();
  const inventario = useAppStore((s) => s.inventario);
  const proveedores = useAppStore((s) => s.proveedores);
  const operarioActual = useAppStore((s) => s.operarioActual);
  const agregarRegistro = useAppStore((s) => s.agregarRegistro);

  const [paso, setPaso] = useState<Paso>('seleccion');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [tipoPedido, setTipoPedido] = useState('');

  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [campoActivo, setCampoActivo] = useState<'codigo' | 'cantidad'>('codigo');
  const [articuloInfo, setArticuloInfo] = useState<{ CODIGO: string; DESCRIPCION: string; stockActual: number; pvp: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lineasPedido, setLineasPedido] = useState<LineaPedido[]>([]);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);

  const buscarArticulo = useCallback(() => {
    if (!codigo.trim() || !proveedorSeleccionado) return;
    const searchCode = codigo.toUpperCase().trim();

    const enProveedor = proveedorSeleccionado.articulos.find(
      (a) => a.CODIGO === searchCode || a.CODIGO === `JCB-${searchCode}`
    );

    if (!enProveedor) {
      setErrorMsg('CÓDIGO NO DISPONIBLE EN ESTE PROVEEDOR');
      setArticuloInfo(null);
      return;
    }

    const enInventario = inventario.find((a) => a.CODIGO === enProveedor.CODIGO);

    setArticuloInfo({
      CODIGO: enProveedor.CODIGO,
      DESCRIPCION: enProveedor.DESCRIPCION,
      stockActual: enInventario?.STOCK_ACTUAL || 0,
      pvp: enProveedor.PVP,
    });
    setErrorMsg('');
    setCampoActivo('cantidad');
    setCantidad('');
  }, [codigo, proveedorSeleccionado, inventario]);

  const anadirAPedido = () => {
    if (!articuloInfo || !cantidad || parseFloat(cantidad) <= 0) return;

    setLineasPedido((prev) => [
      ...prev,
      { ...articuloInfo, cantidad: parseFloat(cantidad) },
    ]);

    setCodigo('');
    setCantidad('');
    setArticuloInfo(null);
    setCampoActivo('codigo');
  };

  const eliminarLinea = (index: number) => {
    setLineasPedido((prev) => prev.filter((_, i) => i !== index));
  };

  const finalizarPedido = () => {
    if (!proveedorSeleccionado) return;

    lineasPedido.forEach((linea) => {
      agregarRegistro({
        FECHA_HORA: new Date().toLocaleString('es-ES'),
        OPERARIO: operarioActual!,
        CODIGO: linea.CODIGO,
        DESCRIPCION: linea.DESCRIPCION,
        TIPO_OPERACION: 'PEDIDO',
        STOCK_ANTERIOR: linea.stockActual,
        STOCK_REAL: null,
        DIFERENCIA: null,
        UBICACION_ANTERIOR: null,
        UBICACION_NUEVA: null,
        PROVEEDOR: proveedorSeleccionado.nombre,
        CANTIDAD_PEDIDO: linea.cantidad,
      });
    });

    setPedidoFinalizado(true);
  };

  const handleNumPadChange = (val: string) => {
    if (campoActivo === 'codigo') setCodigo(val);
    else setCantidad(val);
  };

  const handleNumPadConfirm = () => {
    if (campoActivo === 'codigo') buscarArticulo();
  };

  const tiposPedido = ['URGENTE', 'STOCK', 'REAPROVISIONAMIENTO'];

  // Paso 1: Selección
  if (paso === 'seleccion') {
    return (
      <div className="flex flex-col min-h-screen bg-background p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-primary text-2xl">📦 REALIZAR PEDIDO</h2>
          <button onClick={() => navigate('/menu')} className="btn-secondary text-sm py-2 px-4 min-h-0">
            ← MENÚ
          </button>
        </div>

        <div className="max-w-lg mx-auto w-full space-y-6">
          <div>
            <label className="text-primary text-lg mb-3 block">SELECCIONAR PROVEEDOR:</label>
            <div className="space-y-3">
              {proveedores.map((p) => (
                <button
                  key={p.nombre}
                  onClick={() => setProveedorSeleccionado(p)}
                  className={`w-full p-4 border-2 border-primary font-bold text-lg rounded transition-all ${
                    proveedorSeleccionado?.nombre === p.nombre
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-primary/20'
                  }`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-primary text-lg mb-3 block">TIPO DE PEDIDO:</label>
            <div className="space-y-3">
              {tiposPedido.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoPedido(tipo)}
                  className={`w-full p-4 border-2 border-primary font-bold rounded transition-all ${
                    tipoPedido === tipo
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-primary hover:bg-primary/20'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPaso('escaneo')}
            disabled={!proveedorSeleccionado || !tipoPedido}
            className="btn-primary w-full text-xl disabled:opacity-30 disabled:cursor-not-allowed"
          >
            CONTINUAR →
          </button>
        </div>
      </div>
    );
  }

  // Pedido finalizado
  if (pedidoFinalizado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <div className="text-center space-y-6 max-w-lg">
          <p className="text-green-500 text-4xl">✓</p>
          <p className="text-green-500 text-2xl">PEDIDO REGISTRADO</p>
          <p className="text-foreground text-lg">{lineasPedido.length} LÍNEAS A {proveedorSeleccionado?.nombre}</p>
          <button onClick={() => navigate('/menu')} className="btn-primary w-full">
            VOLVER AL MENÚ
          </button>
        </div>
      </div>
    );
  }

  // Paso 2: Escaneo
  return (
    <div className={`flex h-screen bg-background ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      <div className={`${isLandscape ? 'w-[60%]' : 'h-[50%]'} p-4 overflow-auto`}>
        <div className="mb-3 border-b-2 border-primary pb-2 flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm">PEDIDO A: <span className="text-primary">{proveedorSeleccionado?.nombre}</span></p>
            <p className="text-foreground text-sm">TIPO: <span className="text-primary">{tipoPedido}</span></p>
          </div>
          <button onClick={() => setPaso('seleccion')} className="btn-secondary text-xs py-1 px-3 min-h-0">
            ← ATRÁS
          </button>
        </div>

        {/* Código input */}
        <div className="space-y-2 mb-3">
          <label className="text-foreground text-sm">CÓDIGO:</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && buscarArticulo()}
            onFocus={() => setCampoActivo('codigo')}
            placeholder="INTRODUCE CÓDIGO..."
            className={`input-field text-xl min-h-[50px] ${campoActivo === 'codigo' ? 'border-orange-500' : ''}`}
            autoComplete="off"
          />
        </div>

        {errorMsg && (
          <div className="border-2 border-destructive p-3 rounded mb-3">
            <p className="text-destructive text-center">{errorMsg}</p>
          </div>
        )}

        {articuloInfo && (
          <div className="space-y-3 mb-3">
            <div className="p-2 border border-primary bg-secondary rounded">
              <span className="text-muted-foreground text-xs">DESCRIPCIÓN:</span>
              <p className="text-foreground">{articuloInfo.DESCRIPCION}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 border border-primary bg-secondary rounded">
                <span className="text-muted-foreground text-xs">STOCK ACTUAL:</span>
                <p className="text-foreground text-xl">{articuloInfo.stockActual}</p>
              </div>
              <div className="p-2 border border-primary bg-secondary rounded">
                <span className="text-muted-foreground text-xs">PVP:</span>
                <p className="text-primary text-xl">{articuloInfo.pvp.toFixed(2)} €</p>
              </div>
            </div>
            <div className="p-3 border-2 border-orange-500 bg-secondary rounded" onClick={() => setCampoActivo('cantidad')}>
              <span className="text-orange-500 text-sm">CANTIDAD A PEDIR:</span>
              <div className={`text-foreground text-2xl font-bold text-center py-2 bg-background border-2 mt-1 rounded ${campoActivo === 'cantidad' ? 'border-orange-500' : 'border-muted'}`}>
                {cantidad || '0'}
              </div>
            </div>
            <button
              onClick={anadirAPedido}
              disabled={!cantidad || parseFloat(cantidad) <= 0}
              className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
            >
              AÑADIR A PEDIDO
            </button>
          </div>
        )}

        {/* Líneas */}
        {lineasPedido.length > 0 && (
          <div className="border-t-2 border-primary pt-3">
            <h3 className="text-primary text-lg mb-2">LÍNEAS ({lineasPedido.length}):</h3>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {lineasPedido.map((linea, i) => (
                <div key={i} className="flex justify-between items-center bg-secondary p-2 border border-primary rounded text-sm">
                  <span className="text-foreground">{linea.CODIGO} x {linea.cantidad}</span>
                  <button onClick={() => eliminarLinea(i)} className="bg-destructive text-destructive-foreground px-3 py-1 rounded text-xs">
                    ELIMINAR
                  </button>
                </div>
              ))}
            </div>
            <button onClick={finalizarPedido} className="btn-primary w-full mt-3">
              FINALIZAR PEDIDO ({lineasPedido.length} LÍNEAS)
            </button>
          </div>
        )}
      </div>

      {/* NumPad */}
      <div className={`${isLandscape ? 'w-[40%] border-l-4' : 'h-[50%] border-t-4'} border-primary bg-background p-4`}>
        <div className="mb-2 text-center">
          <p className="text-primary text-sm">
            {campoActivo === 'codigo' ? 'INTRODUCIR CÓDIGO' : 'INTRODUCIR CANTIDAD'}
          </p>
        </div>
        <NumPad
          value={campoActivo === 'codigo' ? codigo : cantidad}
          onChange={handleNumPadChange}
          onConfirm={handleNumPadConfirm}
        />
      </div>
    </div>
  );
};

export default Pedido;
