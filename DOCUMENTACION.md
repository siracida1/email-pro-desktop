# MassMail Pro Desktop

Aplicación de escritorio para el envío masivo de correos electrónicos vía SMTP. Desarrollada con Electron + React + TypeScript.

---

## Índice

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación](#instalación)
3. [Guía de Uso](#guía-de-uso)
   - [Ajustes / Idioma](#1-ajustes--idioma)
   - [Cuentas de Correo (SMTP)](#2-cuentas-de-correo-smtp)
   - [Plantillas de Correo](#3-plantillas-de-correo)
   - [Listas de Destinatarios](#4-listas-de-destinatarios)
   - [Asistente de Campañas](#5-asistente-de-campañas)
   - [Historial de Campañas](#6-historial-de-campañas)
4. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos del Sistema

### Mínimos
- **Sistema Operativo:** Windows 10 u 11 (64 bits)
- **Procesador:** Intel Core i3 o AMD equivalente (o superior)
- **Memoria RAM:** 4 GB
- **Almacenamiento:** 500 MB de espacio libre
- **Conexión a Internet:** Necesaria para el envío de correos SMTP

### Recomendados
- **Sistema Operativo:** Windows 11 (64 bits)
- **Procesador:** Intel Core i5 o AMD Ryzen 5 (o superior)
- **Memoria RAM:** 8 GB o más
- **Almacenamiento:** 1 GB de espacio libre
- **Conexión a Internet:** Banda ancha estable

### Dependencias (solo para desarrollo)
- **Node.js:** v18 o superior
- **npm:** v9 o superior
- **Git** (opcional, para control de versiones)

---

## Instalación

### Para usuarios finales (ejecutable compilado)

1. Descarga el instalador `MassMail Pro Setup 1.0.0.exe` o el ejecutable portátil `MassMail Pro 1.0.0.exe` desde la carpeta `release/`.
2. **Instalador:** Ejecuta el archivo `.exe` y sigue los pasos del asistente. Puedes elegir la carpeta de instalación y si deseas accesos directos.
3. **Portátil:** Ejecuta el archivo `.exe` directamente. No requiere instalación.
4. La aplicación se abrirá en pantalla completa maximizada.

### Para desarrolladores (desde código fuente)

1. Clona o descarga el repositorio.
2. Abre una terminal en la carpeta del proyecto.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
   Esto abrirá la aplicación con recarga en caliente (hot reload).
5. Para compilar una versión de producción:
   ```bash
   npm run build
   ```
   Los ejecutables se generarán en la carpeta `release/`.

---

## Guía de Uso

### 1. Ajustes / Idioma

La sección de **Ajustes** (icono de globo en la barra lateral) permite personalizar la aplicación.

#### Cambiar idioma

MassMail Pro está disponible en tres idiomas:

| Idioma | Código |
|--------|--------|
| Español | ES |
| English | EN |
| Français | FR |

Para cambiar el idioma:
1. Ve a **Ajustes** en la barra lateral.
2. En la sección **Idioma**, selecciona el idioma deseado.
3. La interfaz se traducirá al instante. El cambio se guarda automáticamente.

#### Créditos

En la misma pantalla de Ajustes encontrarás los créditos del desarrollador y el botón para apoyar el proyecto:
- **Desarrollador:** Christian Freelance
- **Correo:** chrishb2000@gmail.com
- **Sitio web:** https://christian-freelance.us/
- **Apoyar el proyecto:** [Invítame un café mediante PayPal](https://www.paypal.com/donate/?hosted_button_id=YC6YAWBQ7HNSS)

---

### 2. Cuentas de Correo (SMTP)

Esta sección permite gestionar las cuentas SMTP desde las que se enviarán los correos.

#### Agregar una cuenta

1. Ve a **Cuentas** en la barra lateral.
2. Haz clic en **Agregar Cuenta**.
3. Completa los siguientes campos:
   - **Nombre de la Cuenta:** Un nombre descriptivo (ej. "Correo Trabajo").
   - **Dirección de Correo:** La dirección de correo electrónico desde la que se enviarán los mensajes.
   - **Servidor SMTP (Host):** La dirección del servidor SMTP (ej. `smtp.gmail.com`, `smtp.office365.com`).
   - **Puerto:** Generalmente `587` (STARTTLS) o `465` (SSL directo).
   - **Usuario:** Normalmente la dirección de correo completa.
   - **Contraseña de Aplicación:** Se recomienda usar una contraseña de aplicación específica (no la contraseña personal). Consulta la ayuda de tu proveedor de correo (Gmail, Outlook, etc.) para generar una.
4. Marca **"Establecer como cuenta principal"** si será la cuenta por defecto.
5. Usa el botón **"Probar SMTP"** para verificar que la conexión funciona antes de guardar.
6. Haz clic en **"Guardar Cuenta"**.

#### Editar o eliminar una cuenta

- Pasa el ratón sobre una cuenta para ver los botones de editar (lápiz) y eliminar (papelera).
- Al editar, también puedes eliminar la cuenta desde el botón inferior del modal.

#### Consejos SMTP

| Proveedor | Host | Puerto | Notas |
|-----------|------|--------|-------|
| Gmail | `smtp.gmail.com` | 587 | Usar contraseña de aplicación (no la personal) |
| Outlook/Hotmail | `smtp-mail.outlook.com` | 587 | Autenticación moderna requerida |
| Yahoo | `smtp.mail.yahoo.com` | 465 | |
| Office 365 | `smtp.office365.com` | 587 | |
| Proveedor propio | (varía) | (varía) | Consulta con tu proveedor |

---

### 3. Plantillas de Correo

Permite diseñar plantillas HTML personalizables con marcadores dinámicos.

#### Crear una plantilla

1. Ve a **Plantillas** en la barra lateral.
2. Haz clic en **Nueva Plantilla**.
3. Se abrirá un editor completo con tres modos de vista:
   - **Código:** Editor de HTML con resaltado de sintaxis (fondo oscuro).
   - **Vista Previa:** Renderizado visual del HTML.
   - **Dividida:** Código y vista previa en paralelo.
4. En la barra lateral izquierda:
   - Escribe el **Asunto del Correo** (puede incluir marcadores).
   - Usa los **Marcadores (Placeholders)** para personalizar el contenido:
     - `{{name}}` : Nombre del destinatario
     - `{{email}}` : Correo del destinatario
     - `{{company}}` : Empresa del destinatario
5. El contenido HTML puede incluir imágenes locales (se incrustarán automáticamente como adjuntos CID en el mensaje).
6. Haz clic en **Guardar**.

#### Importar / Exportar HTML

- **Importar:** Usa el botón de subida (flecha hacia arriba) para cargar un archivo `.html`.
- **Exportar:** Usa el botón de descarga (flecha hacia abajo) para guardar la plantilla como `.html`.

#### Duplicar plantillas

Usa el botón de copiar para duplicar una plantilla existente como base para una nueva.

---

### 4. Listas de Destinatarios

Gestiona las bases de datos de contactos para tus campañas.

#### Importar una lista CSV

1. Ve a **Listas** en la barra lateral.
2. Haz clic en **Importar CSV**.
3. Arrastra o selecciona un archivo `.csv`. El archivo **debe** contener una columna llamada `email`.
4. La aplicación validará automáticamente:
   - Correos electrónicos válidos (formato correcto).
   - Eliminación de duplicados.
   - Omisión de filas sin correo válido.
5. Después de la importación, completa los metadatos opcionales:
   - **Nombre de la lista:** Útil para identificar la lista.
   - **Clasificación:** Por ejemplo: clientes, leads, proveedores.
   - **Zona:** Por ejemplo: norte, sur, levante.
   - **Ciudad / País:** Para segmentación geográfica.
6. Haz clic en **Guardar lista**.

#### Columnas adicionales en el CSV

Puedes incluir columnas adicionales además de `email` (como `name`, `company`, etc.). Estas se usarán como marcadores en las plantillas (`{{name}}`, `{{company}}`, etc.).

Ejemplo de CSV válido:
```csv
email,name,company,city
cliente1@ejemplo.com,Juan Pérez,Empresa SL,Madrid
cliente2@ejemplo.com,María García,Corp Inc,Barcelona
```

#### Exportar o eliminar listas

- Usa el icono de descarga para exportar una lista a CSV.
- Usa el icono de papelera para eliminar una lista.

---

### 5. Asistente de Campañas

Es el corazón de la aplicación. Permite configurar y ejecutar campañas de envío masivo en **4 pasos**.

#### Paso 1: Conceptos

1. **Nombre de la campaña:** Ponle un nombre descriptivo.
2. **Cuenta de Envío:** Selecciona la cuenta SMTP desde la que enviar. Puedes buscar entre tus cuentas.
3. **Seleccionar Plantilla:** Elige la plantilla HTML que usarás. Puedes buscar por nombre o asunto.

#### Paso 2: Destinatarios

Tienes dos opciones:

**Opción A - Usar lista guardada:**
- Selecciona una lista previamente importada. Se cargarán sus destinatarios automáticamente.

**Opción B - Subir nuevo CSV:**
- Arrastra o selecciona un archivo `.csv` con los destinatarios.
- Los datos se validarán automáticamente (formato, duplicados).
- Opcionalmente, puedes guardar la lista para usarla en el futuro completando los metadatos.

#### Paso 3: Revisión

Antes de lanzar la campaña, revisa:

1. **Detalles de la Campaña:** Nombre y número de destinatarios.
2. **Configuración:** Cuenta y plantilla seleccionadas.
3. **Control de Envío:**
   - **Pausa entre correos:** Intervalo de espera entre cada envío (0, 1, 3, 5 o 10 segundos). Útil para evitar límites de velocidad del proveedor SMTP.
   - **Reintentos por fallo:** Número de intentos adicionales si un envío falla (0-3).
4. **Vista previa personalizada:** Se muestra una previsualización usando el primer destinatario de la lista.

#### Paso 4: Lanzamiento

1. Haz clic en **"Empezar Envío Ahora"**.
2. El progreso se muestra en tiempo real:
   - Porcentaje completado.
   - Número de correos enviados exitosamente.
   - Número de fallos.
3. Al finalizar, serás redirigido al historial de campañas.

> **Nota:** Una vez iniciada la campaña, el proceso no se puede detener desde la interfaz. Si cierras la aplicación, el envío se interrumpirá para los contactos restantes.

---

### 6. Historial de Campañas

Muestra todas las campañas realizadas con su estado y resultados.

#### Estados de campaña

| Estado | Descripción |
|--------|-------------|
| COMPLETADA | Todos los correos se procesaron (puede haber fallos parciales). |
| ENVIANDO | La campaña está actualmente en progreso. |
| FALLIDA | Hubo errores en el envío (se muestran los detalles). |

#### Acciones disponibles

- **Exportar:** Descarga un CSV con el registro detallado de cada envío (destinatario, estado, asunto, error, fecha).
- **Reintentar:** Crea una nueva campaña solo con los destinatarios que fallaron en la campaña original.
- **Eliminar:** Borra la campaña del historial.

#### Panel de Control

La pantalla principal (Panel) muestra:
- **Estadísticas:** Correos enviados, plantillas activas, cuentas de envío, tasa de éxito.
- **Gráfico:** Rendimiento de las últimas campañas (barras).
- **Actividad Reciente:** Últimas 5 campañas registradas.

---

## Solución de Problemas

### Error de conexión SMTP

- Verifica que el host, puerto y credenciales sean correctos.
- Algunos proveedores requieren **contraseñas de aplicación** específicas (Gmail, Outlook).
- Asegúrate de que tu proveedor SMTP permita conexiones desde aplicaciones de terceros.
- Prueba primero con el botón **"Probar SMTP"** antes de guardar la cuenta.

### El archivo CSV no se importa

- Asegúrate de que el archivo tenga una columna llamada exactamente `email`.
- Verifica que los correos tengan un formato válido (`usuario@dominio.com`).
- Los duplicados se omiten automáticamente.

### La aplicación no se abre

- Si usas el instalador, asegúrate de tener permisos de administrador.
- Si usas la versión portátil, prueba ejecutando como administrador.
- Verifica que tu sistema cumpla con los requisitos mínimos.

### Los correos no llegan a los destinatarios

- Revisa la carpeta de **spam** o **correo no deseado**.
- Verifica que la plantilla HTML no tenga elementos bloqueados por el proveedor de correo.
- Aumenta la pausa entre correos (3-5 segundos) para evitar ser marcado como spam.
- Usa una cuenta SMTP con buena reputación de envío.

### Cambio de idioma

- El idioma se guarda automáticamente al seleccionarlo en **Ajustes**.
- Si el cambio no se refleja de inmediato, reinicia la aplicación.

---

## Soporte y Donaciones

Para reportar problemas, sugerencias o invitar un café al desarrollador:

- **Desarrollador:** Christian Freelance
- **Correo:** chrishb2000@gmail.com
- **Sitio web:** https://christian-freelance.us/
- **Donaciones (PayPal):** [Invítame un café](https://www.paypal.com/donate/?hosted_button_id=YC6YAWBQ7HNSS)

---

*MassMail Pro Desktop v1.0.0*
