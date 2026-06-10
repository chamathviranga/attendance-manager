export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center justify-center border border-[#2C2C2C] bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-[#2C2C2C] focus:outline-none disabled:opacity-50 rounded-none ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
