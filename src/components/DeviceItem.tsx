import type { AudioDevice } from '../types';
import { VolumeMeter } from './VolumeMeter';

interface DeviceItemProps {
    device: AudioDevice;
    isSelected: boolean;
    onSelect: () => void;
    onSetDefault: () => void;
    onOpenProperties: () => void;
    onOpenConfigure: () => void;
}

function getDeviceIcon(device: AudioDevice): string {
    if (device.type === 'recording') {
        return device.status === 'notplugged' || device.status === 'unplugged' ? '🎙️' : '🎤';
    }
    const name = device.name.toLowerCase();
    if (name.includes('headphone') || name.includes('headset')) return '🎧';
    if (name.includes('hdmi') || name.includes('display')) return '🖥️';
    if (name.includes('bluetooth') || name.includes('bt')) return '📡';
    if (name.includes('usb')) return '🔌';
    if (name.includes('digital') || name.includes('spdif') || name.includes('optical')) return '💿';
    return '🔈';
}

function getStatusLabel(device: AudioDevice): string {
    if (device.isDefault) return 'Default Device';
    switch (device.status) {
        case 'active': return 'Ready';
        case 'disabled': return 'Disabled';
        case 'notplugged':
        case 'unplugged': return 'Not plugged in';
        default: return device.status;
    }
}

function getStatusClass(device: AudioDevice): string {
    if (device.isDefault) return 'status-default';
    return `status-${device.status}`;
}

export function DeviceItem({
    device,
    isSelected,
    onSelect,
    onSetDefault,
    onOpenProperties,
    onOpenConfigure,
}: DeviceItemProps) {
    const icon = getDeviceIcon(device);
    const statusLabel = getStatusLabel(device);
    const statusClass = getStatusClass(device);
    const isActive = device.status === 'active';

    return (
        <div
            className={`device-item ${isSelected ? 'selected' : ''} ${device.isDefault ? 'default' : ''} status-${device.status}`}
            onClick={onSelect}
        >
            {/* Device Icon */}
            <div className="device-icon">{icon}</div>

            {/* Device Info */}
            <div className="device-info">
                <span className="device-name">{device.name}</span>
                <div className="device-meta">
                    <span className={`device-status ${statusClass}`}>
                        <span className="status-dot" />
                        {statusLabel}
                    </span>
                </div>
            </div>

            {/* Volume Meter (only for active devices) */}
            {isActive && (
                <VolumeMeter level={device.peakLevel} volume={device.volume} />
            )}

            {/* Action Buttons */}
            <div className="device-actions">
                {isActive && !device.isDefault && (
                    <button
                        className="action-btn set-default"
                        data-tooltip="Set Default"
                        onClick={(e) => { e.stopPropagation(); onSetDefault(); }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </button>
                )}
                <button
                    className="action-btn"
                    data-tooltip="Configure"
                    onClick={(e) => { e.stopPropagation(); onOpenConfigure(); }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                </button>
                <button
                    className="action-btn"
                    data-tooltip="Properties"
                    onClick={(e) => { e.stopPropagation(); onOpenProperties(); }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
