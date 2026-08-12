type LogoProps = {
  className?: string;
  size?: number;
};

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#2457E6" />
      <path d="M9.5 8.5H17.4L22.5 13.6V23.5H9.5V8.5Z" fill="white" />
      <path d="M17.4 8.5V13.6H22.5" fill="#DCE6FF" />
      <path d="M17.4 8.5V13.6H22.5" stroke="#B8C9FF" strokeWidth="1.2" strokeLinejoin="round" />
      <path
        d="M14 18.8H20.5M18.2 16.6L20.5 18.8L18.2 21"
        stroke="#F26B4A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
