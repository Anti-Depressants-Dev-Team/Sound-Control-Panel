export type DeviceType = 'playback' | 'recording' | 'mixer';
export type DeviceStatus = 'active' | 'disabled' | 'notplugged' | 'unplugged';

export interface AudioDevice {
    id: string;
    name: string;
    type: 'playback' | 'recording';
    status: DeviceStatus;
    isDefault: boolean;
    iconPath: string;
    volume: number;
    peakLevel: number;
}

export interface PeakLevel {
    id: string;
    peakLevel: number;
}

export interface DeviceProperties {
    id: string;
    name: string;
    description: string;
    interfaceName: string;
    driverName: string;
    deviceState: string;
    channelCount: number;
    sampleRate: number;
    bitDepth: number;
    volume: number;
    isMuted: boolean;
    channelVolumes: number[];
}

export interface DeviceConfig {
    volume: number;
    isMuted: boolean;
    channelVolumes: number[];
    sampleRate: number;
    bitDepth: number;
}

export interface AudioSession {
    id: string;
    displayName: string;
    processName: string;
    iconPath: string;
    volume: number;
    isMuted: boolean;
    peakLevel: number;
    isSystemSounds: boolean;
}

export interface AudioAPI {
    getDevices: () => Promise<AudioDevice[]>;
    setDefaultDevice: (deviceId: string) => Promise<{ success: boolean }>;
    getPeakLevels: () => Promise<PeakLevel[]>;
    openDeviceProperties: (deviceId: string) => Promise<{ success: boolean }>;
    getDeviceProperties: (deviceId: string) => Promise<DeviceProperties>;
    setDeviceVolume: (deviceId: string, volume: number) => Promise<{ success: boolean }>;
    setDeviceMute: (deviceId: string, muted: boolean) => Promise<{ success: boolean }>;
    setChannelVolume: (deviceId: string, channel: number, volume: number) => Promise<{ success: boolean }>;
    getAudioSessions: () => Promise<AudioSession[]>;
    setSessionVolume: (sessionId: string, volume: number) => Promise<{ success: boolean }>;
    setSessionMute: (sessionId: string, muted: boolean) => Promise<{ success: boolean }>;
}

declare global {
    interface Window {
        audioAPI: AudioAPI;
    }
}
