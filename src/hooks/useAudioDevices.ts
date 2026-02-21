import { useState, useEffect, useCallback, useRef } from 'react';
import type { AudioDevice, PeakLevel, DeviceType } from '../types';

export function useAudioDevices() {
    const [devices, setDevices] = useState<AudioDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const peakIntervalRef = useRef<number | null>(null);

    // Fetch all devices from the bridge
    const fetchDevices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await window.audioAPI.getDevices();
            setDevices(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch devices');
            console.error('Failed to fetch devices:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Set a device as default
    const setDefaultDevice = useCallback(async (deviceId: string) => {
        try {
            await window.audioAPI.setDefaultDevice(deviceId);
            // Update local state optimistically
            setDevices(prev => prev.map(d => ({
                ...d,
                isDefault: d.id === deviceId
                    ? true
                    : d.type === prev.find(dd => dd.id === deviceId)?.type
                        ? false
                        : d.isDefault,
            })));
        } catch (err) {
            console.error('Failed to set default device:', err);
            // Refetch to get actual state
            fetchDevices();
        }
    }, [fetchDevices]);

    // Open device properties
    const openProperties = useCallback(async (deviceId: string) => {
        try {
            await window.audioAPI.openDeviceProperties(deviceId);
        } catch (err) {
            console.error('Failed to open properties:', err);
        }
    }, []);

    // Poll peak levels for active devices
    useEffect(() => {
        const pollPeaks = async () => {
            try {
                const levels = await window.audioAPI.getPeakLevels();
                setDevices(prev => {
                    const levelMap = new Map(levels.map((l: PeakLevel) => [l.id, l.peakLevel]));
                    return prev.map(d => ({
                        ...d,
                        peakLevel: levelMap.get(d.id) ?? d.peakLevel,
                    }));
                });
            } catch {
                // Silently fail peak polling
            }
        };

        peakIntervalRef.current = window.setInterval(pollPeaks, 100);
        return () => {
            if (peakIntervalRef.current) {
                clearInterval(peakIntervalRef.current);
            }
        };
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // Filter helpers
    const getDevicesByType = useCallback((type: DeviceType) => {
        return devices.filter(d => d.type === type);
    }, [devices]);

    return {
        devices,
        loading,
        error,
        selectedDeviceId,
        setSelectedDeviceId,
        fetchDevices,
        setDefaultDevice,
        openProperties,
        getDevicesByType,
    };
}
