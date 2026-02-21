import { useState, useEffect, useCallback } from 'react';

declare global {
    interface Window {
        windowAPI: {
            minimize: () => void;
            maximize: () => void;
            close: () => void;
            isMaximized: () => Promise<boolean>;
        };
    }
}

export function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    const checkMaximized = useCallback(async () => {
        try {
            const maximized = await window.windowAPI.isMaximized();
            setIsMaximized(maximized);
        } catch { }
    }, []);

    useEffect(() => {
        checkMaximized();
        const interval = setInterval(checkMaximized, 500);
        return () => clearInterval(interval);
    }, [checkMaximized]);

    const handleMaximize = () => {
        window.windowAPI.maximize();
        setTimeout(checkMaximized, 100);
    };

    return (
        <div className="title-bar">
            {/* Drag region */}
            <div className="title-bar-drag">
                <div className="title-bar-brand">
                    <div className="title-bar-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                    </div>
                    <span className="title-bar-text">Sound Control Panel</span>
                </div>
            </div>

            {/* Window Controls */}
            <div className="title-bar-controls">
                <button
                    className="title-bar-btn minimize"
                    onClick={() => window.windowAPI.minimize()}
                    aria-label="Minimize"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                </button>
                <button
                    className="title-bar-btn maximize"
                    onClick={handleMaximize}
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="2" y="0" width="8" height="8" rx="1" />
                            <rect x="0" y="2" width="8" height="8" rx="1" fill="var(--bg-surface)" />
                            <rect x="0" y="2" width="8" height="8" rx="1" />
                        </svg>
                    ) : (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="0.5" y="0.5" width="9" height="9" rx="1" />
                        </svg>
                    )}
                </button>
                <button
                    className="title-bar-btn close"
                    onClick={() => window.windowAPI.close()}
                    aria-label="Close"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <line x1="1" y1="1" x2="9" y2="9" />
                        <line x1="9" y1="1" x2="1" y2="9" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
