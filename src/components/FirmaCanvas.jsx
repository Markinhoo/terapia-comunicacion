import { useEffect, useRef, useState } from 'react';

function FirmaCanvas({ value, onChange }) {
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.strokeStyle = '#34263f';

    if (value) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.src = value;
    }
  }, [value]);

  const obtenerPunto = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pointer = event.touches?.[0] || event;

    return {
      x: (pointer.clientX - rect.left) * (canvas.width / rect.width),
      y: (pointer.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const iniciar = (event) => {
    event.preventDefault();
    const context = canvasRef.current.getContext('2d');
    const punto = obtenerPunto(event);
    context.beginPath();
    context.moveTo(punto.x, punto.y);
    setDibujando(true);
  };

  const mover = (event) => {
    if (!dibujando) return;
    event.preventDefault();
    const context = canvasRef.current.getContext('2d');
    const punto = obtenerPunto(event);
    context.lineTo(punto.x, punto.y);
    context.stroke();
  };

  const terminar = () => {
    if (!dibujando) return;
    setDibujando(false);
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="firma-control">
      <canvas
        ref={canvasRef}
        width="520"
        height="150"
        onMouseDown={iniciar}
        onMouseMove={mover}
        onMouseUp={terminar}
        onMouseLeave={terminar}
        onTouchStart={iniciar}
        onTouchMove={mover}
        onTouchEnd={terminar}
        aria-label="Area para firma"
      />
      <button type="button" className="btn-secondary" onClick={limpiar}>
        Limpiar firma
      </button>
    </div>
  );
}

export default FirmaCanvas;
