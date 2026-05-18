interface TableProps {
    headers: string[];
    rows: (string | React.ReactNode)[][];
    onRowClick?: (index: number) => void;
}

export function Table({ headers, rows, onRowClick }: TableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="border-b border-gray-200">
                        {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 font-semibold text-gray-600">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr
                            key={ri}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                            onClick={() => onRowClick?.(ri)}
                        >
                            {row.map((cell, ci) => (
                                <td key={ci} className="px-4 py-3 text-gray-700">{cell}</td>
                            ))}
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-400">Sin datos</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
