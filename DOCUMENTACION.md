# EMKT Zittex — Manual de Usuario

Aplicación web para armar, gestionar y enviar campañas de email marketing masivo vía SMTP. Desarrollada con React + TypeScript (frontend) y Express/Node (backend).

---

## Índice

0. [Acceso](#0-acceso)
1. [Panel de Control](#1-panel-de-control)
2. [Cuentas de Correo (SMTP)](#2-cuentas-de-correo-smtp)
3. [Plantillas de Correo](#3-plantillas-de-correo)
4. [Listas de Destinatarios](#4-listas-de-destinatarios)
5. [Asistente de Campañas](#5-asistente-de-campañas)
6. [Historial de Campañas](#6-historial-de-campañas)
7. [Ajustes](#7-ajustes)
8. [Tema claro/oscuro e idioma rápido](#8-tema-clarooscuro-e-idioma-rápido)
9. [Asistente de ayuda con IA](#9-asistente-de-ayuda-con-ia)
10. [Solución de Problemas](#10-solución-de-problemas)

---

## 0. Acceso

EMKT Zittex es de un solo usuario/contraseña compartida (no tiene cuentas individuales por persona). Para entrar:

1. Ir a la URL de la app.
2. Escribir la contraseña configurada.
3. Tocar **Ingresar**.

La sesión queda guardada en el navegador (cookie) durante 7 días. Para salir, usar **Cerrar Sesión** al pie de la barra lateral — pide confirmación, y si hay una campaña enviándose en ese momento avisa que se va a interrumpir.

---

## 1. Panel de Control

Es la primera pantalla al entrar. Muestra:

- **Correos Enviados**, **Plantillas Activas**, **Cuentas de Envío**, **Tasa de Éxito**: estadísticas generales acumuladas.
- **Rendimiento de Campañas Recientes**: gráfico de barras con los envíos de las últimas campañas.
- **Actividad Reciente**: últimas 5 campañas completadas, con fecha y hora.

---

## 2. Cuentas de Correo (SMTP)

Las cuentas SMTP son desde donde se envían los correos. Sección **Cuentas** en la barra lateral.

### Agregar una cuenta

1. Tocar **Agregar Cuenta**.
2. Completar:
   - **Nombre de la Cuenta**: descriptivo (ej. "Zittex Info").
   - **Dirección de Correo**: la casilla que enviará los mensajes.
   - **Servidor SMTP (Host)**: dirección del servidor (ej. `smtp.gmail.com`, o el host que indique el proveedor de hosting).
   - **Puerto**: `587` (STARTTLS) o `465` (SSL directo) — usar el que indique el proveedor.
   - **Usuario**: normalmente la dirección de correo completa.
   - **Contraseña de Aplicación**: se recomienda una contraseña de aplicación específica, no la personal.
3. Marcar **"Establecer como cuenta principal"** si va a ser la cuenta por defecto en nuevas campañas.
4. Tocar **"Probar SMTP"** para verificar la conexión antes de guardar — muestra "Conexión SMTP verificada correctamente" o el error puntual (credenciales, host, certificado, etc.).
5. Tocar **"Guardar Cuenta"**.

Se pueden cargar varias cuentas SMTP a la vez; cada campaña elige con cuál enviar.

### Editar o eliminar

Pasar el mouse sobre una cuenta para ver los botones de editar y eliminar.

---

## 3. Plantillas de Correo

Sección **Plantillas** — diseño del HTML del correo con marcadores dinámicos.

### Crear una plantilla

1. Tocar **Nueva Plantilla**.
2. Escribir el **Asunto del Correo** (puede incluir marcadores).
3. Editar el HTML en alguno de los tres modos:
   - **Código**: editor con resaltado de sintaxis.
   - **Vista Previa**: renderizado visual.
   - **Dividida**: código y vista previa en paralelo.
4. Usar **marcadores dinámicos** con doble llave, por ejemplo `{{name}}`, `{{email}}`, `{{company}}` — se reemplazan por el dato real de cada destinatario al enviar. Cualquier columna que se haya importado en una lista de destinatarios queda disponible como variable con ese mismo nombre.
5. Si no se completa el nombre de la plantilla, se usa el asunto como nombre por defecto.
6. Tocar **Guardar**.

### Otras acciones

- **Importar/Exportar HTML**: subir o descargar el contenido como archivo `.html`.
- **Duplicar**: crea una copia editable de una plantilla existente.

---

## 4. Listas de Destinatarios

Sección **Listas** — bases de contactos reutilizables entre campañas.

### Importar un CSV

1. Tocar **Importar CSV**.
2. Seleccionar el archivo `.csv`.
3. **Mapeo de columnas**: la app detecta automáticamente qué columna es el email (por el nombre de la columna o porque su contenido tiene forma de email) y sugiere un nombre de variable limpio para el resto de las columnas (sin espacios ni acentos). Se puede:
   - Renombrar cualquier variable antes de confirmar.
   - Dejar el campo vacío para **no** importar esa columna.
   - Es obligatorio que una columna quede mapeada a `email`.
4. Tocar **Confirmar mapeo**. Se valida el formato de cada email y se eliminan duplicados automáticamente; se muestra cuántos destinatarios quedaron válidos, inválidos y duplicados.
5. Completar los metadatos opcionales de la lista (nombre, clasificación, zona, ciudad, país) y tocar **Guardar lista**.

Si después de confirmar el mapeo hace falta corregir algo, el enlace **Editar mapeo** vuelve a la tabla de mapeo sin tener que resubir el archivo.

### Otras acciones

- **Exportar**: descarga la lista completa como CSV.
- **Eliminar**: borra la lista guardada.

---

## 5. Asistente de Campañas

Sección **Campañas** → botón **Nueva Campaña**. Asistente de 4 pasos.

### Paso 1: Conceptos

- Nombre de la campaña.
- Cuenta de envío (SMTP) — se puede buscar por nombre.
- Plantilla — se puede buscar por nombre o asunto.

### Paso 2: Destinatarios

Dos opciones:
- **Usar lista guardada**: elegir una lista ya importada en la sección Listas.
- **Subir Lista de Destinatarios**: subir un CSV nuevo directo desde el asistente (validación automática de formato y duplicados; a diferencia de la importación en Listas, este atajo no tiene mapeo de columnas — requiere que el CSV ya tenga una columna llamada `email`).

### Paso 3: Revisión

- **Total de destinatarios** y vista previa personalizada usando el primer contacto de la lista (muestra cómo quedan los marcadores `{{...}}` reemplazados con datos reales).
- **Pausa entre correos**: sin pausa, 1, 3, 5 o 10 segundos — para no superar límites de velocidad del proveedor SMTP.
- **Reintentos por fallo**: 0 a 3 intentos adicionales por destinatario si el envío falla.

### Paso 4: Lanzamiento

1. Tocar **"Empezar Envío Ahora"**.
2. Progreso en vivo: porcentaje, enviados y fallidos.
3. Al terminar, la campaña queda en el historial con estado **Completada**.

> Una vez lanzada la campaña no se puede detener desde la interfaz. Si se cierra la pestaña o se pierde conexión, el envío se interrumpe para los contactos restantes.

---

## 6. Historial de Campañas

Sección **Campañas** (fuera del asistente) — lista de campañas anteriores con su estado (Completada / Enviando / Fallida), destinatarios totales, enviados y fallidos.

- **Exportar**: descarga un CSV con el detalle de cada envío (destinatario, estado, asunto, error, fecha).
- **Reintentar**: crea una nueva campaña solo con los destinatarios que fallaron en la original.
- **Eliminar**: borra la campaña del historial (no reenvía nada, solo borra el registro).

---

## 7. Ajustes

Sección **Ajustes** — selector completo de idioma (Español / English / Français) y créditos del proyecto.

---

## 8. Tema claro/oscuro e idioma rápido

Al pie de la barra lateral, arriba de "Cerrar Sesión", hay dos accesos directos:

- **Botón sol/luna**: alterna entre modo claro y modo oscuro. La preferencia se guarda en el navegador (no requiere volver a elegirla cada vez que se entra).
- **Selector ES/EN**: cambia el idioma de toda la interfaz al instante, sin entrar a Ajustes. Para francés, usar el selector completo en Ajustes.

---

## 9. Asistente de ayuda con IA

Botón flotante (ícono de robot) abajo a la derecha, visible en cualquier pantalla una vez logueado. Responde preguntas sobre cómo usar EMKT Zittex — no sobre otros temas.

1. Tocar el botón para abrir el panel de chat.
2. Escribir la pregunta y enviar con **Enter** (Shift+Enter para salto de línea).
3. La respuesta aparece en unos segundos.

Si el mensaje dice que el asistente "no está configurado en este servidor", significa que falta cargar la clave de IA (`GEMINI_API_KEY`) del lado del servidor — es un problema de configuración, no del uso de la app.

---

## 10. Solución de Problemas

### Error de conexión SMTP

- Revisar host, puerto, usuario y contraseña.
- Usar contraseña de aplicación (no la personal) si el proveedor lo exige (Gmail, Outlook, etc.).
- Probar primero con **"Probar SMTP"** antes de guardar la cuenta.
- Si el error menciona el certificado, verificar que el host escrito coincida con el nombre para el que está emitido el certificado SSL del servidor.

### El CSV no importa destinatarios

- En **Listas**: revisar el paso de mapeo — una columna tiene que estar asignada a la variable `email`.
- En el asistente de **Campañas** (subida rápida): el CSV debe tener una columna llamada exactamente `email` (no tiene mapeo).
- Verificar formato de email válido (`usuario@dominio.com`). Los duplicados se omiten automáticamente.

### Los correos no llegan a destino

- Revisar la carpeta de spam del destinatario.
- Aumentar la pausa entre correos (3-5 segundos) si el proveedor SMTP está limitando el envío.
- Usar una cuenta SMTP con buena reputación de envío.

### El asistente de IA no responde

- Si dice "no está configurado", falta la clave `GEMINI_API_KEY` en el servidor — avisar al administrador.
- Si tarda mucho o da error de red, reintentar en unos segundos.

---

*EMKT Zittex*
