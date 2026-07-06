interface FilterSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
    return (
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}
