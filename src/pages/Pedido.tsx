import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useOrientation } from '@/hooks/useOrientation';
import NumPad from '@/components/NumPad';
import { useProveedores } from '@/hooks/useProveedores';
import { exportPedidos } from '@/utils/excelExport';

interface LineaPedido {
  CODIGO: string;
  DESCRIPCION: string;
  UBICACION: string;
  STOCK_ACTUAL: number;
  PVP: number;
  CANTIDAD: number;
}

type Paso = 'seleccion' | 'escaneo';

// ──────────────────────────────────────────────────────────────
// Modal listado completo de líneas del pedido
// ──────────────────────────────────────────────────────────────
interface LineasModalProps {
  lineas: LineaPedido[];
  onClose: () => void;
  onModificarCantidad: (index: number, nuevaCantidad: number) => void;
  onEliminar: (index: number) => void;
}

const LineasModal: React.FC<LineasModalProps> = ({ lineas, onClose, onModificarCantidad, onEliminar }) => {
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [tempVal, setTempVal] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState<number | null>(null);

  const confirmarEdicion = (idx: number) => {
    const val = parseFloat(tempVal);
    if (!isNaN(val) && val > 0) onModificarCantidad(idx, val);
    setEditandoIdx(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2">
      <div className="bg-background border-4 border-primary w-full max-w-6xl max-h-[95vh] flex flex-col rounded">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-primary bg-secondary">
          <h2 className="text-primary text-xl font-bold">📦 LÍNEAS DEL PEDIDO ({lineas.length})</h2>
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4 min-h-0">✕ CERRAR</button>
        </div>

        {/* Tabla */}
        <div className="overflow-auto flex-1">
          {lineas.length === 0 ? (
            <p className="text-muted-foreground text-center p-8">NO HAY ARTÍCULOS EN EL PEDIDO</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-3 text-left">CÓDIGO</th>
                  <th className="p-3 text-left">DESCRIPCIÓN</th>
                  <th className="p-3 text-left">UBICACIÓN</th>
                  <th className="p-3 text-center">STOCK ACTUAL</th>
                  <th className="p-3 text-center">CANTIDAD PEDIDA</th>
                  <th className="p-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-secondary'}>
                    <td className="p-2 text-foreground font-bold">{linea.CODIGO}</td>
                    <td className="p-2 text-foreground text-xs">{linea.DESCRIPCION}</td>
                    <td className="p-2 text-foreground text-xs">{linea.UBICACION}</td>
                    <td className="p-2 text-center text-foreground">{linea.STOCK_ACTUAL}</td>
                    {/* Cantidad editable */}
                    <td className="p-2 text-center">
                      {editandoIdx === idx ? (
                        <div className="flex gap-1 items-center justify-center">
                          <input
                            type="number"
                            value={tempVal}
                            onChange={(e) => setTempVal(e.target.value)}
                            className="input-field w-20 text-center py-1 px-2 text-base min-h-0"
                            autoFocus
                            min="1"
                          />
                          <button onClick={() => confirmarEdicion(idx)} className="bg-green-600 text-white px-2 py-1 text-xs rounded">✓</button>
                          <button onClick={() => setEditandoIdx(null)} className="bg-gray-600 text-white px-2 py-1 text-xs rounded">✕</button>
                        </div>
                      ) : (
                        <span className="text-primary font-bold text-lg">{linea.CANTIDAD}</span>
                      )}
                    </td>
                    {/* Acciones */}
                    <td className="p-2">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => { setEditandoIdx(idx); setTempVal(String(linea.CANTIDAD)); }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 text-xs rounded min-h-[40px]"
                        >✏️ CANTIDAD</button>
                        <button
                          onClick={() => setConfirmEliminar(idx)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded min-h-[40px]"
                        >❌ ELIMINAR</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmación eliminar */}
      {confirmEliminar !== null && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background border-4 border-destructive rounded p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-destructive text-lg font-bold">¿ELIMINAR LÍNEA?</p>
            <p className="text-foreground text-sm">{lineas[confirmEliminar]?.CODIGO}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { onEliminar(confirmEliminar); setConfirmEliminar(null); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded min-h-[50px]"
              >SÍ, ELIMINAR</button>
              <button onClick={() => setConfirmEliminar(null)} className="btn-secondary flex-1">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Modal gestión de proveedores (B1)
// ──────────────────────────────────────────────────────────────
interface GestionProveedoresModalProps {
  onClose: () => void;
  proveedores: string[];
  onAdd: (nombre: string) => { success: boolean; error?: string };
  onDelete: (nombre: string) => { success: boolean; error?: string };
}

const GestionProveedoresModal: React.FC<GestionProveedoresModalProps> = ({ onClose, proveedores, onAdd, onDelete }) => {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdd = () => {
    const result = onAdd(nuevoNombre);
    if (result.success) {
      setNuevoNombre('');
      setErrorMsg('');
    } else {
      setErrorMsg(result.error || 'ERROR');
    }
  };

  const handleDelete = (nombre: string) => {
    const result = onDelete(nombre);
    if (!result.success) setErrorMsg(result.error || 'ERROR');
    setConfirmDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border-4 border-primary rounded p-6 max-w-md w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-primary text-xl font-bold">GESTIÓN DE PROVEEDORES</h2>
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-3 min-h-0">✕</button>
        </div>

        {/* Añadir nuevo */}
        <div className="space-y-3">
          <label className="text-foreground text-sm">AÑADIR NUEVO PROVEEDOR:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => { setNuevoNombre(e.target.value.toUpperCase()); setErrorMsg(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="input-field flex-1"
              placeholder="NOMBRE DEL PROVEEDOR"
              autoFocus
            />
            <button onClick={handleAdd} className="btn-primary min-h-0 py-2 px-4 text-xl">+</button>
          </div>
          {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}
        </div>

        {/* Lista actual */}
        <div className="space-y-2">
          <label className="text-foreground text-sm">PROVEEDORES ACTUALES:</label>
          <div className="max-h-[280px] overflow-auto space-y-2">
            {proveedores.map((p) => (
              <div key={p} className="flex items-center justify-between bg-secondary p-3 border border-primary rounded">
                <span className="text-foreground font-bold">{p}</span>
                <button
                  onClick={() => setConfirmDelete(p)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded min-h-[40px]"
                >
                  ❌ ELIMINAR
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background border-4 border-destructive rounded p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-destructive text-lg font-bold">¿ELIMINAR PROVEEDOR?</p>
            <p className="text-foreground">{confirmDelete}</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="btn-primary flex-1 min-h-[50px]" style={{ background: 'rgb(220,38,38)' }}>
                SÍ, ELIMINAR
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Pantalla principal Pedido
// ──────────────────────────────────────────────────────────────
const Pedido: React.FC = () => {
  const navigate = useNavigate();
  const isLandscape = useOrientation();
  const inventario = useAppStore((s) => s.inventario);
  const proveedoresExcel = useAppStore((s) => s.proveedores);
  const operarioActual = useAppStore((s) => s.operarioActual);
  const agregarRegistro = useAppStore((s) => s.agregarRegistro);

  const { proveedores: proveedoresCustom, addProveedor, deleteProveedor } = useProveedores();

  const [paso, setPaso] = useState<Paso>('seleccion');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [tipoPedido, setTipoPedido] = useState('');
  const [modalProveedores, setModalProveedores] = useState(false);

  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [campoActivo, setCampoActivo] = useState<'codigo' | 'cantidad'>('codigo');
  const [articuloInfo, setArticuloInfo] = useState<{ CODIGO: string; DESCRIPCION: string; UBICACION: string; STOCK_ACTUAL: number; PVP: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lineasPedido, setLineasPedido] = useState<LineaPedido[]>([]);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [mostrarLineas, setMostrarLineas] = useState(false);
  const [editandoCantidad, setEditandoCantidad] = useState<number | null>(null);
  const [tempCantidad, setTempCantidad] = useState('');

  // Combinar proveedores del Excel con los custom (por nombre)
  const todosLosNombres = Array.from(new Set([
    ...proveedoresCustom,
    ...proveedoresExcel.map((p) => p.nombre),
  ])).sort();

  const buscarArticulo = useCallback(() => {
    if (!codigo.trim() || !proveedorSeleccionado) return;
    const searchCode = codigo.toUpperCase().trim();

    // Buscar en proveedores del Excel
    const provExcel = proveedoresExcel.find((p) => p.nombre === proveedorSeleccionado);
    const enProveedor = provExcel?.articulos.find(
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
      UBICACION: enInventario?.UBICACION || '—',
      STOCK_ACTUAL: enInventario?.STOCK_ACTUAL || 0,
      PVP: enProveedor.PVP,
    });
    setErrorMsg('');
    setCampoActivo('cantidad');
    setCantidad('');
  }, [codigo, proveedorSeleccionado, inventario, proveedoresExcel]);

  const anadirAPedido = () => {
    if (!articuloInfo || !cantidad || parseFloat(cantidad) <= 0) return;
    setLineasPedido((prev) => [
      ...prev,
      { ...articuloInfo, CANTIDAD: parseFloat(cantidad) },
    ]);
    setCodigo('');
    setCantidad('');
    setArticuloInfo(null);
    setErrorMsg('');
    setCampoActivo('codigo');
  };

  const eliminarLinea = (index: number) => {
    setLineasPedido((prev) => prev.filter((_, i) => i !== index));
  };

  const finalizarPedido = () => {
    if (!proveedorSeleccionado || lineasPedido.length === 0) return;

    lineasPedido.forEach((linea) => {
      agregarRegistro({
        FECHA_HORA: new Date().toLocaleString('es-ES'),
        OPERARIO: operarioActual!,
        CODIGO: linea.CODIGO,
        DESCRIPCION: linea.DESCRIPCION,
        TIPO_OPERACION: 'PEDIDO',
        STOCK_ANTERIOR: linea.STOCK_ACTUAL,
        STOCK_REAL: null,
        DIFERENCIA: null,
        UBICACION_ANTERIOR: null,
        UBICACION_NUEVA: null,
        PROVEEDOR: proveedorSeleccionado,
        CANTIDAD_PEDIDO: linea.CANTIDAD,
      });
    });

    // B2: Exportar XLSX independiente
    exportPedidos(
      lineasPedido.map((l) => ({
        CODIGO: l.CODIGO,
        DESCRIPCION: l.DESCRIPCION,
        UBICACION: l.UBICACION,
        STOCK_ACTUAL: l.STOCK_ACTUAL,
        CANTIDAD: l.CANTIDAD,
      })),
      operarioActual || 'SIN_OPERARIO',
      proveedorSeleccionado,
      tipoPedido
    );

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

  // ── Paso 1: Selección ──
  if (paso === 'seleccion') {
    return (
      <div className="flex flex-col min-h-screen bg-background p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-primary text-2xl">📦 REALIZAR PEDIDO</h2>
          <button onClick={() => navigate('/menu')} className="btn-secondary text-sm py-2 px-4 min-h-0">← MENÚ</button>
        </div>

        <div className="max-w-lg mx-auto w-full space-y-6">
          {/* Select de proveedor (B1) */}
          <div>
            <label className="text-primary text-lg mb-3 block">SELECCIONAR PROVEEDOR:</label>
            <div className="flex gap-2">
              <select
                value={proveedorSeleccionado}
                onChange={(e) => setProveedorSeleccionado(e.target.value)}
                className="flex-1 bg-secondary text-foreground px-4 py-3 border-2 border-primary focus:border-primary text-lg font-bold uppercase rounded"
              >
                <option value="">SELECCIONAR PROVEEDOR...</option>
                {todosLosNombres.map((nombre) => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
              <button
                onClick={() => setModalProveedores(true)}
                className="btn-primary min-h-0 py-3 px-5 text-2xl"
                title="GESTIONAR PROVEEDORES"
              >
                +
              </button>
            </div>
          </div>

          {/* Tipo de pedido */}
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

        {/* Modal gestión proveedores */}
        {modalProveedores && (
          <GestionProveedoresModal
            onClose={() => setModalProveedores(false)}
            proveedores={todosLosNombres}
            onAdd={addProveedor}
            onDelete={deleteProveedor}
          />
        )}
      </div>
    );
  }

  // ── Pedido finalizado ──
  if (pedidoFinalizado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <div className="text-center space-y-6 max-w-lg">
          <p className="text-green-500 text-4xl">✓</p>
          <p className="text-green-500 text-2xl">PEDIDO REGISTRADO Y EXPORTADO</p>
          <p className="text-foreground text-lg">{lineasPedido.length} LÍNEAS A {proveedorSeleccionado}</p>
          <p className="text-muted-foreground text-sm">ARCHIVO XLSX DESCARGADO AUTOMÁTICAMENTE</p>
          <button onClick={() => navigate('/menu')} className="btn-primary w-full">VOLVER AL MENÚ</button>
        </div>
      </div>
    );
  }

  // ── Paso 2: Escaneo ──
  return (
    <div className={`flex h-screen bg-background ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      <div className={`${isLandscape ? 'w-[60%]' : 'h-[50%]'} p-4 overflow-auto`}>
        <div className="mb-3 border-b-2 border-primary pb-2 flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm">PEDIDO A: <span className="text-primary">{proveedorSeleccionado}</span></p>
            <p className="text-foreground text-sm">TIPO: <span className="text-primary">{tipoPedido}</span></p>
          </div>
          <button onClick={() => setPaso('seleccion')} className="btn-secondary text-xs py-1 px-3 min-h-0">← ATRÁS</button>
        </div>

        {/* Código */}
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
                <p className="text-foreground text-xl">{articuloInfo.STOCK_ACTUAL}</p>
              </div>
              <div className="p-2 border border-primary bg-secondary rounded">
                <span className="text-muted-foreground text-xs">PVP:</span>
                <p className="text-primary text-xl">{articuloInfo.PVP.toFixed(2)} €</p>
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

        {/* Líneas - resumen compacto + botón ver listado */}
        {lineasPedido.length > 0 && (
          <div className="border-t-2 border-primary pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-primary text-lg">LÍNEAS ({lineasPedido.length}):</h3>
              <button
                onClick={() => setMostrarLineas(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 text-xs rounded min-h-[40px] border-none"
              >
                📋 VER LISTADO COMPLETO
              </button>
            </div>
            <div className="space-y-1 max-h-[120px] overflow-auto">
              {lineasPedido.map((linea, i) => (
                <div key={i} className="flex justify-between items-center bg-secondary p-2 border border-primary rounded text-sm">
                  <span className="text-foreground text-xs">{linea.CODIGO} — {linea.DESCRIPCION.substring(0, 25)}</span>
                  <span className="text-primary font-bold ml-2">x{linea.CANTIDAD}</span>
                </div>
              ))}
            </div>
            <button onClick={finalizarPedido} className="btn-primary w-full mt-2">
              FINALIZAR Y EXPORTAR PEDIDO ({lineasPedido.length} LÍNEAS)
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

      {/* Modal listado completo de líneas */}
      {mostrarLineas && (
        <LineasModal
          lineas={lineasPedido}
          onClose={() => setMostrarLineas(false)}
          onModificarCantidad={(idx, nuevaCantidad) => {
            setLineasPedido((prev) => prev.map((l, i) => i === idx ? { ...l, CANTIDAD: nuevaCantidad } : l));
          }}
          onEliminar={(idx) => {
            setLineasPedido((prev) => prev.filter((_, i) => i !== idx));
          }}
        />
      )}
    </div>
  );
};

export default Pedido;
