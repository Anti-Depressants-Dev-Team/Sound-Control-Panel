import { useState } from 'react';
import type { AudioDevice } from '../types';

interface ConfigureModalProps {
    device: AudioDevice;
    onClose: () => void;
}

type SpeakerConfig = 'stereo' | 'quadraphonic' | '5.1' | '7.1';

interface SpeakerSetup {
    id: SpeakerConfig;
    label: string;
    channels: string[];
    description: string;
}

const SPEAKER_CONFIGS: SpeakerSetup[] = [
    { id: 'stereo', label: 'Stereo', channels: ['FL', 'FR'], description: '2 channels — Left and Right' },
    { id: 'quadraphonic', label: 'Quadraphonic', channels: ['FL', 'FR', 'RL', 'RR'], description: '4 channels — Front and Rear' },
    { id: '5.1', label: '5.1 Surround', channels: ['FL', 'FR', 'C', 'LFE', 'RL', 'RR'], description: '6 channels — Surround with Subwoofer' },
    { id: '7.1', label: '7.1 Surround', channels: ['FL', 'FR', 'C', 'LFE', 'SL', 'SR', 'RL', 'RR'], description: '8 channels — Full Surround' },
];

const CHANNEL_LABELS: Record<string, string> = {
    FL: 'Front Left', FR: 'Front Right', C: 'Center', LFE: 'Subwoofer',
    SL: 'Side Left', SR: 'Side Right', RL: 'Rear Left', RR: 'Rear Right',
};

function getDeviceIcon(device: AudioDevice): string {
    if (device.type === 'recording') return '🎤';
    const name = device.name.toLowerCase();
    if (name.includes('headphone') || name.includes('headset')) return '🎧';
    if (name.includes('hdmi') || name.includes('display')) return '🖥️';
    return '🔈';
}

export function ConfigureModal({ device, onClose }: ConfigureModalProps) {
    const [selectedConfig, setSelectedConfig] = useState<SpeakerConfig>('stereo');
    const [testingChannel, setTestingChannel] = useState<string | null>(null);
    const isRecording = device.type === 'recording';

    const currentSetup = SPEAKER_CONFIGS.find(c => c.id === selectedConfig)!;

    const handleTestChannel = (channel: string) => {
        setTestingChannel(channel);
        // Simulate test tone
        setTimeout(() => setTestingChannel(null), 1500);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container configure-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-row">
                        <span className="modal-icon">{getDeviceIcon(device)}</span>
                        <div>
                            <h2 className="modal-title">Configure {isRecording ? 'Input' : 'Speaker Setup'}</h2>
                            <p className="modal-subtitle">{device.name}</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {isRecording ? (
                        /* Recording device configuration */
                        <div className="config-recording">
                            <div className="level-section">
                                <div className="level-header">
                                    <span className="level-label">🎤 Input Configuration</span>
                                </div>
                                <div className="config-info-card">
                                    <div className="config-info-icon">🎤</div>
                                    <div>
                                        <h4>Microphone Input</h4>
                                        <p className="text-muted">This recording device captures audio in mono or stereo depending on hardware capabilities.</p>
                                    </div>
                                </div>
                                <div className="props-info-grid" style={{ marginTop: 16 }}>
                                    <div className="props-info-row">
                                        <span className="props-label">Input Type</span>
                                        <span className="props-value">Audio Capture</span>
                                    </div>
                                    <div className="props-info-row">
                                        <span className="props-label">Channels</span>
                                        <span className="props-value">Mono / Stereo (Auto)</span>
                                    </div>
                                    <div className="props-info-row">
                                        <span className="props-label">Status</span>
                                        <span className={`props-value props-status-${device.status}`}>
                                            <span className="status-dot" />
                                            {device.status === 'active' ? 'Ready' : device.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Playback device configuration */
                        <>
                            {/* Speaker Configuration Selector */}
                            <div className="level-section">
                                <div className="level-header">
                                    <span className="level-label">🔊 Audio Channel Configuration</span>
                                </div>
                                <p className="text-muted" style={{ marginBottom: 16, fontSize: 12 }}>
                                    Select the speaker setup that matches your hardware configuration.
                                </p>
                                <div className="config-grid">
                                    {SPEAKER_CONFIGS.map(config => (
                                        <button
                                            key={config.id}
                                            className={`config-card ${selectedConfig === config.id ? 'active' : ''}`}
                                            onClick={() => setSelectedConfig(config.id)}
                                        >
                                            <div className="config-card-header">
                                                <span className="config-card-title">{config.label}</span>
                                                {selectedConfig === config.id && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="config-card-desc">{config.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Speaker Layout Visualization */}
                            <div className="level-section">
                                <div className="level-header">
                                    <span className="level-label">🎯 Speaker Layout — {currentSetup.label}</span>
                                </div>
                                <div className="speaker-layout">
                                    <div className="speaker-room">
                                        {/* Listener */}
                                        <div className="listener">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="8" r="4" />
                                                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                                            </svg>
                                        </div>

                                        {/* Speaker positions */}
                                        {currentSetup.channels.map(ch => (
                                            <button
                                                key={ch}
                                                className={`speaker-node speaker-${ch.toLowerCase()} ${testingChannel === ch ? 'testing' : ''}`}
                                                onClick={() => handleTestChannel(ch)}
                                                title={`Test ${CHANNEL_LABELS[ch] || ch}`}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                    {ch !== 'LFE' && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                                                </svg>
                                                <span className="speaker-label">{ch}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-muted" style={{ textAlign: 'center', fontSize: 11, marginTop: 8 }}>
                                        Click a speaker to test • {currentSetup.channels.length} channels active
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="bottom-btn" onClick={onClose}>Cancel</button>
                    <button className="bottom-btn primary" onClick={onClose}>Apply Configuration</button>
                </div>
            </div>
        </div>
    );
}
