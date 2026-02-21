const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let bridgeProcess = null;
let requestId = 0;
const pendingRequests = new Map();

// ── C# Bridge Management ──────────────────────────────────────────────
function getBridgePath() {
    const devPath = path.join(__dirname, '..', 'native', 'bin', 'AudioBridge.exe');
    const prodPath = path.join(process.resourcesPath, 'native', 'AudioBridge.exe');
    const fs = require('fs');
    return fs.existsSync(devPath) ? devPath : prodPath;
}

function startBridge() {
    const bridgePath = getBridgePath();
    console.log('[Main] Starting C# bridge:', bridgePath);

    try {
        bridgeProcess = spawn(bridgePath, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });

        let buffer = '';
        bridgeProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                    const response = JSON.parse(trimmed);
                    const pending = pendingRequests.get(response.id);
                    if (pending) {
                        pendingRequests.delete(response.id);
                        if (response.error) {
                            pending.reject(new Error(response.error));
                        } else {
                            pending.resolve(response.data);
                        }
                    }
                } catch (e) {
                    console.error('[Main] Failed to parse bridge response:', trimmed);
                }
            }
        });

        bridgeProcess.stderr.on('data', (data) => {
            console.error('[Bridge STDERR]', data.toString());
        });

        bridgeProcess.on('close', (code) => {
            console.log('[Main] Bridge process exited with code:', code);
            bridgeProcess = null;
        });

        bridgeProcess.on('error', (err) => {
            console.error('[Main] Bridge process error:', err);
            bridgeProcess = null;
        });
    } catch (err) {
        console.error('[Main] Failed to start bridge:', err);
    }
}

function sendBridgeCommand(command, params = {}) {
    return new Promise((resolve, reject) => {
        if (!bridgeProcess) {
            // If bridge not running, return mock data for development
            resolve(getMockData(command, params));
            return;
        }

        const id = ++requestId;
        const message = JSON.stringify({ id, command, params }) + '\n';

        pendingRequests.set(id, { resolve, reject });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error('Bridge request timed out'));
            }
        }, 10000);

        bridgeProcess.stdin.write(message);
    });
}

// ── Mock Data for development without C# bridge ──────────────────────
function getMockData(command, params) {
    if (command === 'getDevices') {
        return [
            {
                id: '{0.0.0.00000000}.{mock-speaker-1}',
                name: 'Speakers (Realtek High Definition Audio)',
                type: 'playback',
                status: 'active',
                isDefault: true,
                iconPath: '',
                volume: 0.75,
                peakLevel: 0.0,
            },
            {
                id: '{0.0.0.00000000}.{mock-headphones}',
                name: 'Headphones (USB Audio Device)',
                type: 'playback',
                status: 'active',
                isDefault: false,
                iconPath: '',
                volume: 1.0,
                peakLevel: 0.0,
            },
            {
                id: '{0.0.0.00000000}.{mock-hdmi}',
                name: 'NVIDIA HDMI Output (High Definition Audio)',
                type: 'playback',
                status: 'notplugged',
                isDefault: false,
                iconPath: '',
                volume: 0.5,
                peakLevel: 0.0,
            },
            {
                id: '{0.0.0.00000000}.{mock-disabled-speaker}',
                name: 'Digital Audio (S/PDIF)',
                type: 'playback',
                status: 'disabled',
                isDefault: false,
                iconPath: '',
                volume: 0.0,
                peakLevel: 0.0,
            },
            {
                id: '{0.0.1.00000000}.{mock-mic-1}',
                name: 'Microphone (Realtek High Definition Audio)',
                type: 'recording',
                status: 'active',
                isDefault: true,
                iconPath: '',
                volume: 0.85,
                peakLevel: 0.0,
            },
            {
                id: '{0.0.1.00000000}.{mock-mic-2}',
                name: 'Stereo Mix (Realtek High Definition Audio)',
                type: 'recording',
                status: 'disabled',
                isDefault: false,
                iconPath: '',
                volume: 0.0,
                peakLevel: 0.0,
            },
            {
                id: '{0.0.1.00000000}.{mock-webcam-mic}',
                name: 'Microphone (HD Webcam)',
                type: 'recording',
                status: 'active',
                isDefault: false,
                iconPath: '',
                volume: 0.65,
                peakLevel: 0.0,
            },
        ];
    }

    if (command === 'getPeakLevels') {
        // Return randomized peak levels for mock
        return [
            { id: '{0.0.0.00000000}.{mock-speaker-1}', peakLevel: Math.random() * 0.6 },
            { id: '{0.0.0.00000000}.{mock-headphones}', peakLevel: Math.random() * 0.3 },
            { id: '{0.0.1.00000000}.{mock-mic-1}', peakLevel: Math.random() * 0.5 },
            { id: '{0.0.1.00000000}.{mock-webcam-mic}', peakLevel: Math.random() * 0.2 },
        ];
    }

    if (command === 'setDefaultDevice') {
        return { success: true };
    }

    if (command === 'getDeviceProperties') {
        // Return mock device properties
        const device = getMockData('getDevices').find(d => d.id === params.deviceId);
        const name = device?.name || 'Unknown Device';
        return {
            id: params.deviceId,
            name: name,
            description: name.split('(')[0]?.trim() || name,
            interfaceName: name.match(/\(([^)]+)\)/)?.[1] || 'Default Audio Driver',
            driverName: name.match(/\(([^)]+)\)/)?.[1] || 'Default Driver',
            deviceState: device?.status || 'active',
            channelCount: 2,
            sampleRate: 48000,
            bitDepth: 24,
            volume: device?.volume || 0.75,
            isMuted: false,
            channelVolumes: [device?.volume || 0.75, device?.volume || 0.75],
        };
    }

    if (command === 'setDeviceVolume') {
        return { success: true };
    }

    if (command === 'setDeviceMute') {
        return { success: true };
    }

    if (command === 'setChannelVolume') {
        return { success: true };
    }

    if (command === 'openProperties') {
        return { success: true };
    }

    if (command === 'getAudioSessions') {
        return [
            {
                id: 'session-system-sounds',
                displayName: 'System Sounds',
                processName: 'System',
                iconPath: '',
                volume: 1.0,
                isMuted: false,
                peakLevel: Math.random() * 0.2,
                isSystemSounds: true,
            },
            {
                id: 'session-chrome',
                displayName: 'Google Chrome',
                processName: 'chrome',
                iconPath: '',
                volume: 0.8,
                isMuted: false,
                peakLevel: Math.random() * 0.5,
                isSystemSounds: false,
            },
            {
                id: 'session-discord',
                displayName: 'Discord',
                processName: 'Discord',
                iconPath: '',
                volume: 0.65,
                isMuted: false,
                peakLevel: Math.random() * 0.4,
                isSystemSounds: false,
            },
            {
                id: 'session-spotify',
                displayName: 'Spotify',
                processName: 'Spotify',
                iconPath: '',
                volume: 0.9,
                isMuted: false,
                peakLevel: Math.random() * 0.7,
                isSystemSounds: false,
            },
        ];
    }

    if (command === 'setSessionVolume') {
        return { success: true };
    }

    if (command === 'setSessionMute') {
        return { success: true };
    }

    return {};
}

