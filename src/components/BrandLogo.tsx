import React, { useId } from 'react';
import { useBrandConfig } from '../config/brandConfig';

export interface BrandLogoProps {
  /**
   * - 'mark': Compact squircle icon badge (crisp at 28px–64px)
   * - 'lockup': Squircle icon badge + Brand Name + Tagline
   * - 'card': Full official squircle artwork card (/assets/bloodsearch-logo-squircle.png)
   */
  variant?: 'mark' | 'lockup' | 'card';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  showTaglineDot?: boolean;
  className?: string;
}

const MARK_SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
  xl: 'w-16 h-16 rounded-2xl',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'mark',
  size = 'md',
  subtitle,
  className = '',
}) => {
  const brand = useBrandConfig();
  const rawId = useId().replace(/:/g, '');
  const dropMainId = `bs-drop-main-${rawId}`;
  const dropCrescentId = `bs-drop-crescent-${rawId}`;
  const pulseRedId = `bs-pulse-red-${rawId}`;
  const dropShadowId = `bs-drop-shadow-${rawId}`;

  if (variant === 'card') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-3xl bg-white p-1.5 shadow-lg border border-slate-200/90 dark:border-slate-700/80 select-none overflow-hidden ${className}`}
      >
        <img
          src="/assets/bloodsearch-logo-squircle.png"
          alt={`${brand.brandName} - ${brand.tagline}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-2xl"
        />
      </div>
    );
  }

  const markBadge = (
    <div
      className={`${MARK_SIZE_CLASSES[size]} bg-white dark:bg-white shadow-sm ring-1 ring-slate-200/90 dark:ring-white/20 flex items-center justify-center shrink-0 overflow-hidden select-none`}
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[92%] h-[92%]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={dropMainId} x1="180" y1="74" x2="338" y2="438" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f32424" />
            <stop offset="52%" stopColor="#ce1212" />
            <stop offset="100%" stopColor="#7a0707" />
          </linearGradient>
          <linearGradient id={dropCrescentId} x1="160" y1="180" x2="290" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fc3535" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#b81010" stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id={pulseRedId} x1="28" y1="268" x2="484" y2="268" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dc1c1c" />
            <stop offset="50%" stopColor="#b91010" />
            <stop offset="100%" stopColor="#dc1c1c" />
          </linearGradient>
          <radialGradient id={dropShadowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground Shadow */}
        <ellipse cx="256" cy="450" rx="92" ry="13" fill={`url(#${dropShadowId})`} />

        {/* Left Donor Silhouette */}
        <circle cx="58" cy="240" r="17" fill={`url(#${pulseRedId})`} />
        <path
          d="M28 292C28 273 41 261 58 261C75 261 88 273 88 292V305C88 311 83 315 77 315H39C33 315 28 311 28 305V292Z"
          fill={`url(#${pulseRedId})`}
        />

        {/* Left ECG Pulse Line */}
        <path
          d="M84 290H112L122 258L135 326L151 212L164 290H182"
          stroke={`url(#${pulseRedId})`}
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right ECG Pulse Line */}
        <path
          d="M330 290H348L361 212L377 326L390 258L400 290H426"
          stroke={`url(#${pulseRedId})`}
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Heart Icon */}
        <path
          d="M454 316C454 316 418 292 418 268C418 254 429 244 441 244C449 244 454 249 454 253C454 249 459 244 467 244C479 244 490 254 490 268C490 292 454 316 454 316Z"
          fill={`url(#${pulseRedId})`}
        />

        {/* Main 3D Crimson Blood Drop */}
        <path
          d="M256 64C256 64 140 214 140 310C140 376.274 191.935 430 256 430C320.065 430 372 376.274 372 310C372 214 256 64 256 64Z"
          fill={`url(#${dropMainId})`}
        />

        {/* Left-Side 3D Curved Crescent Highlight */}
        <path
          d="M256 82C235 114 156 226 156 306C156 360 194 401 245 410C203 389 180 349 182 296C184 235 235 136 256 82Z"
          fill={`url(#${dropCrescentId})`}
        />

        {/* Magnifier Handle Crimson Rim */}
        <path
          d="M308 352L356 400"
          stroke="#990d0d"
          strokeWidth="36"
          strokeLinecap="round"
        />

        {/* Magnifier White Handle & Lens Ring */}
        <path
          d="M298 342L354 398"
          stroke="#ffffff"
          strokeWidth="23"
          strokeLinecap="round"
        />
        <circle
          cx="256"
          cy="300"
          r="66"
          stroke="#ffffff"
          strokeWidth="19"
          fill="#8c0b0b"
          fillOpacity="0.32"
        />

        {/* Inner White Blood Droplet Inside Lens */}
        <path
          d="M256 255C256 255 226 296 226 318C226 334.569 239.431 348 256 348C272.569 348 286 334.569 286 318C286 296 256 255 256 255Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );

  if (variant === 'mark') {
    return className ? <div className={`inline-flex ${className}`}>{markBadge}</div> : markBadge;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 min-w-0 select-none ${className}`}>
      {markBadge}
      <div className="min-w-0 leading-none">
        <div className="font-extrabold text-sm sm:text-base tracking-tight truncate">
          <span className="text-[#c81018] dark:text-[#f83b3b]">{brand.brandPrimaryWord}</span>
          {brand.brandSecondaryWord ? (
            <>
              {' '}
              <span className="text-slate-900 dark:text-white">{brand.brandSecondaryWord}</span>
            </>
          ) : null}
        </div>
        {subtitle ? (
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 block mt-0.5 truncate">
            {subtitle}
          </span>
        ) : (
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.1em] uppercase text-slate-700 dark:text-slate-300 block mt-1 truncate">
            {brand.tagline}
          </span>
        )}
      </div>
    </div>
  );
};
