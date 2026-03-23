/**
 * Sparkle/stars cluster icon for the Constellation feature.
 * Three four-pointed stars of different sizes.
 */
export default function ConstellationIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Large star */}
      <path d="M12 2C12 2 13.5 7.5 14.5 9.5C15.5 11.5 18 12 22 12C18 12 15.5 12.5 14.5 14.5C13.5 16.5 12 22 12 22C12 22 10.5 16.5 9.5 14.5C8.5 12.5 6 12 2 12C6 12 8.5 11.5 9.5 9.5C10.5 7.5 12 2 12 2Z" />
      {/* Small star — bottom left */}
      <path d="M6 16C6 16 6.5 18 7 18.5C7.5 19 9.5 19.5 9.5 19.5C9.5 19.5 7.5 20 7 20.5C6.5 21 6 23 6 23C6 23 5.5 21 5 20.5C4.5 20 2.5 19.5 2.5 19.5C2.5 19.5 4.5 19 5 18.5C5.5 18 6 16 6 16Z" />
      {/* Small star — right */}
      <path d="M19 8C19 8 19.4 9.2 19.7 9.7C20 10.2 21.5 10.5 21.5 10.5C21.5 10.5 20 10.8 19.7 11.3C19.4 11.8 19 13 19 13C19 13 18.6 11.8 18.3 11.3C18 10.8 16.5 10.5 16.5 10.5C16.5 10.5 18 10.2 18.3 9.7C18.6 9.2 19 8 19 8Z" />
    </svg>
  );
}
