export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center border border-transparent bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-500 focus:outline-none disabled:opacity-50 rounded-none ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
