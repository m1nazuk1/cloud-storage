import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XCircle, Loader } from 'lucide-react';
import { authApi } from '../../api/auth';
import Button from '../../components/ui/Button';

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
                // После успешной активации перенаправляем на красивую страницу
                navigate(`/activation-success?email=${encodeURIComponent('user@example.com')}`);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Activation failed. The link may have expired.');
            }
        };

        activateAccount();
    }, [code, navigate]);

    // Показываем loading или error state только если остаемся на этой странице
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center">
                    <div className="relative">
                        <Loader className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Activating your account...</h2>
                    <p className="text-gray-500">Please wait while we verify your account.</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Activation Failed</h2>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <div className="space-y-4">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/login')}
                            className="w-full"
                        >
                            Go to Login
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/register')}
                            className="w-full"
                        >
                            Register Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return null; // В случае успеха компонент не рендерится (redirect)
};

export default Activate;