type IconProps = { className?: string };

const base = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconCoiffure({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" {...base}>
      <path d="M25.5 12.2c0-4-3.1-7-7-7s-7.4 3-7.9 7c-.4 3.2-1.1 5.2-2.1 7.4-.6 1.3 0 2.2 1.3 2.2h1.4" />
      <path d="M11.2 21.8c0 2.2.6 3.6 2 4.6 1 .7 1.4 1.4 1.4 2.6v5" />
      <path d="M18.6 15.6c.8.5 1.9.6 2.9.2" />
      <path d="M25.8 9.4c2.5 2.7 3.9 6.3 3.9 10.4 0 5.4-1.6 10.4-4.2 14.6" />
      <path d="M29.6 11.6c2.4 2.8 3.7 6.2 3.7 10 0 4.6-1.3 8.9-3.4 12.6" />
      <path d="M15.6 13.6c.5 0 .9.4.9.9" />
    </svg>
  );
}

export function IconEsthetique({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" {...base}>
      <path d="M20 5.5c-5.6 0-9.6 3.9-9.6 9.6 0 2.2.2 3.9.2 5.6 0 5.9 4 10.4 9.4 10.4s9.4-4.5 9.4-10.4c0-1.7.2-3.4.2-5.6 0-5.7-4-9.6-9.6-9.6Z" />
      <path d="M10.6 15.8c2.8 0 5.2-1.5 6.6-3.9 1.7 2.4 4.6 3.9 7.6 3.9h4.6" />
      <path d="M15.8 20.4h1.6M22.6 20.4h1.6" />
      <path d="M18.6 24.8c.9.5 1.9.5 2.8 0" />
      <path d="M20 30.9v3.6" />
    </svg>
  );
}

export function IconBienEtre({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" {...base}>
      <path d="M20 8.5c2.9 3.1 4.4 6.6 4.4 10.4 0 3.8-1.5 7.3-4.4 10.4-2.9-3.1-4.4-6.6-4.4-10.4 0-3.8 1.5-7.3 4.4-10.4Z" />
      <path d="M15.9 14.9c-1.3 3.9-1 7.6.9 11.1 1.1 2 2.2 3.3 3.2 4.1-4.2.5-7.7-.6-10.4-3.2-2.4-2.3-3.4-5-3-8.1 3.2-.6 6.1-1.9 8.6-3.9Z" />
      <path d="M24.1 14.9c1.3 3.9 1 7.6-.9 11.1-1.1 2-2.2 3.3-3.2 4.1 4.2.5 7.7-.6 10.4-3.2 2.4-2.3 3.4-5 3-8.1-3.2-.6-6.1-1.9-8.6-3.9Z" />
    </svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <path d="M4 12h15" />
      <path d="m13.5 6.5 6 5.5-6 5.5" />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.4}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.4}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconBag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <path d="M5 8h14l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H7.7a1.6 1.6 0 0 1-1.6-1.4L5 8Z" />
      <path d="M9 10V6.8A3 3 0 0 1 12 4a3 3 0 0 1 3 2.8V10" />
    </svg>
  );
}

export function IconWhatsApp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 6.9 12.6l-.2.4.8 2.9-3-.8-.4.2A8.2 8.2 0 1 1 12 3.8Zm-3.7 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3l-1.8-.9c-.3-.1-.5-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5l-.8-1.9c-.2-.5-.4-.4-.6-.5h-.5Z" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <path d="M7.5 3.8h-2a2 2 0 0 0-2 2.2C4 13.6 10.4 20 18 20.5a2 2 0 0 0 2.2-2v-2a1.4 1.4 0 0 0-1.2-1.4l-2.6-.4a1.4 1.4 0 0 0-1.4.7l-.6 1.2a11.4 11.4 0 0 1-5-5l1.2-.6a1.4 1.4 0 0 0 .7-1.4L10.9 5a1.4 1.4 0 0 0-1.4-1.2h-2Z" />
    </svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <path d="M12 21.5s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
      <circle cx="12" cy="10.4" r="2.6" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.2V12l3.2 2" />
    </svg>
  );
}

export function IconInstagram({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFacebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <path d="M14.6 21.5v-8h2.7l.5-3.2h-3.2V8.2c0-.9.3-1.6 1.6-1.6h1.7V3.7a19 19 0 0 0-2.5-.2c-2.5 0-4.2 1.5-4.2 4.4v2.4H8.2v3.2H11v8" />
    </svg>
  );
}

export function IconTikTok({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      {/* La note : corps de la croche, puis le crochet qui part vers la droite. */}
      <path d="M13.6 3v11.4a3.4 3.4 0 1 1-2.6-3.3" />
      <path d="M13.6 3c.3 1.6 1.1 2.8 2.3 3.5a5.3 5.3 0 0 0 2.6.8" />
    </svg>
  );
}

/** Téléphone fixe : le combiné posé sur sa base. */
export function IconFixe({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.3}>
      <rect x="3" y="13" width="18" height="7.5" rx="1.6" />
      <path d="M6.5 13V8.2A3.2 3.2 0 0 1 9.7 5h4.6a3.2 3.2 0 0 1 3.2 3.2V13" />
      <path d="M6.6 16.6h3M14.4 16.6h3" />
    </svg>
  );
}
