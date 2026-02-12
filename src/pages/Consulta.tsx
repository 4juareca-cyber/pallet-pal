import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useOrientation } from '@/hooks/useOrientation';
import NumPad from '@/components/NumPad';
import type { ArticuloInventario } from '@/types';

const Consulta: React.FC = () => {
  const navigate = useNavigate();
  const isLandscape = useOrientation();
  const inventario = useAppStore((s) => s.inventario);
  const operarioActual = useAppStore((s) => s.operarioActual);
  const agregarRegistro = useAppStore((s) => s.agregarRegistro);

  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState<ArticuloInventario | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigo(e.target.value.toUpperCase());
  }, []);

  const handleConfirm = useCallback(() => {
    if (!codigo.trim()) return;

    const searchCode = codigo.toUpperCase().trim();
    const found = inventario.find(
      (a) => a.CODIGO === searchCode || a.CODIGO === `JCB-${searchCode}`
    );

    if (found) {
      setResultado(found);
      setNoEncontrado(false);

      agregarRegistro({
        FECHA_HORA: new Date().toISOString(),
        OPERARIO: operarioActual || '',
        CODIGO: found.CODIGO,
        DESCRIPCION: found.DESCRIPCION,
        TIPO_OPERACION: 'CONSULTA',
        STOCK_ANTERIOR: null,
        STOCK_REAL: null,
        DIFERENCIA: null,
        UBICACION_ANTERIOR: null,
        UBICACION_NUEVA: null,
        PROVEEDOR: null,
        CANTIDAD_PEDIDO: null,
      });
    } else {
      setResultado(null);
      setNoEncontrado(true);
    }
  }, [codigo, inventario, operarioActual, agregarRegistro]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  }, [handleConfirm]);

  const handleNuevaConsulta = () => {
    setCodigo('');
    setResultado(null);
    setNoEncontrado(false);
  };

  return (
    <div className={`flex h-screen bg-background ${isLandscape ? 'flex-row' : 'flex-col'}`}>
      {/* Form area */}
      <div className={`${isLandscape ? 'w-[60%]' : 'h-[50%]'} p-4 overflow-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-primary text-xl">🔍 CONSULTA DE STOCK</h2>
          <button onClick={() => navigate('/menu')} className="btn-secondary text-sm py-2 px-4 min-h-0">
            ← MENÚ
          </button>
        </div>

        {/* Código input - compatible con lector de barras y teclado */}
        <div className="space-y-3">
          <label className="text-foreground text-sm">CÓDIGO ARTÍCULO (ESCÁNER / TECLADO / NUMPAD)</label>
          <input
            ref={inputRef}
            type="text"
            value={codigo}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="INTRODUCE CÓDIGO..."
            className="input-field text-2xl min-h-[60px]"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="mt-6 space-y-3 border-2 border-primary rounded p-4">
            <h3 className="text-primary text-lg">✓ ARTÍCULO ENCONTRADO</h3>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-muted pb-2">
                <span className="text-muted-foreground">CÓDIGO:</span>
                <span className="text-foreground">{resultado.CODIGO}</span>
              </div>
              <div className="flex justify-between border-b border-muted pb-2">
                <span className="text-muted-foreground">DESCRIPCIÓN:</span>
                <span className="text-foreground text-right flex-1 ml-4">{resultado.DESCRIPCION}</span>
              </div>
              <div className="flex justify-between border-b border-muted pb-2">
                <span className="text-muted-foreground">STOCK ACTUAL:</span>
                <span className="text-primary text-2xl">{resultado.STOCK_ACTUAL}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UBICACIÓN:</span>
                <span className="text-primary text-xl">{resultado.UBICACION}</span>
              </div>
            </div>
          </div>
        )}

        {noEncontrado && (
          <div className="mt-6 border-2 border-destructive rounded p-4">
            <p className="text-destructive text-xl text-center">
              ✗ CÓDIGO NO ENCONTRADO
            </p>
          </div>
        )}

        {(resultado || noEncontrado) && (
          <button
            onClick={handleNuevaConsulta}
            className="btn-secondary w-full mt-4"
          >
            NUEVA CONSULTA
          </button>
        )}
      </div>

      {/* NumPad area */}
      <div
        className={`${isLandscape ? 'w-[40%] border-l-4' : 'h-[50%] border-t-4'} border-primary bg-background p-4`}
      >
        <NumPad value={codigo} onChange={setCodigo} onConfirm={handleConfirm} />
      </div>
    </div>
  );
};

export default Consulta;
