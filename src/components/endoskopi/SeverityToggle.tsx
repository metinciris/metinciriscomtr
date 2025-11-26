import React from 'react';

interface SeverityToggleProps {
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    isActive?: boolean;
    disabled?: boolean;
    colorScheme?: 'blue' | 'brown' | 'purple';
    showNotDone?: boolean;
}

export const SeverityToggle: React.FC<SeverityToggleProps> = ({
    value,
    onChange,
    onFocus,
    isActive,
    disabled = false,
    colorScheme = 'blue',
    showNotDone = false,
}) => {
    const baseOptions = ['-', '+', '++', '+++'];
    const options = showNotDone ? [...baseOptions, 'Yapılmadı'] : baseOptions;

    const getButtonColors = (option: string, isSelected: boolean) => {
        if (isSelected) {
            if (option === 'Yapılmadı') {
                return 'bg-red-200 text-red-800';
            }

            switch (colorScheme) {
                case 'brown':
                    switch (option) {
                        case '-': return 'bg-gray-200 text-gray-800';
                        case '+': return 'bg-amber-200 text-amber-800';
                        case '++': return 'bg-amber-500 text-white';
                        case '+++': return 'bg-amber-700 text-white';
                    }
                    break;
                case 'purple':
                    switch (option) {
                        case '-': return 'bg-gray-200 text-gray-800';
                        case '+': return 'bg-purple-200 text-purple-800';
                        case '++': return 'bg-purple-500 text-white';
                        case '+++': return 'bg-purple-700 text-white';
                    }
                    break;
                default:
                    switch (option) {
                        case '-': return 'bg-gray-200 text-gray-800';
                        case '+': return 'bg-blue-200 text-blue-800';
                        case '++': return 'bg-blue-500 text-white';
                        case '+++': return 'bg-blue-700 text-white';
                    }
            }
        }
        return 'bg-white hover:bg-gray-100 text-gray-700';
    };

    const getButtonRounding = (option: string, index: number) => {
        if (index === 0) return 'rounded-l-lg';
        if (index === options.length - 1) return 'rounded-r-lg';
        return '';
    };

    return (
        <div
            className={`inline-flex rounded-md shadow-sm ${isActive ? 'ring-2 ring-blue-500' : ''}`}
            role="group"
            onFocus={onFocus}
        >
            {options.map((option, index) => (
                <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(option)}
                    className={`
            px-3 py-1.5 text-sm font-medium
            ${getButtonRounding(option, index)}
            ${getButtonColors(option, value === option)}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            border border-gray-300
            transition-colors duration-200
            ${option === 'Yapılmadı' ? 'text-xs' : ''}
          `}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};
