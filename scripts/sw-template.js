/* Service worker de la PWA. scripts/build-sw.mjs sustituye __VERSION__ y __PRECACHE__ en el build. */
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const IMAGENES = __IMAGENES__;
const CACHE_APP = `app-${VERSION}`;
const CACHE_IMG = "imagenes-v1";
const CACHE_RUNTIME = "runtime-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_APP);
      await cache.addAll(PRECACHE);
      // Las imágenes de técnica se descargan en segundo plano (no bloquean la instalación).
      caches.open(CACHE_IMG).then(async (c) => {
        for (const url of IMAGENES) {
          if (!(await c.match(url))) {
            try {
              await c.add(url);
            } catch {
              /* se reintenta al verla */
            }
          }
        }
      });
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(
        claves.filter((k) => k.startsWith("app-") && k !== CACHE_APP).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.tipo === "RECORDATORIO") guardarRecordatorio(event.data.config);
});

function normalizar(url) {
  const u = new URL(url);
  let p = u.pathname;
  if (!p.endsWith("/") && !p.includes(".")) p += "/";
  return p;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase y demás: directo a la red.

  // Navegación: red primero (para tener la última versión) y caché si no hay conexión.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          return res;
        } catch {
          const cache = await caches.open(CACHE_APP);
          return (
            (await cache.match(normalizar(req.url))) ||
            (await cache.match(normalizar(req.url) + "index.html")) ||
            (await cache.match("/"))
          );
        }
      })(),
    );
    return;
  }

  // Imágenes de ejercicios: caché primero.
  if (url.pathname.endsWith(".webp") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_IMG);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })(),
    );
    return;
  }

  // Estáticos versionados de Next (y payloads RSC): caché primero, luego red.
  event.respondWith(
    (async () => {
      const hit = (await caches.match(req, { ignoreSearch: url.pathname.endsWith(".txt") })) || null;
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok && (url.pathname.startsWith("/_next/") || url.pathname.endsWith(".txt"))) {
          const c = await caches.open(CACHE_RUNTIME);
          c.put(req, res.clone());
        }
        return res;
      } catch {
        return new Response("Sin conexión", { status: 503 });
      }
    })(),
  );
});

// ── Recordatorio diario de abdominales ──
// Se guarda la hora en la Cache API para que el SW la conozca sin la página abierta.
async function guardarRecordatorio(config) {
  const c = await caches.open("config-v1");
  await c.put("/__recordatorio", new Response(JSON.stringify(config)));
}

async function leerRecordatorio() {
  const c = await caches.open("config-v1");
  const r = await c.match("/__recordatorio");
  return r ? r.json() : null;
}

async function comprobarRecordatorio() {
  const cfg = await leerRecordatorio();
  if (!cfg || !cfg.activo) return;
  const ahora = new Date();
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  const [h, m] = String(cfg.hora || "20:00").split(":").map(Number);
  const pasada = ahora.getHours() > h || (ahora.getHours() === h && ahora.getMinutes() >= m);
  if (!pasada || cfg.ultimoAviso === hoy || cfg.hechoHoy === hoy) return;
  await self.registration.showNotification("Core en casa", {
    body: "Te quedan 10–15 min de abdominales para mantener la racha.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "recordatorio-abs",
    data: { url: "/abdominales/" },
  });
  await guardarRecordatorio({ ...cfg, ultimoAviso: hoy });
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "recordatorio-abs") event.waitUntil(comprobarRecordatorio());
});

self.addEventListener("push", (event) => {
  const datos = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(datos.titulo || "Entreno", {
      body: datos.cuerpo || "",
      icon: "/icons/icon-192.png",
      data: { url: datos.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const v of ventanas) {
        if ("focus" in v) {
          await v.navigate(url).catch(() => {});
          return v.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
