export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-[#A0A0A0] text-xs uppercase tracking-widest font-bold ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