// ── IPC Handlers ─────────────────────────────────────────────────────
function setupIPC() {
    ipcMain.handle('get-devices', async () => {
        return await sendBridgeCommand('getDevices');
    });

    ipcMain.handle('set-default-device', async (_event, deviceId) => {
        return await sendBridgeCommand('setDefaultDevice', { deviceId });
    });

    ipcMain.handle('get-peak-levels', async () => {
        return await sendBridgeCommand('getPeakLevels');
    });

    ipcMain.handle('open-device-properties', async (_event, deviceId) => {
        return await sendBridgeCommand('getDeviceProperties', { deviceId });
    });

    ipcMain.handle('get-device-properties', async (_event, deviceId) => {
        return await sendBridgeCommand('getDeviceProperties', { deviceId });
    });

    ipcMain.handle('set-device-volume', async (_event, deviceId, volume) => {
        return await sendBridgeCommand('setDeviceVolume', { deviceId, volume });
    });

    ipcMain.handle('set-device-mute', async (_event, deviceId, muted) => {
        return await sendBridgeCommand('setDeviceMute', { deviceId, muted });
    });

    ipcMain.handle('set-channel-volume', async (_event, deviceId, channel, volume) => {
        return await sendBridgeCommand('setChannelVolume', { deviceId, channel, volume });
    });

    ipcMain.handle('get-audio-sessions', async () => {
        try {
            return await sendBridgeCommand('getAudioSessions');
        } catch {
            return getMockData('getAudioSessions');
        }
    });

    ipcMain.handle('set-session-volume', async (_event, sessionId, volume) => {
        try {
            return await sendBridgeCommand('setSessionVolume', { sessionId, volume });
        } catch {
            return { success: true };
        }
    });

    ipcMain.handle('set-session-mute', async (_event, sessionId, muted) => {
        try {
            return await sendBridgeCommand('setSessionMute', { sessionId, muted });
        } catch {
            return { success: true };
        }
    });
}

// ── Window Control IPC ───────────────────────────────────────────────
function setupWindowControls() {
    ipcMain.on('window-minimize', () => {
        if (mainWindow) mainWindow.minimize();
    });
    ipcMain.on('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });
    ipcMain.on('window-close', () => {
        if (mainWindow) mainWindow.close();
    });
    ipcMain.handle('window-is-maximized', () => {
        return mainWindow ? mainWindow.isMaximized() : false;
    });
}

// ── Window Creation ──────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 820,
        height: 680,
        minWidth: 640,
        minHeight: 500,
        backgroundColor: '#000000',
        title: 'Sound Control Panel',
        frame: false,
        titleBarStyle: 'hidden',
        icon: path.join(__dirname, '..', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Load built files if they exist, otherwise try Vite dev server
    const fs = require('fs');
    const builtIndex = path.join(__dirname, '..', 'dist-renderer', 'index.html');

    if (fs.existsSync(builtIndex)) {
        mainWindow.loadFile(builtIndex);
    } else {
        mainWindow.loadURL('http://localhost:5173');
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ── App Lifecycle ────────────────────────────────────────────────────
app.whenReady().then(() => {
    startBridge();
    setupIPC();
    setupWindowControls();
    createWindow();
});

app.on('window-all-closed', () => {
    if (bridgeProcess) {
        bridgeProcess.kill();
    }
    app.quit();
});

app.on('before-quit', () => {
    if (bridgeProcess) {
        bridgeProcess.kill();
    }
});
