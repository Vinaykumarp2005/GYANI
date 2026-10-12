import React, { useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Clock, FastForward } from "lucide-react";

export default function TimelineControls({
  times = [],
  currentTimeIndex = 0,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed = 1,
  onChangeSpeed,
}) {
  const maxIndex = Math.max(0, times.length - 1);
  const currentDate = times[currentTimeIndex] || "N/A";

  useEffect(() => {
    let interval = null;
    if (isPlaying && times.length > 0) {
      const stepDuration = Math.max(80, Math.floor(400 / playbackSpeed));
      interval = setInterval(() => {
        onTimeChange((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, stepDuration);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, maxIndex, playbackSpeed, onTimeChange, times.length]);

  const handleStepBack = () => {
    onTimeChange((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    onTimeChange((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <div className="timeline-controls-bar">
      <div className="timeline-transport">
        <button
          type="button"
          onClick={handleStepBack}
          disabled={currentTimeIndex <= 0}
          className="transport-btn"
          title="Previous Step"
        >
          <SkipBack size={15} />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className={`transport-btn play-btn ${isPlaying ? "active" : ""}`}
          title={isPlaying ? "Pause Animation" : "Play Animation"}
        >
          {isPlaying ? <Pause size={17} /> : <Play size={17} />}
        </button>

        <button
          type="button"
          onClick={handleStepForward}
          disabled={currentTimeIndex >= maxIndex}
          className="transport-btn"
          title="Next Step"
        >
          <SkipForward size={15} />
        </button>
      </div>

      <div className="timeline-slider-container">
        <div className="timeline-meta-label">
          <Clock size={13} className="clock-icon" />
          <span className="current-timestamp">Frame Date: <strong>{currentDate}</strong></span>
          <span className="frame-counter">({currentTimeIndex + 1} / {times.length})</span>
        </div>
        <input
          type="range"
          min="0"
          max={maxIndex}
          value={currentTimeIndex}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          className="timeline-range-slider"
        />
      </div>

      <div className="timeline-speed-controls">
        <FastForward size={13} className="speed-icon" />
        <span className="speed-label">Speed:</span>
        {[1, 2, 4].map((spd) => (
          <button
            key={spd}
            type="button"
            onClick={() => onChangeSpeed(spd)}
            className={`speed-pill ${playbackSpeed === spd ? "active" : ""}`}
          >
            {spd}x
          </button>
        ))}
      </div>
    </div>
  );
}
