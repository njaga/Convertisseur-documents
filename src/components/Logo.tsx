import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="doxali-brand-gradient" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4F46E5" />
                    <stop offset="0.55" stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#06B6D4" />
                </linearGradient>
            </defs>
            <rect width="32" height="32" rx="10" fill="url(#doxali-brand-gradient)" />
            <path d="M10 9.5H17.2V14.8H22.5V22.5H10V9.5Z" fill="white" fillOpacity="0.96" />
            <path d="M22.5 14.8L17.2 9.5V14.8H22.5Z" fill="white" fillOpacity="0.52" />
            <path d="M17 18.2L21 21M21 21L17 23.8M21 21H14" stroke="#111827" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default Logo;
