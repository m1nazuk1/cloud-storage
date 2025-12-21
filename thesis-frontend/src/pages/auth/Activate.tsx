import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '../../api/auth';

const Activate: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const activateAccount = async () => {
            if (!code) {
                setStatus('error');
                setMessage('Invalid activation code');
                return;
            }

            try {
                await authApi.activate(code);
                setStatus('success');
                setMessage('Account activated successfully!');

                // Через 2 секунды редиректим на логин с параметром
                setTimeout(() => {
                    navigate('/login?activated=true', { replace: true });
                }, 2000);
            } catch (error: any) {
                setStatus('error');
                const errorMsg = error.response?.data?.message || 'Activation failed. The link may be expired or invalid.';
                setMessage(errorMsg);

                // Через 5 секунд редиректим на логин с ошибкой
                setTimeout(() => {
                    navigate(`/login?error=activation_failed&message=${encodeURIComponent(errorMsg)}`, { replace: true });
                }, 5000);
            }
        };

        activateAccount();
    }, [code, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="animate-fade-in">
                        <Loader2 className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-spin" />
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Activating your account...</h2>
                        <p className="text-gray-500">Please wait while we activate your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-fade-in">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Success!</h2>
                        <div className="rounded-md bg-green-50 p-4 mb-4">
                            <p className="text-green-700">{message}</p>
                        </div>
                        <p className="text-sm text-gray-500">Redirecting to login page...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-fade-in">
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Activation Failed</h2>
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                            <p className="text-red-700">{message}</p>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            You will be redirected to the login page in a few seconds...
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Go to Login Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Activate;