"use client";

import { Bell, CalendarPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { guardarAjustes } from "@/lib/app/planificacion";
import type { Settings } from "@/lib/domain/types";
import { descargarICS, notificacionesSoportadas, pedirPermiso, sincronizarRecordatorioConSW } from "@/lib/pwa/recordatorio";

/** Configuración del recordatorio diario de abdominales. */
export function ReminderCard({ ajustes }: { ajustes: Settings }) {
  const [hora, setHora] = useState(ajustes.recordatorio.hora);
  const soportado = notificacionesSoportadas();

  async function guardar(activo: boolean, nuevaHora = hora) {
    if (activo) {
      const permiso = await pedirPermiso();
      if (permiso !== "granted") {
        toast.error("Sin permiso de notificaciones. Puedes usar el evento de calendario.");
        activo = false;
      }
    }
    const cfg = { activo, hora: nuevaHora };
    await guardarAjustes({ recordatorio: cfg });
    await sincronizarRecordatorioConSW(cfg);
    if (activo) toast.success(`Recordatorio a las ${nuevaHora}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Bell className="size-4 text-primary" /> Recordatorio diario
        </span>
        <Switch
          checked={ajustes.recordatorio.activo}
          onCheckedChange={(v) => guardar(v)}
          aria-label="Activar recordatorio diario"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="hora-rec" className="text-sm text-muted-foreground">
          Hora
        </label>
        <Input
          id="hora-rec"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          onBlur={() => hora !== ajustes.recordatorio.hora && guardar(ajustes.recordatorio.activo, hora)}
          className="h-11 w-32 rounded-xl"
        />
        <Button variant="outline" className="ml-auto h-11 rounded-xl" onClick={() => descargarICS(hora)}>
          <CalendarPlus /> Calendario
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {soportado
          ? "Con la app instalada, Android avisa en segundo plano (Chrome revisa cada cierto tiempo, no al minuto exacto). En iPhone y como respaldo, añade el evento diario a tu calendario."
          : "Este navegador no admite notificaciones: usa el evento de calendario."}
      </p>
    </div>
  );
}
