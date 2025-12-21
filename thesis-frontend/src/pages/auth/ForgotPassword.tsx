import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Mail, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Симуляция отправки запроса
        setTimeout(() => {
            setIsLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center">
                        <Cloud className="h-12 w-12 text-primary-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email to receive reset instructions
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                            Check your email
                        </h3>
                        <p className="text-green-700 mb-4">
                            We've sent password reset instructions to <strong>{email}</strong>
                        </p>
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Return to login
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            fullWidth
                            className="flex items-center justify-center"
                        >
                            Send Reset Instructions
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Remember your password?{' '}
                                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;