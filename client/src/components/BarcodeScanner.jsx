import React, { useEffect, useRef, useState } from "react";

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const [message, setMessage] = useState("Opening camera...");

  useEffect(() => {
    let active = true;
    async function start() {
      if (!window.BarcodeDetector) {
        setMessage("Camera scanning is not supported in this browser. Use manual barcode entry below.");
        return;
      }
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        if (!active || !videoRef.current) return;
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({ formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"] });
        setMessage("Point the camera at a barcode.");
        const scan = async () => {
          if (!active || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) { onDetected(codes[0].rawValue); return; }
          } catch { /* retry on the next frame */ }
          frameRef.current = requestAnimationFrame(scan);
        };
        scan();
      } catch {
        setMessage("Camera access was unavailable. Allow camera permission or enter the barcode manually.");
      }
    }
    start();
    return () => {
      active = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onDetected]);

  return (
    <div className="scanner-panel">
      <video ref={videoRef} className="scanner-video" muted playsInline />
      <p className="scanner-message">{message}</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close Scanner</button>
    </div>
  );
}