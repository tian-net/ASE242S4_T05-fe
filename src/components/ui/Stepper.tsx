interface StepperProps {
    steps: string[];
    currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, i) => (
                <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {i + 1}
                    </div>
                    <span className={`ml-2 text-sm ${i <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{step}</span>
                    {i < steps.length - 1 && <div className={`w-12 h-0.5 mx-2 ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
            ))}
        </div>
    );
}
