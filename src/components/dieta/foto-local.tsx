"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo } from "react";
import { db } from "@/lib/db/db";
import { cn } from "@/lib/utils";

/** Foto de una comida guardada en este dispositivo (no se sincroniza). */
export function FotoLocal({ mediaId, className }: { mediaId: string; className?: string }) {
  const media = useLiveQuery(() => db().media.get(mediaId), [mediaId]);
  const url = useMemo(() => (media ? URL.createObjectURL(media.blob) : null), [media]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element -- blob local, no optimizable
  return <img src={url} alt="Foto de la comida" className={cn("rounded-xl object-cover", className)} />;
}
