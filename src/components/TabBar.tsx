import type { DeviceType } from '../types';

interface TabBarProps {
    activeTab: DeviceType;
    onTabChange: (tab: DeviceType) => void;
    playbackCount: number;
    recordingCount: number;
}

export function TabBar({ activeTab, onTabChange, playbackCount, recordingCount }: TabBarProps) {
    return (
        <nav className="tab-bar">
            <button
                className={`tab-btn ${activeTab === 'playback' ? 'active' : ''}`}
                onClick={() => onTabChange('playback')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -2 }}>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                Playback
                <span className="tab-count">{playbackCount}</span>
            </button>
            <button
                className={`tab-btn ${activeTab === 'recording' ? 'active' : ''}`}
                onClick={() => onTabChange('recording')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -2 }}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Recording
                <span className="tab-count">{recordingCount}</span>
            </button>
            <button
                className={`tab-btn ${activeTab === 'mixer' ? 'active' : ''}`}
                onClick={() => onTabChange('mixer')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -2 }}>
                    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                Mixer
            </button>
        </nav>
    );
}
