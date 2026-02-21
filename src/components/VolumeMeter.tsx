interface VolumeMeterProps {
    level: number;   // 0.0 to 1.0 peak level
    volume: number;  // 0.0 to 1.0 device volume
}

export function VolumeMeter({ level, volume }: VolumeMeterProps) {
    const percentage = Math.min(100, Math.max(0, level * 100));
    const isActive = level > 0.01;

    return (
        <div className="volume-meter-container">
            <div className="volume-meter">
                <div
                    className={`volume-meter-fill ${isActive ? 'active' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="volume-label">{Math.round(volume * 100)}%</span>
        </div>
    );
}
