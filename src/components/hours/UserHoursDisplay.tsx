const HoursChart = ({ hours = 44, maxHours = 50 }) => {
  const getColorByHours = (hours) => {
    if (hours <= 18) return '#dc3545';
    if (hours <= 29) return '#fd7e14';
    if (hours <= 39) return '#0d6efd';
    return '#4CAF50';
  };
  const color = getColorByHours(hours);
  const percentage = (hours / maxHours) * 100;
  const circumference = 2 * Math.PI * 40; // Reduzido de 80 para 40
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"> {/* Reduzido de 200x200 para 100x100 */}
      <defs>
        <linearGradient id={`progressGradient-${hours}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.8 }} />
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.2" />
        </filter>

        <filter id="innerGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Decorative background */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#f0f0f0" stroke-width="1" />

      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="#f5f5f5"
        stroke-width="8"
        filter="url(#shadow)"
      />

      {/* Progress arc */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke={`url(#progressGradient-${hours})`}
        stroke-width="8"
        stroke-linecap="round"
        stroke-dasharray={circumference}
        stroke-dashoffset={offset}
        transform="rotate(-90 50 50)"
        filter="url(#shadow)"
      />

      {/* Center circle */}
      <circle cx="50" cy="50" r="30" fill="#fff" filter="url(#innerGlow)" />

      {/* Markers */}
      <g transform="translate(50, 50)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            x1="35"
            y1="0"
            x2="40"
            y2="0"
            stroke="#ddd"
            stroke-width="2"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>

      {/* Text content */}
      <g filter="url(#shadow)">
        <text
          x="50"
          y="45"
          text-anchor="middle"
          font-size="16"
          font-weight="bold"
          fill={color}
        >
          {hours}
        </text>
        <text
          x="50"
          y="55"
          text-anchor="middle"
          font-size="8"
          fill="#666"
        >
          horas
        </text>
      </g>
    </svg>
  );
};
