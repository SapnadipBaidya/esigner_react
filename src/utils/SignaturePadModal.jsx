import React, { useEffect, useRef, useState } from 'react'

function SignaturePadModal({ onSave, onClose }) {
  const canvasRef = useRef();
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";
  }, []);

const handlePointerDown = e => {
  setDrawing(true);
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const ctx = canvas.getContext("2d");
  ctx.beginPath(); // <-- Always start a new path on pointer down!
  ctx.moveTo(
    e.clientX - rect.left,
    e.clientY - rect.top
  );
};

  const handlePointerUp = () => setDrawing(false);

  const handlePointerMove = e => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
  };

  const handleSave = () => {
    const data = canvasRef.current.toDataURL("image/png");
    onSave(data);
  };


const handleClear = () => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath(); // <-- Reset the path
};

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "#0007", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 18, minWidth: 400, boxShadow: "0 2px 16px #1114" }}>
        <h3>Draw Your Signature</h3>
        <canvas
          ref={canvasRef}
          width={350}
          height={100}
          style={{ border: "1px solid #888", borderRadius: 5, cursor: "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerMove={handlePointerMove}
        />
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          <button onClick={handleSave} style={{ background: "#007bff", color: "#fff", border: "none", padding: "5px 16px", borderRadius: 4 }}>Save</button>
          <button onClick={handleClear}>Clear</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default SignaturePadModal