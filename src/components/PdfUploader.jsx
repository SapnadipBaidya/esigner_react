import { useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import "./cssComponent/PdfUploader.css"; // ← Import the CSS

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

export default function PdfUploader({
  pdfDoc,
  setPdfDoc,
  totalPages,
  setTotalPages,
  currentPage,
  scale,
  setScale,
}) {
  const canvasRef = useRef(null);

  // PDF Upload handler
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    setPdfDoc(pdf);
    setTotalPages(pdf.numPages);
  };

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc) return;
    const render = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    };
    render();
  }, [pdfDoc, currentPage, scale]);

  return (
    <div className="pdfu-root">
      <label className="pdfu-upload-label">
        <span className="pdfu-upload-btn">Upload PDF</span>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="pdfu-upload-input"
        />
      </label>
      <div className="pdfu-canvas-container">
        <canvas ref={canvasRef} className="pdfu-canvas" />
      </div>
    </div>
  );
}
