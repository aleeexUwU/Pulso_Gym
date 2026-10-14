"use client";

import { Bell, CalendarPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { guardarAjustes } from "@/lib/app/planificacion";
import type { Settings } from "@/lib/domain/types";
import { activarPush, actualizarHoraPush, desactivarPush, enModoApp, esIOS, pushSoportado } from "@/lib/pwa/push";
import { descargarICS, notificacionesSoportadas, pedirPermiso, sincronizarRecordatorioConSW } from "@/lib/pwa/recordatorio";

/** Configuración del recordatorio diario de abdominales. */
export function ReminderCard({ ajustes }: { ajustes: Settings }) {
  const [hora, setHora] = useState(ajustes.recordatorio.hora);
  const soportado = notificacionesSoportadas();
  const push = pushSoportado();
  const iosSinInstalar = esIOS() && !enModoApp();

  async function guardar(activo: boolean, nuevaHora = hora) {
    let conPush = false;
    if (activo) {
      // 1) Push real (avisa con la app cerrada). 2) Si no se puede, el método de siempre.
      if (push) {
        try {
          await activarPush(nuevaHora);
          conPush = true;
        } catch (e) {
          toast.warning(e instanceof Error ? e.message : "No se pudieron activar los avisos push.");
        }
      }
      if (!conPush) {
        const permiso = await pedirPermiso();
        if (permiso !== "granted") {
          toast.error("Sin permiso de notificaciones. Puedes usar el evento de calendario.");
          activo = false;
        }
      }
    } else {
      await desactivarPush().catch(() => {});
    }
    const cfg = { activo, hora: nuevaHora };
    await guardarAjustes({ recordatorio: cfg });
    await sincronizarRecordatorioConSW(cfg);
    if (activo) toast.success(conPush ? `Te avisaré a las ${nuevaHora} si te falta el gimnasio o el core` : `Recordatorio a las ${nuevaHora}`);
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
          onBlur={() => {
            if (hora === ajustes.recordatorio.hora) return;
            void actualizarHoraPush(hora).catch(() => {});
            void guardar(ajustes.recordatorio.activo, hora);
          }}
          className="h-11 w-32 rounded-xl"
        />
        <Button variant="outline" className="ml-auto h-11 rounded-xl" onClick={() => descargarICS(hora)}>
          <CalendarPlus /> Calendario
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {iosSinInstalar
          ? "En iPhone los avisos solo llegan con la app instalada: en Safari pulsa Compartir → «Añadir a pantalla de inicio», ábrela desde ahí y activa el recordatorio. Mientras, puedes usar el evento de calendario."
          : push
            ? "Te llega un aviso aunque la app esté cerrada (necesitas haber iniciado sesión), solo si ese día te falta el gimnasio o el core. Llega en los 15 minutos siguientes a la hora elegida."
            : soportado
              ? "Este navegador no admite avisos push: avisará al abrir la app. Como respaldo, añade el evento diario a tu calendario."
              : "Este navegador no admite notificaciones: usa el evento de calendario."}
      </p>
    </div>
  );
}
