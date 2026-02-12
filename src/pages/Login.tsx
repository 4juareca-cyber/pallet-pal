import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    operarios,
    agregarOperario,
    setOperario,
    cargarExcel,
    excelCargado,
  } = useAppStore();

  const [selectedOperario, setSelectedOperario] = useState('');
  const [nuevoOperario, setNuevoOperario] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setLoadMsg('');
    try {
      const result = await cargarExcel(file);
      setLoadMsg(`✓ CARGADOS ${result.articulos} ARTÍCULOS Y ${result.proveedores} PROVEEDORES`);
    } catch (err) {
      setLoadMsg('✗ ERROR AL CARGAR EL ARCHIVO');
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddOperario = () => {
    if (nuevoOperario.trim()) {
      agregarOperario(nuevoOperario.trim());
      setSelectedOperario(nuevoOperario.trim().toUpperCase());
      setNuevoOperario('');
      setShowAddInput(false);
    }
  };

  const handleIniciar = () => {
    if (selectedOperario && excelCargado) {
      setOperario(selectedOperario);
      navigate('/menu');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary tracking-wider">
            ⚙ ALMACÉN INDUSTRIAL
          </h1>
          <p className="text-muted-foreground text-sm">SISTEMA DE GESTIÓN DE STOCK</p>
        </div>

        {/* Operario */}
        <div className="space-y-3">
          <label className="text-foreground text-sm">SELECCIONAR OPERARIO</label>
          <select
            value={selectedOperario}
            onChange={(e) => setSelectedOperario(e.target.value)}
            className="input-field"
          >
            <option value="">-- SELECCIONAR --</option>
            {operarios.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>

          {!showAddInput ? (
            <button
              onClick={() => setShowAddInput(true)}
              className="btn-secondary w-full"
            >
              + AÑADIR OPERARIO
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoOperario}
                onChange={(e) => setNuevoOperario(e.target.value)}
                placeholder="NOMBRE OPERARIO"
                className="input-field flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddOperario()}
              />
              <button onClick={handleAddOperario} className="btn-primary px-4">
                ✓
              </button>
            </div>
          )}
        </div>

        {/* Carga Excel */}
        <div className="space-y-3">
          <label className="text-foreground text-sm">CARGAR BASE DE DATOS (.XLSX)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary w-full"
            disabled={loading}
          >
            {loading ? 'CARGANDO...' : '📁 SELECCIONAR ARCHIVO EXCEL'}
          </button>
          {loadMsg && (
            <p className={`text-center text-sm font-bold ${loadMsg.startsWith('✓') ? 'text-green-400' : 'text-destructive'}`}>
              {loadMsg}
            </p>
          )}
        </div>

        {/* Iniciar sesión */}
        <button
          onClick={handleIniciar}
          disabled={!excelCargado || !selectedOperario}
          className="btn-primary w-full text-2xl disabled:opacity-30 disabled:cursor-not-allowed"
        >
          INICIAR SESIÓN
        </button>
      </div>
    </div>
  );
};

export default Login;
