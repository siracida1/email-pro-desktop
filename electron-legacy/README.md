# Versión de escritorio (archivada)

Estos archivos son los del build Electron original de MassMail Pro Desktop, archivados al convertir la app a un servicio web (ver `server/`).

- `electron-main.js` — proceso principal Electron: ventana, IPC (`db:get/save`, `email:test-smtp`, `email:send`), persistencia con `electron-store`. Su lógica de SMTP/CID de imágenes fue portada a `server/lib/mailer.js`.
- `preload.js` — puente de contexto que exponía `window.electronAPI` al renderer.
- `iniciar_aplicacion.bat` — launcher de un clic para la versión de escritorio.

Para retomar el build de escritorio: reinstalar `electron` y `electron-builder`, restaurar `main: "electron-main.js"` y la sección `"build"` en `package.json` (ver git history del commit que las quitó), y mover estos archivos de vuelta a la raíz del repo.
