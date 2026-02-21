import { useState, useEffect, useCallback, useRef } from 'react';
import type { AudioSession } from '../types';

export function VolumeMixer() {
    const [sessions, setSessions] = useState<AudioSession[]>([]);
    const [loading, setLoading] = useState(true);
    const peakIntervalRef = useRef<number | null>(null);

    const fetchSessions = useCallback(async () => {
        try {
            const result = await window.audioAPI.getAudioSessions();
            setSessions(result);
        } catch (err) {
            console.error('Failed to fetch audio sessions:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch + periodic refresh of sessions (every 2s)
    useEffect(() => {
        fetchSessions();
        const interval = window.setInterval(fetchSessions, 2000);
        return () => clearInterval(interval);
    }, [fetchSessions]);

    // Poll peak levels at higher frequency
    useEffect(() => {
        const pollPeaks = async () => {
            try {
                const result = await window.audioAPI.getAudioSessions();
                setSessions(prev => {
                    // Only update peak levels (and volume/mute state), preserve local state
                    const peakMap = new Map(result.map((s: AudioSession) => [s.id, s]));
                    return prev.map(s => {
                        const updated = peakMap.get(s.id);
                        return updated ? { ...s, peakLevel: updated.peakLevel } : s;
                    });
                });
            } catch { /* silent */ }
        };

        peakIntervalRef.current = window.setInterval(pollPeaks, 150);
        return () => {
            if (peakIntervalRef.current) clearInterval(peakIntervalRef.current);
        };
    }, []);

    const handleVolumeChange = async (sessionId: string, volume: number) => {
        // Optimistic update
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, volume } : s
        ));
        try {
            await window.audioAPI.setSessionVolume(sessionId, volume);
        } catch (err) {
            console.error('Failed to set session volume:', err);
        }
    };

    const handleMuteToggle = async (sessionId: string, currentMuted: boolean) => {
        const newMuted = !currentMuted;
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, isMuted: newMuted } : s
        ));
        try {
            await window.audioAPI.setSessionMute(sessionId, newMuted);
        } catch (err) {
            console.error('Failed to toggle session mute:', err);
        }
    };

    if (loading && sessions.length === 0) {
        return (
            <div className="mixer-loading">
                <div className="loading-spinner" />
                <p className="loading-text">Loading audio sessions…</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="mixer-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <p>No active audio sessions</p>
                <span className="mixer-empty-hint">Play some audio to see sessions here</span>
            </div>
        );
    }

    return (
        <div className="volume-mixer">
            <div className="mixer-grid">
                {sessions.map(session => (
                    <div key={session.id} className={`mixer-card ${session.isMuted ? 'muted' : ''}`}>
                        {/* App icon / letter avatar */}
                        <div className="mixer-card-icon">
                            {session.isSystemSounds ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            ) : (
                                <span className="mixer-avatar">
                                    {(session.displayName || session.processName || '?')[0].toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* App name */}
                        <div className="mixer-card-name" title={session.displayName}>
                            {session.displayName || session.processName}
                        </div>

                        {/* Volume slider — vertical */}
                        <div className="mixer-slider-wrapper">
                            <div className="mixer-peak-bg">
                                <div
                                    className="mixer-peak-fill"
                                    style={{ height: `${(session.isMuted ? 0 : session.peakLevel) * 100}%` }}
                                />
                            </div>
                            <input
                                type="range"
                                className="mixer-slider"
                                min="0"
                                max="100"
                                value={Math.round(session.volume * 100)}
                                onChange={e => handleVolumeChange(session.id, parseInt(e.target.value) / 100)}
                            />
                        </div>

                        {/* Volume percentage */}
                        <span className="mixer-volume-label">
                            {session.isMuted ? '🔇' : `${Math.round(session.volume * 100)}%`}
                        </span>

                        {/* Mute button */}
                        <button
                            className={`mixer-mute-btn ${session.isMuted ? 'is-muted' : ''}`}
                            onClick={() => handleMuteToggle(session.id, session.isMuted)}
                            title={session.isMuted ? 'Unmute' : 'Mute'}
                        >
                            {session.isMuted ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
