import React from 'react';

interface WeatherConditionIconProps {
  icon?: string;
  description?: string;
  className?: string;
  title?: string;
}

type ConditionKind = 'clear' | 'night' | 'partly' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';

const getConditionKind = (icon = '', description = ''): ConditionKind => {
  const value = `${icon} ${description}`.toLocaleLowerCase('pt-BR');
  if (/⛈|tempest|trovo|thunder|raio/.test(value)) return 'storm';
  if (/❄|🌨|neve|snow|gelad/.test(value)) return 'snow';
  if (/🌧|🌦|chuv|garoa|rain|drizzle|aguaceiro/.test(value)) return 'rain';
  if (/🌫|nevo|névoa|fog|mist/.test(value)) return 'fog';
  if (/🌙|noite|night/.test(value)) return 'night';
  if (/🌤|🌥|parcial|poucas nuvens|partly/.test(value)) return 'partly';
  if (/☁|nubl|cloud/.test(value)) return 'cloudy';
  return 'clear';
};

const Cloud = ({ x = 11, y = 23 }: { x?: number; y?: number }) => (
  <path
    d={`M${x + 8} ${y + 20}h25.5a9.5 9.5 0 0 0 .4-19 14.5 14.5 0 0 0-27.7 4.1A7.5 7.5 0 0 0 ${x + 8} ${y + 20}Z`}
    fill="currentColor"
  />
);

const WeatherConditionIcon: React.FC<WeatherConditionIconProps> = ({ icon, description, className = 'h-8 w-8', title }) => {
  const kind = getConditionKind(icon, description);
  const accessibleTitle = title || description || 'Condição do tempo';

  return (
    <svg
      viewBox="0 0 64 64"
      className={`block shrink-0 overflow-visible ${className}`}
      role="img"
      aria-label={accessibleTitle}
      focusable="false"
    >
      {kind === 'clear' && (
        <g className="text-amber-300" stroke="currentColor" strokeLinecap="round">
          <circle cx="32" cy="32" r="12" fill="currentColor" stroke="none" />
          <path d="M32 7v7M32 50v7M7 32h7M50 32h7M14.3 14.3l5 5M44.7 44.7l5 5M49.7 14.3l-5 5M19.3 44.7l-5 5" strokeWidth="3.5" />
        </g>
      )}

      {kind === 'night' && (
        <path d="M45.5 43.8A22 22 0 0 1 21 13.2 22 22 0 1 0 50.8 39a21.8 21.8 0 0 1-5.3 4.8Z" className="fill-indigo-300" />
      )}

      {kind === 'partly' && (
        <>
          <g className="text-amber-300" stroke="currentColor" strokeLinecap="round">
            <circle cx="23" cy="22" r="9" fill="currentColor" stroke="none" />
            <path d="M23 6v5M8 22h5M12.5 11.5l3.5 3.5M34 11.5 30.5 15" strokeWidth="3" />
          </g>
          <g className="text-slate-200"><Cloud x={10} y={20} /></g>
        </>
      )}

      {kind === 'cloudy' && <g className="text-slate-300"><Cloud x={6} y={13} /></g>}

      {(kind === 'rain' || kind === 'storm' || kind === 'snow') && (
        <>
          <g className="text-slate-300"><Cloud x={6} y={8} /></g>
          {kind === 'rain' && (
            <g className="text-sky-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3.5">
              <path d="m22 48-3 6M34 48l-3 6M46 48l-3 6" />
            </g>
          )}
          {kind === 'storm' && <path d="m34 43-7 11h7l-3 7 12-14h-7l3-4Z" className="fill-amber-300" />}
          {kind === 'snow' && (
            <g className="text-sky-200" fill="currentColor">
              <circle cx="22" cy="51" r="2.2" /><circle cx="34" cy="56" r="2.2" /><circle cx="46" cy="51" r="2.2" />
            </g>
          )}
        </>
      )}

      {kind === 'fog' && (
        <g className="text-slate-300" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4">
          <path d="M12 22h40M7 32h40M17 42h40" />
        </g>
      )}
    </svg>
  );
};

export default WeatherConditionIcon;
