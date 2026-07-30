interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 56, withWordmark = false }: LogoProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="HoneyCharge 로고">
        <circle cx="32" cy="32" r="32" fill="#F8C51C" />
        <path d="M35 8 L17 34 H29 L27 56 L47 28 H33 Z" fill="#202124" />
      </svg>
      {withWordmark && (
        <span className="text-xl font-extrabold tracking-tight text-text">
          Honey<span className="text-dark-gold">Charge</span>
        </span>
      )}
    </div>
  );
}
