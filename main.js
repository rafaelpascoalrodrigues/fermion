const { app, BrowserWindow } = require('electron');

function createWindow () {
    const win = new BrowserWindow({
        width: 1600,
        height: 700,
        webPreferences: {
            nodeIntegration: true
        }
    });


    win.loadFile('app/mainwindow.html');

    win.webContents.openDevTools();
}

app.allowRendererProcessReuse = true;

app.whenReady().then(createWindow);


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
