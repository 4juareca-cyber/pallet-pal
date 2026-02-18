import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useOrientation } from '@/hooks/useOrientation';
import NumPad from '@/components/NumPad';
import type { ArticuloInventario } from '@/types';
import { exportInventario } from '@/utils/excelExport';

// ──────────────────────────────────────────────────────────────
// Tipos internos
// ──────────────────────────────────────────────────────────────
interface ItemEscaneado {
  CODIGO: string;
  DESCRIPCION: string;
  STOCK_ACTUAL: number;
  STOCK_REAL: number;
  UBICACION_ANTERIOR: string;
  NUEVA_UBICACION: string;
}

// ──────────────────────────────────────────────────────────────
// Modal: Lista de artículos escaneados (A1)
// ──────────────────────────────────────────────────────────────
interface ListaModalProps {
  items: ItemEscaneado[];
  onClose: () => void;
  onUpdateStock: (codigo: string, nuevoStock: number) => void;
  onUpdateUbicacion: (codigo: string, nuevaUbicacion: string) => void;
  onDelete: (codigo: string) => void;
}

const ListaModal: React.FC<ListaModalProps> = ({ items, onClose, onUpdateStock, onUpdateUbicacion, onDelete }) => {
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [editingUbicacion, setEditingUbicacion] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const startEditStock = (item: ItemEscaneado) => {
    setEditingStock(item.CODIGO);
    setEditingUbicacion(null);
    setTempValue(String(item.STOCK_REAL));
  };

  const startEditUbicacion = (item: ItemEscaneado) => {
    setEditingUbicacion(item.CODIGO);
    setEditingStock(null);
    setTempValue(item.NUEVA_UBICACION);
  };

  const confirmEditStock = (codigo: string) => {
    const val = parseFloat(tempValue);
    if (!isNaN(val) && val >= 0) onUpdateStock(codigo, val);
    setEditingStock(null);
  };

  const confirmEditUbicacion = (codigo: string) => {
    onUpdateUbicacion(codigo, tempValue.toUpperCase());
    setEditingUbicacion(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2">
      <div className="bg-background border-4 border-primary w-full max-w-6xl max-h-[95vh] flex flex-col rounded">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-primary bg-secondary">
          <h2 className="text-primary text-xl font-bold">📋 ARTÍCULOS ESCANEADOS ({items.length})</h2>
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4 min-h-0">✕ CERRAR</button>
        </div>

        {/* Tabla */}
        <div className="overflow-auto flex-1">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center p-8">NO HAY ARTÍCULOS ESCANEADOS</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-3 text-left">CÓDIGO</th>
                  <th className="p-3 text-left">DESCRIPCIÓN</th>
                  <th className="p-3 text-center">STOCK ACTUAL</th>
                  <th className="p-3 text-center">STOCK REAL</th>
                  <th className="p-3 text-left">UBIC. ANTERIOR</th>
                  <th className="p-3 text-left">NUEVA UBICACIÓN</th>
                  <th className="p-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.CODIGO} className={idx % 2 === 0 ? 'bg-background' : 'bg-secondary'}>
                    <td className="p-2 text-foreground font-bold">{item.CODIGO}</td>
                    <td className="p-2 text-foreground text-xs">{item.DESCRIPCION}</td>
                    <td className="p-2 text-center text-foreground">{item.STOCK_ACTUAL}</td>

                    {/* Stock real editable */}
                    <td className="p-2 text-center">
                      {editingStock === item.CODIGO ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="input-field w-20 text-center py-1 px-2 text-base min-h-0"
                            autoFocus
                          />
                          <button onClick={() => confirmEditStock(item.CODIGO)} className="bg-green-600 text-white px-2 py-1 text-xs rounded">✓</button>
                          <button onClick={() => setEditingStock(null)} className="bg-gray-600 text-white px-2 py-1 text-xs rounded">✕</button>
                        </div>
                      ) : (
                        <span className="text-primary font-bold text-lg">{item.STOCK_REAL}</span>
                      )}
                    </td>

                    {/* Ubicación anterior */}
                    <td className="p-2 text-muted-foreground text-xs">{item.UBICACION_ANTERIOR || '—'}</td>

                    {/* Nueva Ubicación editable */}
                    <td className="p-2">
                      {editingUbicacion === item.CODIGO ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value.toUpperCase())}
                            className="input-field w-24 py-1 px-2 text-base min-h-0"
                            autoFocus
                          />
                          <button onClick={() => confirmEditUbicacion(item.CODIGO)} className="bg-green-600 text-white px-2 py-1 text-xs rounded">✓</button>
                          <button onClick={() => setEditingUbicacion(null)} className="bg-gray-600 text-white px-2 py-1 text-xs rounded">✕</button>
                        </div>
                      ) : (
                        <span className="text-foreground text-xs">{item.NUEVA_UBICACION || '—'}</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="p-2">
                      <div className="flex gap-1 flex-wrap justify-center">
                        <button
                          onClick={() => startEditStock(item)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 text-xs rounded min-h-[40px]"
                        >✏️ STOCK</button>
                        <button
                          onClick={() => startEditUbicacion(item)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded min-h-[40px]"
                        >📍 UBIC.</button>
                        <button
                          onClick={() => setConfirmDelete(item.CODIGO)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded min-h-[40px]"
                        >❌</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal confirmación borrar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background border-4 border-destructive rounded p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-destructive text-lg font-bold">¿ELIMINAR REGISTRO?</p>
            <p className="text-foreground text-sm">{confirmDelete}</p>
            <div className="flex gap-3">
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }} className="btn-primary flex-1 bg-red-600 hover:bg-red-700 min-h-[50px]">
                SÍ, BORRAR
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
// Modal: Duplicado detectado (A2)
// ──────────────────────────────────────────────────────────────
interface DuplicadoModalProps {
  item: ItemEscaneado;
  onAnadirUnidades: (cantidad: number) => void;
  onModificarUbicacion: (nuevaUbicacion: string) => void;
  onCancelar: () => void;
}

const DuplicadoModal: React.FC<DuplicadoModalProps> = ({ item, onAnadirUnidades, onModificarUbicacion, onCancelar }) => {
  const [modo, setModo] = useState<'menu' | 'unidades' | 'ubicacion'>('menu');
  const [valor, setValor] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background border-4 border-orange-500 rounded p-6 max-w-md w-full space-y-4">
        <h2 className="text-orange-500 text-xl font-bold">⚠️ ARTÍCULO YA REGISTRADO</h2>

        <div className="bg-secondary p-3 rounded border border-primary space-y-1 text-sm">
          <p><span className="text-muted-foreground">CÓDIGO:</span> <span className="text-foreground font-bold">{item.CODIGO}</span></p>
          <p><span className="text-muted-foreground">DESCRIPCIÓN:</span> <span className="text-foreground">{item.DESCRIPCION}</span></p>
          <p><span className="text-muted-foreground">STOCK ACTUAL (SISTEMA):</span> <span className="text-foreground">{item.STOCK_ACTUAL}</span></p>
          <p><span className="text-muted-foreground">STOCK REAL CONTADO:</span> <span className="text-primary font-bold">{item.STOCK_REAL}</span></p>
          <p><span className="text-muted-foreground">NUEVA UBICACIÓN:</span> <span className="text-foreground">{item.NUEVA_UBICACION || '—'}</span></p>
        </div>

        {modo === 'menu' && (
          <div className="space-y-3">
            <button onClick={() => setModo('unidades')} className="btn-primary w-full bg-green-600 hover:bg-green-700 min-h-[50px]">
              ➕ AÑADIR UNIDADES AL STOCK REAL
            </button>
            <button onClick={() => setModo('ubicacion')} className="btn-primary w-full bg-blue-600 hover:bg-blue-700 min-h-[50px]">
              📍 MODIFICAR UBICACIÓN
            </button>
            <button onClick={onCancelar} className="btn-secondary w-full">
              ❌ CANCELAR
            </button>
          </div>
        )}

        {modo === 'unidades' && (
          <div className="space-y-3">
            <label className="text-foreground text-sm block">
              UNIDADES A AÑADIR (STOCK REAL ACTUAL: <span className="text-primary">{item.STOCK_REAL}</span>):
            </label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="input-field text-2xl text-center"
              placeholder="0"
              autoFocus
              min="0"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { const n = parseFloat(valor); if (!isNaN(n) && n > 0) onAnadirUnidades(n); }}
                disabled={!valor || parseFloat(valor) <= 0}
                className="btn-primary flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-30"
              >
                ✓ CONFIRMAR ({item.STOCK_REAL} + {valor || 0} = {item.STOCK_REAL + (parseFloat(valor) || 0)})
              </button>
              <button onClick={() => setModo('menu')} className="btn-secondary">← ATRÁS</button>
            </div>
          </div>
        )}

        {modo === 'ubicacion' && (
          <div className="space-y-3">
            <label className="text-foreground text-sm block">NUEVA UBICACIÓN:</label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value.toUpperCase())}
              className="input-field text-xl"
              placeholder="EJ: A-01-03"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { if (valor.trim()) onModificarUbicacion(valor.trim()); }}
                disabled={!valor.trim()}
                className="btn-primary flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-30"
              >
                ✓ GUARDAR
              </button>
              <button onClick={() => setModo('menu')} className="btn-secondary">← ATRÁS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Pantalla principal de Inventario
// ──────────────────────────────────────────────────────────────
const Inventario: React.FC = () => {
  const navigate = useNavigate();
  const isLandscape = useOrientation();
  const inventario = useAppStore((s) => s.inventario);
  const operarioActual = useAppStore((s) => s.operarioActual);
  const agregarRegistro = useAppStore((s) => s.agregarRegistro);
  const actualizarInventario = useAppStore((s) => s.actualizarInventario);
  const agregarArticulo = useAppStore((s) => s.agregarArticulo);

  const [codigo, setCodigo] = useState('');
  const [stockReal, setStockReal] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [articuloActual, setArticuloActual] = useState<ArticuloInventario | null>(null);
  const [modoAltaManual, setModoAltaManual] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [altaDescripcion, setAltaDescripcion] = useState('');
  const [altaUbicacion, setAltaUbicacion] = useState('');
  const [campoActivo, setCampoActivo] = useState<'codigo' | 'stock'>('codigo');

  // A1: lista de escaneados (Map por código para evitar duplicados)
  const [itemsEscaneados, setItemsEscaneados] = useState<Map<string, ItemEscaneado>>(new Map());
  const [mostrarLista, setMostrarLista] = useState(false);

  // A2: modal duplicado
  const [duplicadoItem, setDuplicadoItem] = useState<ItemEscaneado | null>(null);

  const [exportando, setExportando] = useState(false);

  const buscarCodigo = useCallback(() => {
    if (!codigo.trim()) return;
    const searchCode = codigo.toUpperCase().trim();
    const found = inventario.find(
      (a) => a.CODIGO === searchCode || a.CODIGO === `JCB-${searchCode}`
    );
    if (found) {
      setArticuloActual(found);
      setNuevaUbicacion(found.UBICACION);
      setModoAltaManual(false);
      setCampoActivo('stock');
      setGuardado(false);
    } else {
      setArticuloActual(null);
      setModoAltaManual(true);
      setAltaDescripcion('');
      setAltaUbicacion('');
      setGuardado(false);
    }
  }, [codigo, inventario]);

  const guardarRegularizacion = () => {
    if (!articuloActual || !stockReal) return;
    const stockRealNum = parseFloat(stockReal);
    const diferencia = stockRealNum - articuloActual.STOCK_ACTUAL;
    const ubicacionFinal = nuevaUbicacion || articuloActual.UBICACION;

    // A2/A3: Verificar duplicado en lista
    if (itemsEscaneados.has(articuloActual.CODIGO)) {
      setDuplicadoItem(itemsEscaneados.get(articuloActual.CODIGO)!);
      return;
    }

    actualizarInventario(articuloActual.CODIGO, { STOCK_ACTUAL: stockRealNum, UBICACION: ubicacionFinal });
    agregarRegistro({
      FECHA_HORA: new Date().toLocaleString('es-ES'),
      OPERARIO: operarioActual!,
      CODIGO: articuloActual.CODIGO,
      DESCRIPCION: articuloActual.DESCRIPCION,
      TIPO_OPERACION: 'INVENTARIO',
      STOCK_ANTERIOR: articuloActual.STOCK_ACTUAL,
      STOCK_REAL: stockRealNum,
      DIFERENCIA: diferencia,
      UBICACION_ANTERIOR: articuloActual.UBICACION,
      UBICACION_NUEVA: ubicacionFinal,
      PROVEEDOR: null,
      CANTIDAD_PEDIDO: null,
    });

    // Añadir a lista escaneados
    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      next.set(articuloActual.CODIGO, {
        CODIGO: articuloActual.CODIGO,
        DESCRIPCION: articuloActual.DESCRIPCION,
        STOCK_ACTUAL: articuloActual.STOCK_ACTUAL,
        STOCK_REAL: stockRealNum,
        UBICACION_ANTERIOR: articuloActual.UBICACION,
        NUEVA_UBICACION: ubicacionFinal,
      });
      return next;
    });

    setGuardado(true);
  };

  // Guardar que el stock actual es correcto (sin modificar el número)
  const guardarStockCorrecto = () => {
    if (!articuloActual) return;
    const ubicacionFinal = nuevaUbicacion || articuloActual.UBICACION;

    if (itemsEscaneados.has(articuloActual.CODIGO)) {
      setDuplicadoItem(itemsEscaneados.get(articuloActual.CODIGO)!);
      return;
    }

    actualizarInventario(articuloActual.CODIGO, { UBICACION: ubicacionFinal });
    agregarRegistro({
      FECHA_HORA: new Date().toLocaleString('es-ES'),
      OPERARIO: operarioActual!,
      CODIGO: articuloActual.CODIGO,
      DESCRIPCION: articuloActual.DESCRIPCION,
      TIPO_OPERACION: 'INVENTARIO',
      STOCK_ANTERIOR: articuloActual.STOCK_ACTUAL,
      STOCK_REAL: articuloActual.STOCK_ACTUAL,
      DIFERENCIA: 0,
      UBICACION_ANTERIOR: articuloActual.UBICACION,
      UBICACION_NUEVA: ubicacionFinal,
      PROVEEDOR: null,
      CANTIDAD_PEDIDO: null,
    });

    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      next.set(articuloActual.CODIGO, {
        CODIGO: articuloActual.CODIGO,
        DESCRIPCION: articuloActual.DESCRIPCION,
        STOCK_ACTUAL: articuloActual.STOCK_ACTUAL,
        STOCK_REAL: articuloActual.STOCK_ACTUAL,
        UBICACION_ANTERIOR: articuloActual.UBICACION,
        NUEVA_UBICACION: ubicacionFinal,
      });
      return next;
    });

    setGuardado(true);
  };

  const guardarNuevoArticulo = () => {
    if (!altaDescripcion.trim() || !altaUbicacion.trim()) return;
    const codigoUpper = codigo.toUpperCase().trim();

    if (itemsEscaneados.has(codigoUpper)) {
      setDuplicadoItem(itemsEscaneados.get(codigoUpper)!);
      return;
    }

    const nuevoArticulo: ArticuloInventario = {
      CODIGO: codigoUpper,
      DESCRIPCION: altaDescripcion.toUpperCase(),
      STOCK_ACTUAL: 0,
      UBICACION: altaUbicacion.toUpperCase(),
    };
    agregarArticulo(nuevoArticulo);
    agregarRegistro({
      FECHA_HORA: new Date().toLocaleString('es-ES'),
      OPERARIO: operarioActual!,
      CODIGO: codigoUpper,
      DESCRIPCION: altaDescripcion.toUpperCase(),
      TIPO_OPERACION: 'INVENTARIO',
      STOCK_ANTERIOR: 0,
      STOCK_REAL: 0,
      DIFERENCIA: 0,
      UBICACION_ANTERIOR: '',
      UBICACION_NUEVA: altaUbicacion.toUpperCase(),
      PROVEEDOR: null,
      CANTIDAD_PEDIDO: null,
    });

    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      next.set(codigoUpper, {
        CODIGO: codigoUpper,
        DESCRIPCION: altaDescripcion.toUpperCase(),
        STOCK_ACTUAL: 0,
        STOCK_REAL: 0,
        UBICACION_ANTERIOR: '',
        NUEVA_UBICACION: altaUbicacion.toUpperCase(),
      });
      return next;
    });

    setGuardado(true);
    setModoAltaManual(false);
  };

  const limpiarFormulario = () => {
    setCodigo('');
    setStockReal('');
    setNuevaUbicacion('');
    setArticuloActual(null);
    setModoAltaManual(false);
    setGuardado(false);
    setCampoActivo('codigo');
    setAltaDescripcion('');
    setAltaUbicacion('');
  };

  const handleNumPadChange = (val: string) => {
    if (campoActivo === 'codigo') setCodigo(val);
    else setStockReal(val);
  };

  const handleNumPadConfirm = () => {
    if (campoActivo === 'codigo') buscarCodigo();
  };

  const handleExportar = () => {
    const items = Array.from(itemsEscaneados.values());
    if (items.length === 0) return;
    setExportando(true);
    try {
      exportInventario(items, operarioActual || 'SIN_OPERARIO');
    } finally {
      setExportando(false);
    }
  };

  // Handlers de lista modal
  const handleUpdateStock = (codigo: string, nuevoStock: number) => {
    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      const item = next.get(codigo);
      if (item) next.set(codigo, { ...item, STOCK_REAL: nuevoStock });
      return next;
    });
  };

  const handleUpdateUbicacion = (codigo: string, nuevaUbicacion: string) => {
    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      const item = next.get(codigo);
      if (item) next.set(codigo, { ...item, NUEVA_UBICACION: nuevaUbicacion });
      return next;
    });
  };

  const handleDeleteItem = (codigo: string) => {
    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      next.delete(codigo);
      return next;
    });
  };

  // Handlers modal duplicado
  const handleAnadirUnidades = (cantidad: number) => {
    if (!duplicadoItem) return;
    const nuevoStock = duplicadoItem.STOCK_REAL + cantidad;
    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      next.set(duplicadoItem.CODIGO, { ...duplicadoItem, STOCK_REAL: nuevoStock });
      return next;
    });
    actualizarInventario(duplicadoItem.CODIGO, { STOCK_ACTUAL: nuevoStock });
    setDuplicadoItem(null);
    limpiarFormulario();
  };

  const handleModificarUbicacionDuplicado = (nuevaUbicacion: string) => {
    if (!duplicadoItem) return;
    setItemsEscaneados((prev) => {
      const next = new Map(prev);
      next.set(duplicadoItem.CODIGO, { ...duplicadoItem, NUEVA_UBICACION: nuevaUbicacion });
      return next;
    });
    actualizarInventario(duplicadoItem.CODIGO, { UBICACION: nuevaUbicacion });
    setDuplicadoItem(null);
    limpiarFormulario();
  };

  const itemsArray = Array.from(itemsEscaneados.values());

  return (
    <div className={`flex h-screen bg-background ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      {/* Form panel */}
      <div className={`${isLandscape ? 'w-[60%]' : 'h-[50%]'} p-4 overflow-auto`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-primary text-lg">📋 INVENTARIO / REGULARIZACIÓN</h2>
          <button onClick={() => navigate('/menu')} className="btn-secondary text-sm py-2 px-3 min-h-0">← MENÚ</button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMostrarLista(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 text-sm rounded min-h-[44px] border-none"
          >
            📋 VER ESCANEADOS ({itemsArray.length})
          </button>
          {itemsArray.length > 0 && (
            <button
              onClick={handleExportar}
              disabled={exportando}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 text-sm rounded min-h-[44px] border-none disabled:opacity-50"
            >
              📥 EXPORTAR XLSX
            </button>
          )}
        </div>

        {/* Código input */}
        <div className="space-y-2 mb-4">
          <label className="text-foreground text-sm">CÓDIGO:</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && buscarCodigo()}
            onFocus={() => setCampoActivo('codigo')}
            placeholder="INTRODUCE CÓDIGO..."
            className="input-field text-2xl min-h-[60px]"
            autoComplete="off"
          />
        </div>

        {/* Artículo encontrado */}
        {articuloActual && !modoAltaManual && !guardado && (
          <div className="space-y-3">
            <div className="p-3 border-2 border-primary bg-secondary rounded">
              <span className="text-muted-foreground text-sm">DESCRIPCIÓN:</span>
              <p className="text-foreground text-lg">{articuloActual.DESCRIPCION}</p>
            </div>
            <div className="p-3 border-2 border-primary bg-secondary rounded">
              <span className="text-muted-foreground text-sm">STOCK ACTUAL (SISTEMA):</span>
              <p className="text-primary text-2xl">{articuloActual.STOCK_ACTUAL} UNIDADES</p>
            </div>
            <div className="p-4 border-4 border-orange-500 bg-secondary rounded" onClick={() => setCampoActivo('stock')}>
              <label className="text-orange-500 text-lg font-bold">STOCK REAL (CONTADO):</label>
              <div className={`text-foreground text-3xl font-bold text-center py-4 bg-background border-2 mt-2 rounded ${campoActivo === 'stock' ? 'border-orange-500' : 'border-muted'}`}>
                {stockReal || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">← USA EL TECLADO NUMÉRICO</p>
            </div>
            <div className="space-y-2">
              <label className="text-foreground text-sm">NUEVA UBICACIÓN (OPCIONAL):</label>
              <input
                type="text"
                value={nuevaUbicacion}
                onChange={(e) => setNuevaUbicacion(e.target.value.toUpperCase())}
                placeholder={articuloActual.UBICACION}
                className="input-field"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={guardarStockCorrecto}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-3 rounded min-h-[52px] text-sm border-none"
              >
                ✅ STOCK CORRECTO
              </button>
              <button
                onClick={guardarRegularizacion}
                disabled={!stockReal}
                className="flex-1 btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                📝 GUARDAR REGULARIZACIÓN
              </button>
            </div>
          </div>
        )}

        {/* Alta manual */}
        {modoAltaManual && !guardado && (
          <div className="border-4 border-orange-500 p-4 bg-secondary rounded space-y-4">
            <h3 className="text-2xl text-orange-500">⚠️ CÓDIGO NO REGISTRADO</h3>
            <p className="text-foreground">MODO: ALTA MANUAL</p>
            <div className="space-y-2">
              <label className="text-primary text-sm">CÓDIGO:</label>
              <input value={codigo} disabled className="input-field opacity-50" />
            </div>
            <div className="space-y-2">
              <label className="text-primary text-sm">DESCRIPCIÓN:</label>
              <input
                value={altaDescripcion}
                onChange={(e) => setAltaDescripcion(e.target.value.toUpperCase())}
                className="input-field"
                placeholder="DESCRIPCIÓN DEL ARTÍCULO"
              />
            </div>
            <div className="space-y-2">
              <label className="text-primary text-sm">UBICACIÓN INICIAL:</label>
              <input
                value={altaUbicacion}
                onChange={(e) => setAltaUbicacion(e.target.value.toUpperCase())}
                className="input-field"
                placeholder="EJ: A-01-03"
              />
            </div>
            <button
              onClick={guardarNuevoArticulo}
              className="btn-primary w-full"
              disabled={!altaDescripcion.trim() || !altaUbicacion.trim()}
            >
              GUARDAR NUEVO ARTÍCULO
            </button>
            <button onClick={() => { setModoAltaManual(false); limpiarFormulario(); }} className="btn-secondary w-full">
              CANCELAR
            </button>
          </div>
        )}

        {/* Confirmación */}
        {guardado && (
          <div className="mt-4 border-2 border-green-500 p-4 rounded text-center space-y-4">
            <p className="text-green-500 text-2xl">✓ REGULARIZACIÓN GUARDADA</p>
            <p className="text-muted-foreground text-sm">ARTÍCULOS EN LISTA: {itemsArray.length}</p>
            <button onClick={limpiarFormulario} className="btn-primary w-full">NUEVO ARTÍCULO</button>
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
          value={campoActivo === 'codigo' ? codigo : stockReal}
          onChange={handleNumPadChange}
          onConfirm={handleNumPadConfirm}
        />
      </div>

      {/* Modal lista escaneados */}
      {mostrarLista && (
        <ListaModal
          items={itemsArray}
          onClose={() => setMostrarLista(false)}
          onUpdateStock={handleUpdateStock}
          onUpdateUbicacion={handleUpdateUbicacion}
          onDelete={handleDeleteItem}
        />
      )}

      {/* Modal duplicado */}
      {duplicadoItem && (
        <DuplicadoModal
          item={duplicadoItem}
          onAnadirUnidades={handleAnadirUnidades}
          onModificarUbicacion={handleModificarUbicacionDuplicado}
          onCancelar={() => { setDuplicadoItem(null); limpiarFormulario(); }}
        />
      )}
    </div>
  );
};

export default Inventario;
