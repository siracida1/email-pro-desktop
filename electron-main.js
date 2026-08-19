const { app, BrowserWindow, shell, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const Store = require('electron-store');
const nodemailer = require('nodemailer');
const isDev = process.env.ELECTRON_IS_DEV === '1';

const store = new Store();

let mainWindow;
let isQuitting = false;

function createSmtpTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: "MassMail Pro Desktop",
    icon: path.join(__dirname, 'icon.png'), // Opcional: añadir un icono
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    autoHideMenuBar: true, // Oculta la barra de menús clásica
    titleBarStyle: 'default'
  });

  mainWindow.maximize();
  mainWindow.show();

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Abrir enlaces externos en el navegador predeterminado del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Intercept close event
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.webContents.send('app:close-request');
    }
  });
}

app.whenReady().then(() => {
  // Register custom protocol for local files
  protocol.registerFileProtocol('app-file', (request, callback) => {
    const filePath = url.fileURLToPath(request.url.replace('app-file://', 'file://'));
    callback({ path: filePath });
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for Database / Persistence
ipcMain.handle('db:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('db:save', (event, key, value) => {
  store.set(key, value);
  return true;
});

// IPC Handlers for App Control
ipcMain.on('app:quit-confirmed', () => {
  isQuitting = true;
  app.quit();
});

ipcMain.handle('email:test-smtp', async (event, config, testRecipient) => {
  try {
    const transporter = createSmtpTransporter(config);
    await transporter.verify();

    if (testRecipient) {
      const info = await transporter.sendMail({
        from: `"${config.name}" <${config.email}>`,
        to: testRecipient,
        subject: 'Prueba SMTP - MassMail Pro',
        html: '<p>La configuracion SMTP funciona correctamente.</p>'
      });

      return { success: true, messageId: info.messageId };
    }

    return { success: true };
  } catch (error) {
    console.error('SMTP Test Error:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler for Sending Email
ipcMain.handle('email:send', async (event, config, to, subject, html) => {
  try {
    const transporter = createSmtpTransporter(config);

    // Handle local images: attachment as CID
    const attachments = [];
    let processedHtml = html;

    // Regex to find <img> tags with local src (starting with C:\ or similar, or just file path pattern)
    // For simplicity, we search for src references that look like local paths
    const imgSrcRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    const cidMap = new Map();

    while ((match = imgSrcRegex.exec(html)) !== null) {
      const originalSrc = match[1];

      // Check if it's a local file path (not a URL and not base64)
      if (!originalSrc.startsWith('http') && !originalSrc.startsWith('data:') && !originalSrc.startsWith('app-file:')) {
        let absolutePath = originalSrc;

        // Try to handle paths that might be relative or just local
        if (!path.isAbsolute(absolutePath)) {
          // You might need a base directory logic here if templates use relative paths
          // For now, assume global or relative to current working dir if not absolute
          try {
            absolutePath = path.resolve(absolutePath);
          } catch (e) {
            continue;
          }
        }

        if (fs.existsSync(absolutePath)) {
          const fileName = path.basename(absolutePath);
          const cid = `img_${Math.random().toString(36).substring(2, 9)}`;

          attachments.push({
            filename: fileName,
            path: absolutePath,
            cid: cid
          });

          // Replace the src in the HTML with cid:reference
          processedHtml = processedHtml.replace(originalSrc, `cid:${cid}`);
        }
      }
    }

    const info = await transporter.sendMail({
      from: `"${config.name}" <${config.email}>`,
      to: to,
      subject: subject,
      html: processedHtml,
      attachments: attachments
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP Error:', error);
    return { success: false, error: error.message };
  }
});
