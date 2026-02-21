import { useState, useEffect } from 'react';
import type { AudioDevice, DeviceProperties } from '../types';

interface PropertiesModalProps {
    device: AudioDevice;
    onClose: () => void;
}

function getDeviceIcon(device: AudioDevice): string {
    if (device.type === 'recording') return '🎤';
    const name = device.name.toLowerCase();
    if (name.includes('headphone') || name.includes('headset')) return '🎧';
    if (name.includes('hdmi') || name.includes('display')) return '🖥️';
    if (name.includes('bluetooth')) return '📡';
    if (name.includes('usb')) return '🔌';
    return '🔈';
}

export function PropertiesModal({ device, onClose }: PropertiesModalProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'levels' | 'advanced'>('general');
    const [properties, setProperties] = useState<DeviceProperties | null>(null);
    const [loading, setLoading] = useState(true);
    const [volume, setVolume] = useState(device.volume * 100);
    const [isMuted, setIsMuted] = useState(false);
    const [channelVolumes, setChannelVolumes] = useState<number[]>([]);

    useEffect(() => {
        loadProperties();
    }, [device.id]);

    const loadProperties = async () => {
        setLoading(true);
        try {
            const props = await window.audioAPI.getDeviceProperties(device.id);
            setProperties(props);
            setVolume(props.volume * 100);
            setIsMuted(props.isMuted);
            setChannelVolumes(props.channelVolumes.map(v => v * 100));
        } catch (err) {
            // Use fallback data from device
            setProperties({
                id: device.id,
                name: device.name,
                description: device.name.split('(')[0]?.trim() || device.name,
                interfaceName: device.name.match(/\(([^)]+)\)/)?.[1] || 'Unknown',
                driverName: device.name.match(/\(([^)]+)\)/)?.[1] || 'Default Driver',
                deviceState: device.status,
                channelCount: 2,
                sampleRate: 48000,
                bitDepth: 24,
                volume: device.volume,
                isMuted: false,
                channelVolumes: [device.volume, device.volume],
            });
            setChannelVolumes([device.volume * 100, device.volume * 100]);
        } finally {
            setLoading(false);
        }
    };

    const handleVolumeChange = async (newVolume: number) => {
        setVolume(newVolume);
        try {
            await window.audioAPI.setDeviceVolume(device.id, newVolume / 100);
        } catch { }
    };

    const handleMuteToggle = async () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        try {
            await window.audioAPI.setDeviceMute(device.id, newMuted);
        } catch { }
    };

    const handleChannelVolumeChange = async (channel: number, value: number) => {
        const newChannels = [...channelVolumes];
        newChannels[channel] = value;
        setChannelVolumes(newChannels);
        try {
            await window.audioAPI.setChannelVolume(device.id, channel, value / 100);
        } catch { }
    };

    const tabs = [
        { id: 'general' as const, label: 'General' },
        { id: 'levels' as const, label: 'Levels' },
        { id: 'advanced' as const, label: 'Advanced' },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container properties-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-row">
                        <span className="modal-icon">{getDeviceIcon(device)}</span>
                        <div>
                            <h2 className="modal-title">{properties?.description || device.name.split('(')[0]?.trim()}</h2>
                            <p className="modal-subtitle">{properties?.interfaceName || 'Audio Device'} Properties</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="modal-body">
                    {loading ? (
                        <div className="modal-loading">
                            <div className="loading-spinner" />
                            <p>Loading properties…</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'general' && properties && (
                                <div className="props-general">
                                    <div className="props-device-header">
                                        <div className="props-big-icon">{getDeviceIcon(device)}</div>
                                        <div>
                                            <h3>{properties.description}</h3>
                                            <p className="text-muted">{properties.interfaceName}</p>
                                        </div>
                                    </div>

                                    <div className="props-info-grid">
                                        <div className="props-info-row">
                                            <span className="props-label">Device Type</span>
                                            <span className="props-value">{device.type === 'playback' ? 'Audio Output (Playback)' : 'Audio Input (Recording)'}</span>
                                        </div>
                                        <div className="props-info-row">
                                            <span className="props-label">Status</span>
                                            <span className={`props-value props-status-${device.status}`}>
                                                <span className="status-dot" />
                                                {device.status === 'active' ? 'Active & Ready' : device.status === 'disabled' ? 'Disabled' : 'Not Plugged In'}
                                            </span>
                                        </div>
                                        <div className="props-info-row">
                                            <span className="props-label">Default Device</span>
                                            <span className="props-value">{device.isDefault ? '✓ Yes' : 'No'}</span>
                                        </div>
                                        <div className="props-info-row">
                                            <span className="props-label">Controller</span>
                                            <span className="props-value">{properties.driverName}</span>
                                        </div>
                                        <div className="props-info-row">
                                            <span className="props-label">Channels</span>
                                            <span className="props-value">{properties.channelCount} ({properties.channelCount === 2 ? 'Stereo' : properties.channelCount === 1 ? 'Mono' : `${properties.channelCount}-channel`})</span>
                                        </div>
                                        <div className="props-info-row">
                                            <span className="props-label">Current Format</span>
                                            <span className="props-value">{properties.bitDepth}-bit, {(properties.sampleRate / 1000).toFixed(1)} kHz</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'levels' && (
                                <div className="props-levels">
                                    {/* Master Volume */}
                                    <div className="level-section">
                                        <div className="level-header">
                                            <span className="level-label">{device.type === 'playback' ? '🔊' : '🎤'} Master Volume</span>
                                            <span className="level-value">{Math.round(volume)}%</span>
                                        </div>
                                        <div className="level-slider-row">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={volume}
                                                onChange={e => handleVolumeChange(Number(e.target.value))}
                                                className="level-slider"
                                            />
                                            <button
                                                className={`mute-btn ${isMuted ? 'muted' : ''}`}
                                                onClick={handleMuteToggle}
                                                title={isMuted ? 'Unmute' : 'Mute'}
                                            >
                                                {isMuted ? (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                        <line x1="23" y1="9" x2="17" y2="15" />
                                                        <line x1="17" y1="9" x2="23" y2="15" />
                                                    </svg>
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Channel Balance */}
                                    <div className="level-section">
                                        <div className="level-header">
                                            <span className="level-label">⚖️ Channel Balance</span>
                                        </div>
                                        {channelVolumes.map((vol, i) => (
                                            <div key={i} className="channel-row">
                                                <span className="channel-label">{i === 0 ? 'Left' : i === 1 ? 'Right' : `Ch ${i + 1}`}</span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={vol}
                                                    onChange={e => handleChannelVolumeChange(i, Number(e.target.value))}
                                                    className="level-slider channel-slider"
                                                />
                                                <span className="channel-value">{Math.round(vol)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'advanced' && properties && (
                                <div className="props-advanced">
                                    <div className="level-section">
                                        <div className="level-header">
                                            <span className="level-label">🎵 Default Format</span>
                                        </div>
                                        <p className="text-muted" style={{ marginBottom: 12, fontSize: 12 }}>
                                            Select the sample rate and bit depth to use when running in shared mode.
                                        </p>

                                        <div className="format-selector">
                                            <label className="format-label">Sample Rate</label>
                                            <div className="format-options">
                                                {[44100, 48000, 96000, 192000].map(rate => (
                                                    <button
                                                        key={rate}
                                                        className={`format-option ${properties.sampleRate === rate ? 'active' : ''}`}
                                                        onClick={() => setProperties({ ...properties, sampleRate: rate })}
                                                    >
                                                        {(rate / 1000).toFixed(1)} kHz
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="format-selector">
                                            <label className="format-label">Bit Depth</label>
                                            <div className="format-options">
                                                {[16, 24, 32].map(bits => (
                                                    <button
                                                        key={bits}
                                                        className={`format-option ${properties.bitDepth === bits ? 'active' : ''}`}
                                                        onClick={() => setProperties({ ...properties, bitDepth: bits })}
                                                    >
                                                        {bits}-bit
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="level-section">
                                        <div className="level-header">
                                            <span className="level-label">📊 Signal Format Summary</span>
                                        </div>
                                        <div className="format-summary">
                                            <div className="format-summary-item">
                                                <span className="format-summary-label">Channels</span>
                                                <span className="format-summary-value">{properties.channelCount} ({properties.channelCount === 2 ? 'Stereo' : properties.channelCount === 1 ? 'Mono' : `${properties.channelCount}ch`})</span>
                                            </div>
                                            <div className="format-summary-item">
                                                <span className="format-summary-label">Sample Rate</span>
                                                <span className="format-summary-value">{(properties.sampleRate / 1000).toFixed(1)} kHz</span>
                                            </div>
                                            <div className="format-summary-item">
                                                <span className="format-summary-label">Bit Depth</span>
                                                <span className="format-summary-value">{properties.bitDepth}-bit</span>
                                            </div>
                                            <div className="format-summary-item">
                                                <span className="format-summary-label">Data Rate</span>
                                                <span className="format-summary-value">{((properties.sampleRate * properties.bitDepth * properties.channelCount) / 1000).toFixed(0)} kbps</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="bottom-btn" onClick={onClose}>Close</button>
                    <button className="bottom-btn primary" onClick={onClose}>Apply</button>
                </div>
            </div>
        </div>
    );
}
