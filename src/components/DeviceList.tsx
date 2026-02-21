import type { AudioDevice } from '../types';
import { DeviceItem } from './DeviceItem';

interface DeviceListProps {
    devices: AudioDevice[];
    selectedDeviceId: string | null;
    onSelectDevice: (id: string) => void;
    onSetDefault: (id: string) => void;
    onOpenProperties: (id: string) => void;
    onOpenConfigure: (id: string) => void;
}

export function DeviceList({
    devices,
    selectedDeviceId,
    onSelectDevice,
    onSetDefault,
    onOpenProperties,
    onOpenConfigure,
}: DeviceListProps) {
    if (devices.length === 0) {
        return (
            <div className="device-list">
                <div className="device-list-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    <p>No devices found</p>
                </div>
            </div>
        );
    }

    // Sort: default first, then active, then disabled, then not plugged
    const sorted = [...devices].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        const statusOrder = { active: 0, disabled: 1, notplugged: 2, unplugged: 3 };
        return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    });

    return (
        <div className="device-list">
            {sorted.map(device => (
                <DeviceItem
                    key={device.id}
                    device={device}
                    isSelected={device.id === selectedDeviceId}
                    onSelect={() => onSelectDevice(device.id)}
                    onSetDefault={() => onSetDefault(device.id)}
                    onOpenProperties={() => onOpenProperties(device.id)}
                    onOpenConfigure={() => onOpenConfigure(device.id)}
                />
            ))}
        </div>
    );
}
