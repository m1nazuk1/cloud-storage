import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    register?: UseFormRegisterReturn; // Добавляем поддержку register
}

const Input: React.FC<InputProps> = ({
                                         label,
                                         error,
                                         helperText,
                                         register,
                                         className = '',
                                         ...props
                                     }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${className}`}
                {...register} // Распаковываем register ПЕРВЫМ!
                {...props}
            />
            {(error || helperText) && (
                <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default Input;