import React, { useState } from 'react';

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

type KeyboardMode = 'NUM' | 'ABC';

const NumPad: React.FC<NumPadProps> = ({ value, onChange, onConfirm }) => {
  const [mode, setMode] = useState<KeyboardMode>('NUM');

  const handleKey = (key: string) => {
    onChange(value + key);
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const numKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '-'];

  const abcRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '-'],
  ];

  const btnBase =
    'bg-background border-2 border-primary text-foreground font-bold min-h-[50px] rounded transition-all hover:bg-primary/20 active:scale-95';

  return (
    <div className="flex flex-col gap-2 h-full justify-center max-w-md mx-auto">
      {/* Display */}
      <div className="bg-secondary border-2 border-primary text-foreground text-2xl font-bold p-3 text-right min-h-[50px] flex items-center justify-end rounded">
        {value || '---'}
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('NUM')}
          className={`font-bold text-lg min-h-[45px] rounded transition-all ${
            mode === 'NUM'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background border-2 border-primary text-foreground hover:bg-primary/20'
          }`}
        >
          123
        </button>
        <button
          onClick={() => setMode('ABC')}
          className={`font-bold text-lg min-h-[45px] rounded transition-all ${
            mode === 'ABC'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background border-2 border-primary text-foreground hover:bg-primary/20'
          }`}
        >
          ABC
        </button>
      </div>

      {/* Keys */}
      {mode === 'NUM' ? (
        <div className="grid grid-cols-3 gap-2">
          {numKeys.map((d) => (
            <button key={d} onClick={() => handleKey(d)} className={`${btnBase} text-2xl`}>
              {d}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {abcRows.map((row, i) => (
            <div key={i} className="flex gap-1 justify-center">
              {row.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleKey(letter)}
                  className={`${btnBase} text-lg flex-1 min-h-[44px] max-w-[42px]`}
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}
          {/* Number row for ABC mode */}
          <div className="flex gap-1 justify-center">
            {['0','1','2','3','4','5','6','7','8','9'].map((n) => (
              <button
                key={n}
                onClick={() => handleKey(n)}
                className={`${btnBase} text-base flex-1 min-h-[40px] max-w-[42px]`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DEL */}
      <button onClick={handleDelete} className={`${btnBase} text-xl`}>
        ← BORRAR
      </button>

      {/* Confirmar */}
      <button
        onClick={onConfirm}
        className="btn-primary text-xl flex items-center justify-center gap-2"
      >
        CONFIRMAR ✓
      </button>

      {/* Borrar todo */}
      <button
        onClick={handleClear}
        className="bg-destructive text-destructive-foreground font-bold text-lg min-h-[50px] rounded transition-all hover:brightness-110 active:scale-95"
      >
        BORRAR TODO
      </button>
    </div>
  );
};

export default NumPad;
