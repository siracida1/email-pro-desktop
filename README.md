# MassMail Pro Desktop

MassMail Pro Desktop es una aplicación de escritorio profesional para la preparación y el envío masivo de campañas de correo electrónico a través de servidores SMTP configurados por el usuario.

## 📋 Prerrequisitos de Sistema

- **Windows 10 / 11 (64-bit)**
- **Node.js**: Versión v18.0.0 o superior (Descargar desde [Node.js Official Website](https://nodejs.org/)).
- **Cuenta SMTP activa**: (Gmail con contraseña de aplicación, Outlook, Office 365, cPanel, Mailgun, SendGrid, etc.).

## 🚀 Inicio Rápido (Ejecutable 1-Click)

Puedes iniciar la aplicación directamente haciendo doble clic en el archivo `iniciar_aplicacion.bat`. Este script verificará automáticamente la instalación de Node.js e instalará las dependencias necesarias en su primer inicio.

## 🛠️ Funciones Principales

- **Gestión Multi-cuenta SMTP**: Configuración y verificación en tiempo real de servidores SMTP.
- **Editor de Plantillas HTML**: Modos de vista Código, Vista Previa y Dividida con resaltado de sintaxis.
- **Marcadores Dinámicos**: Personalización con variables como `{{name}}`, `{{email}}`, `{{company}}`, etc.
- **Gestión de Listas de Destinatarios**: Importación CSV con limpieza de duplicados y filtrado de e-mails inválidos.
- **Asistente de Campaña en 4 Pasos**: Configuración paso a paso (Conceptos -> Destinatarios -> Revisión -> Lanzamiento).
- **Control de Velocidad y Reintentos**: Configuración de pausas entre envíos (0s a 10s) y reintentos en caso de fallo.
- **Incrustación Automática de Imágenes**: Las imágenes locales insertadas en el HTML se adjuntan automáticamente como recursos CID.
- **Soporte Multi-idioma**: Interfaz adaptable en Español, Inglés y Francés.
- **Exportación de Informes**: Historial de envíos con exportación detallada a CSV.

## 💻 Instalación y Desarrollo

### Instalación de dependencias:

```bash
npm install
```

### Ejecutar en modo desarrollo:

```bash
npm start
```

### Compilar la interfaz web (Vite):

```bash
npm run build:web
```

### Generar instaladores de producción (.exe portable y Setup):

```bash
npm run build
```

Los ejecutables generados se guardarán en la carpeta `release/`.

## 📄 Formato CSV

El archivo CSV de destinatarios debe incluir obligatoriamente una columna llamada `email`. Las columnas adicionales se mapearán automáticamente como marcadores dentro de las plantillas HTML.

```csv
email,name,company
juan@ejemplo.com,Juan Perez,Empresa ABC
maria@ejemplo.com,Maria Garcia,Software S.A.
```

## 🔒 Privacidad y Seguridad

Todos los datos (cuentas SMTP, plantillas, listas e historial) se almacenan localmente en el equipo mediante `electron-store`. Las credenciales SMTP nunca se transmiten a ningún servidor externo.

## 👤 Autor y apoyo

Desarrollado por [Christian Freelance](https://christian-freelance.us/).

Si el proyecto te resulta útil, puedes [invitarme a un café mediante PayPal](https://www.paypal.com/donate/?hosted_button_id=YC6YAWBQ7HNSS).
