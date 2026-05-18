interface CardProps {
    title?: string;
    subtitle?: string;
    className?: string;
    children: React.ReactNode;
}

export function Card({ title, subtitle, className = '', children }: CardProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            {children}
        </div>
    );
}
