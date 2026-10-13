"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo } from "react";
import { db } from "@/lib/db/db";

/** Reproduce un vídeo guardado en IndexedDB (no se sincroniza: vive solo en este dispositivo). */
export function VideoPropio({ mediaId }: { mediaId: string }) {
  const media = useLiveQuery(() => db().media.get(mediaId), [mediaId]);
  const url = useMemo(() => (media ? URL.createObjectURL(media.blob) : null), [media]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  if (media === undefined) return null;
  if (!media) return <p className="text-xs text-muted-foreground">El vídeo está en otro dispositivo.</p>;
  return url ? <video src={url} controls playsInline className="w-full rounded-2xl" /> : null;
}
