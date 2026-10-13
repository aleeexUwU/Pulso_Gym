"use client";

import { Camera, CameraOff, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { vibrar } from "@/components/rest-timer";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;

/**
 * Lee códigos de barras con la cámara. Usa BarcodeDetector (Chrome/Android) y,
 * si el navegador no lo tiene (Safari/iPhone), la librería ZXing. También se
 * puede escribir el número a mano.
 */
export function EscanerCodigo({ onCodigo, buscando }: { onCodigo: (codigo: string) => void; buscando: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [activo, setActivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const onCodigoRef = useRef(onCodigo);
  useEffect(() => {
    onCodigoRef.current = onCodigo;
  });

  useEffect(() => {
    if (!activo) return;
    let parar: (() => void) | null = null;
    let cancelado = false;
    const leido = (codigo: string) => {
      vibrar([80]);
      setActivo(false);
      onCodigoRef.current(codigo);
    };

    (async () => {
      try {
        const Nativo = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        if (Nativo) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (cancelado) return stream.getTracks().forEach((t) => t.stop());
          const v = video.current!;
          v.srcObject = stream;
          await v.play();
          const det = new Nativo({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
          let vivo = true;
          parar = () => {
            vivo = false;
            stream.getTracks().forEach((t) => t.stop());
          };
          const bucle = async () => {
            if (!vivo) return;
            try {
              const r = await det.detect(v);
              if (r[0]?.rawValue) return leido(r[0].rawValue);
            } catch {
              /* fotograma no listo */
            }
            setTimeout(bucle, 250);
          };
          void bucle();
        } else {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const lector = new BrowserMultiFormatReader();
          const controles = await lector.decodeFromConstraints(
            { video: { facingMode: "environment" } },
            video.current!,
            (resultado) => {
              if (resultado) leido(resultado.getText());
            },
          );
          parar = () => controles.stop();
          if (cancelado) parar();
        }
      } catch {
        setError("No se pudo abrir la cámara. Da permiso o escribe el número del código.");
        setActivo(false);
      }
    })();
    return () => {
      cancelado = true;
      parar?.();
    };
  }, [activo]);

  return (
    <div className="space-y-3">
      <div className="relative grid min-h-48 place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-black/40">
        <video ref={video} muted playsInline className={activo ? "h-56 w-full object-cover" : "hidden"} />
        {activo && <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-primary shadow-[0_0_12px_var(--neon)]" aria-hidden />}
        {!activo && (
          <Button variant="secondary" className="h-14 rounded-2xl px-6 text-base" onClick={() => (setError(null), setActivo(true))} disabled={buscando}>
            {buscando ? <Loader2 className="animate-spin" /> : <Camera />} Escanear código de barras
          </Button>
        )}
      </div>
      {activo && (
        <Button variant="ghost" className="w-full" onClick={() => setActivo(false)}>
          <CameraOff /> Cerrar cámara
        </Button>
      )}
      {error && <p className="text-sm text-warn">{error}</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) onCodigo(manual.trim());
        }}
      >
        <Input
          inputMode="numeric"
          placeholder="…o escribe el número (EAN)"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          className="h-11 rounded-xl"
          aria-label="Número del código de barras"
        />
        <Button type="submit" variant="outline" className="h-11 rounded-xl" disabled={buscando} aria-label="Buscar producto">
          <Search />
        </Button>
      </form>
    </div>
  );
}
