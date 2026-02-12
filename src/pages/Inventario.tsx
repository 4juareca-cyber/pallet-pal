import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useOrientation } from '@/hooks/useOrientation';
import NumPad from '@/components/NumPad';
import type { ArticuloInventario } from '@/types';

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

  // Alta manual fields
  const [altaDescripcion, setAltaDescripcion] = useState('');
  const [altaUbicacion, setAltaUbicacion] = useState('');

  const [campoActivo, setCampoActivo] = useState<'codigo' | 'stock'>('codigo');
  const inputCodigoRef = useRef<HTMLInputElement>(null);

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

    actualizarInventario(articuloActual.CODIGO, {
      STOCK_ACTUAL: stockRealNum,
      UBICACION: nuevaUbicacion || articuloActual.UBICACION,
    });

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
      UBICACION_NUEVA: nuevaUbicacion || articuloActual.UBICACION,
      PROVEEDOR: null,
      CANTIDAD_PEDIDO: null,
    });

    setGuardado(true);
  };

  const guardarNuevoArticulo = () => {
    if (!altaDescripcion.trim() || !altaUbicacion.trim()) return;
    const codigoUpper = codigo.toUpperCase().trim();

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
    if (campoActivo === 'codigo') {
      buscarCodigo();
    }
  };

  return (
    <div className={`flex h-screen bg-background ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      {/* Form panel */}
      <div className={`${isLandscape ? 'w-[60%]' : 'h-[50%]'} p-4 overflow-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-primary text-xl">📋 INVENTARIO / REGULARIZACIÓN</h2>
          <button onClick={() => navigate('/menu')} className="btn-secondary text-sm py-2 px-4 min-h-0">
            ← MENÚ
          </button>
        </div>

        {/* Código input */}
        <div className="space-y-2 mb-4">
          <label className="text-foreground text-sm">CÓDIGO:</label>
          <input
            ref={inputCodigoRef}
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
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ← USA EL TECLADO NUMÉRICO
              </p>
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

            <button
              onClick={guardarRegularizacion}
              disabled={!stockReal}
              className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
            >
              GUARDAR REGULARIZACIÓN
            </button>
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

            <button onClick={guardarNuevoArticulo} className="btn-primary w-full" disabled={!altaDescripcion.trim() || !altaUbicacion.trim()}>
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
            <button onClick={limpiarFormulario} className="btn-primary w-full">
              NUEVO ARTÍCULO
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
          value={campoActivo === 'codigo' ? codigo : stockReal}
          onChange={handleNumPadChange}
          onConfirm={handleNumPadConfirm}
        />
      </div>
    </div>
  );
};

export default Inventario;
