import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    register?: UseFormRegisterReturn;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
                                         label,
                                         error,
                                         helperText,
                                         register,
                                         icon,
                                         iconPosition = 'left',
                                         className = '',
                                         ...props
                                     }) => {
    // Объединяем register и props в правильном порядке
    const inputProps = {
        ...(register || {}),
        ...props,
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && iconPosition === 'left' && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full px-4 py-2 border 
            ${error ? 'border-red-300' : 'border-gray-300'} 
            rounded-lg focus:outline-none focus:ring-2 
            focus:ring-primary-500 focus:border-transparent 
            transition-all duration-200 
            placeholder:text-gray-400
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${className}
          `}
                    {...inputProps} // Используем объединенные props
                />
                {icon && iconPosition === 'right' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
            </div>
            {(error || helperText) && (
                <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default Input;