interface StepperProps {
    steps: string[];
    current: number;
}

export function Stepper({ steps, current }: StepperProps) {
    return (
        <div className="flex items-center gap-2 mb-6">
            {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 ${i <= current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {i + 1}
                    </div>
                    <span className={`text-sm ${i <= current ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{step}</span>
                    {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
            ))}
        </div>
    );
}
