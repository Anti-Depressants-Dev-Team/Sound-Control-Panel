import { useState } from 'react';
import { useAudioDevices } from './hooks/useAudioDevices';
import { TabBar } from './components/TabBar';
import { DeviceList } from './components/DeviceList';
import { PropertiesModal } from './components/PropertiesModal';
import { ConfigureModal } from './components/ConfigureModal';
import { TitleBar } from './components/TitleBar';
import { VolumeMixer } from './components/VolumeMixer';
import type { AudioDevice, DeviceType } from './types';

export default function App() {
    const [activeTab, setActiveTab] = useState<DeviceType>('playback');
    const {
        devices,
        loading,
        selectedDeviceId,
        setSelectedDeviceId,
        fetchDevices,
        setDefaultDevice,
        getDevicesByType,
    } = useAudioDevices();

    const [refreshing, setRefreshing] = useState(false);
    const [propertiesDevice, setPropertiesDevice] = useState<AudioDevice | null>(null);
    const [configureDevice, setConfigureDevice] = useState<AudioDevice | null>(null);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDevices();
        setTimeout(() => setRefreshing(false), 600);
    };

    const handleOpenProperties = (deviceId: string) => {
        const device = devices.find(d => d.id === deviceId);
        if (device) setPropertiesDevice(device);
    };

    const handleOpenConfigure = (deviceId: string) => {
        const device = devices.find(d => d.id === deviceId);
        if (device) setConfigureDevice(device);
    };

    const filteredDevices = activeTab !== 'mixer'
        ? getDevicesByType(activeTab as 'playback' | 'recording')
        : [];
    const playbackCount = getDevicesByType('playback').length;
    const recordingCount = getDevicesByType('recording').length;

    const selectedDevice = devices.find(d => d.id === selectedDeviceId);

    if (loading && devices.length === 0) {
        return (
            <div className="app">
                <TitleBar />
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p className="loading-text">Detecting audio devices…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <TitleBar />

            {/* Tabs */}
            <TabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                playbackCount={playbackCount}
                recordingCount={recordingCount}
            />

            {/* Content area */}
            {activeTab === 'mixer' ? (
                <div className="device-list-container">
                    <VolumeMixer />
                </div>
            ) : (
                <>
                    {/* Device List */}
                    <div className="device-list-container">
                        <DeviceList
                            devices={filteredDevices}
                            selectedDeviceId={selectedDeviceId}
                            onSelectDevice={setSelectedDeviceId}
                            onSetDefault={setDefaultDevice}
                            onOpenProperties={handleOpenProperties}
                            onOpenConfigure={handleOpenConfigure}
                        />
                    </div>

                    {/* Bottom Bar */}
                    <div className="bottom-bar">
                        <span className="device-count">
                            {filteredDevices.length} {activeTab} device{filteredDevices.length !== 1 ? 's' : ''}
                        </span>
                        <div className="bottom-actions">
                            <button
                                className="bottom-btn"
                                disabled={!selectedDevice}
                                onClick={() => selectedDevice && handleOpenConfigure(selectedDevice.id)}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                                    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                                    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                                    <line x1="17" y1="16" x2="23" y2="16" />
                                </svg>
                                Configure
                            </button>
                            <button
                                className="bottom-btn"
                                disabled={!selectedDevice}
                                onClick={() => selectedDevice && handleOpenProperties(selectedDevice.id)}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                                Properties
                            </button>
                            <button
                                className="bottom-btn primary"
                                disabled={!selectedDevice || selectedDevice.isDefault || selectedDevice.status !== 'active'}
                                onClick={() => selectedDevice && setDefaultDevice(selectedDevice.id)}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Set Default
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            {propertiesDevice && (
                <PropertiesModal
                    device={propertiesDevice}
                    onClose={() => setPropertiesDevice(null)}
                />
            )}
            {configureDevice && (
                <ConfigureModal
                    device={configureDevice}
                    onClose={() => setConfigureDevice(null)}
                />
            )}
        </div>
    );
}
