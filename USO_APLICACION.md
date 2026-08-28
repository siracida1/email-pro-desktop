# Instrucciones de uso de MassMail Pro

## Instalacion

1. Abre el instalador `MassMail Pro Setup 1.0.0.exe`.
2. Sigue los pasos del asistente de instalacion.
3. Ejecuta MassMail Pro desde el acceso directo creado por el instalador.

Tambien puedes usar la version portable `MassMail Pro 1.0.0.exe` sin instalar.

## Configurar una cuenta SMTP

1. Entra en `Cuentas`.
2. Pulsa `Agregar Cuenta`.
3. Completa nombre, correo, servidor SMTP, puerto, usuario y contrasena de aplicacion.
4. Marca la cuenta como principal si sera la usada por defecto.
5. Guarda los cambios.
6. Usa `Probar SMTP` antes de guardar o antes de usar la cuenta en una campana.

Puertos habituales:

- `587`: envio con STARTTLS.
- `465`: envio con SSL/TLS directo.

## Crear una plantilla

1. Entra en `Plantillas`.
2. Pulsa `Nueva Plantilla`.
3. Escribe un nombre interno y el asunto del correo.
4. Pega o redacta el HTML del mensaje.
5. Usa marcadores para personalizar el contenido: `{{name}}`, `{{email}}`, `{{company}}`.
6. Usa `Codigo`, `Vista Previa` o `Dividida` segun prefieras editar.
7. Puedes importar un archivo `.html`, exportar el HTML o duplicar una plantilla existente.
8. Revisa la vista previa y guarda la plantilla.

## Preparar el CSV de destinatarios

El CSV debe tener una columna llamada `email`. Puedes agregar columnas adicionales para personalizar el correo.

Ejemplo:

```csv
email,name,company
cliente1@ejemplo.com,Ana,Empresa Norte
cliente2@ejemplo.com,Carlos,Empresa Sur
```

La aplicacion valida el CSV, omite correos invalidos y elimina duplicados durante la importacion.

## Guardar y reutilizar listas

El modulo `Listas` funciona como una base de datos local de destinatarios. Sirve para importar un CSV una sola vez, ponerle un nombre claro y reutilizarlo despues en cualquier campana.

1. Entra en `Listas`.
2. Pulsa `Importar CSV`.
3. Selecciona un archivo `.csv` con una columna `email`.
4. Escribe un nombre para identificar la lista, por ejemplo `Clientes Madrid - Mayo 2026`.
5. Opcionalmente completa `Clasificacion`, `Zona`, `Ciudad` y `Pais`.
6. Pulsa `Guardar lista`.

La aplicacion valida el archivo, omite correos invalidos y elimina duplicados. Desde `Listas` puedes buscar por nombre, zona, ciudad, pais, clasificacion o correo, ademas de exportar o eliminar listas guardadas.

Tambien puedes guardar una lista desde `Nueva Campaña` despues de subir un CSV. Ese flujo es util cuando estas creando una campana y quieres conservar esa base para proximos envios.

## Enviar una campana

1. Pulsa `Nueva Campaña`.
2. Asigna un nombre a la campana.
3. Selecciona la cuenta SMTP y la plantilla.
4. En `Destinatarios`, selecciona una lista guardada o sube un archivo CSV nuevo.
5. Revisa el resumen final.
6. Ajusta la pausa entre correos y el numero de reintentos por fallo.
7. Revisa la vista previa personalizada.
8. Pulsa `Empezar Envio Ahora`.
9. Espera a que termine el proceso y revisa el historial.

## Resultados y reintentos

Cada campana guarda un registro por destinatario con estado, intento, fecha, asunto, messageId y error si lo hubiera.

En el historial de campanas puedes:

- Exportar resultados a CSV.
- Reintentar solo los destinatarios fallidos.

## Recomendaciones antes de enviar

- Haz una prueba con tu propio correo antes de enviar a una lista grande.
- Verifica que el dominio remitente tenga SPF, DKIM y DMARC configurados.
- Respeta los limites de envio de tu proveedor SMTP.
- Usa listas con consentimiento y evita destinatarios comprados o no verificados.
- Revisa ortografia, enlaces e imagenes de la plantilla.

## Salida del programa

Si hay un envio en curso, la aplicacion avisa antes de cerrar. Cerrar durante un envio detiene el proceso para los contactos pendientes.
