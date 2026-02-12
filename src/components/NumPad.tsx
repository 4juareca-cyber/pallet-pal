import React from 'react';

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

const NumPad: React.FC<NumPadProps> = ({ value, onChange, onConfirm }) => {
  const handleDigit = (digit: string) => {
    onChange(value + digit);
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'];

  return (
    <div className="flex flex-col gap-2 h-full justify-center max-w-sm mx-auto">
      {/* Display */}
      <div className="bg-secondary border-2 border-primary text-foreground text-3xl font-bold p-4 text-right min-h-[60px] flex items-center justify-end rounded">
        {value || '0'}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {digits.map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="bg-background border-2 border-primary text-foreground text-2xl font-bold min-h-[60px] rounded transition-all hover:bg-primary/20 active:scale-95"
          >
            {d}
          </button>
        ))}
        <button
          onClick={handleDelete}
          className="bg-background border-2 border-primary text-foreground text-2xl font-bold min-h-[60px] rounded transition-all hover:bg-primary/20 active:scale-95"
        >
          DEL
        </button>
      </div>

      {/* Confirmar */}
      <button
        onClick={onConfirm}
        className="btn-primary text-2xl flex items-center justify-center gap-2"
      >
        CONFIRMAR ✓
      </button>

      {/* Borrar todo */}
      <button
        onClick={handleClear}
        className="bg-destructive text-destructive-foreground font-bold text-xl min-h-[60px] rounded transition-all hover:brightness-110 active:scale-95"
      >
        BORRAR TODO
      </button>
    </div>
  );
};

export default NumPad;
