export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <div className={`flex items-center gap-3 ${className}`} {...props}>
            <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logo-clock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818CF8" />
                        <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                </defs>
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="url(#logo-clock-grad)" strokeWidth="8" />
                {/* Checkmark Hands */}
                <path d="M36 48 L48 60 L68 32" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col text-left">
                <span className="text-white font-black text-[13px] tracking-[0.15em] uppercase leading-none">ATTENDANCE</span>
                <span className="text-indigo-400 font-bold text-[9px] tracking-[0.25em] uppercase mt-1 leading-none">MARK</span>
            </div>
        </div>
    );
}
