import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, LogIn, MailCheck } from 'lucide-react';
import Button from '../../components/ui/Button';

const ActivationSuccess: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center animate-fade-in">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 bg-primary-100 rounded-full opacity-20"></div>
                    </div>
                    <MailCheck className="h-32 w-32 text-primary-600 mx-auto mb-8 relative z-10" />
                </div>

                <div className="mb-8">
                    <CheckCircle className="h-16 w-16 text-accent-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Activated!</h1>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Welcome to CloudSync</h2>
                    <p className="text-gray-600">
                        Your account has been successfully activated. You can now log in and start using
                        our secure cloud storage platform.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link to="/login">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            className="flex items-center justify-center group transition-all duration-300 hover:scale-105"
                        >
                            <LogIn className="mr-3 h-5 w-5 group-hover:animate-bounce" />
                            Go to Login
                        </Button>
                    </Link>

                    <div className="pt-6 border-t border-gray-200">


                        <button
                            onClick={() => navigate('/')}
                            className="w-full text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                        >
                            Go to Homepage
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-xs text-gray-400">
                    <p>Having trouble? <Link to="/contact" className="text-primary-500 hover:text-primary-600">Contact support</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ActivationSuccess;