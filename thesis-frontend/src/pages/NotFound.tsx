import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Cloud } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <Cloud className="h-24 w-24 text-primary-500 mx-auto mb-8" />
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page not found</h2>
                <p className="text-gray-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="space-y-4">
                    <Link to="/">
                        <Button variant="primary" fullWidth className="flex items-center justify-center">
                            <Home className="mr-2 h-5 w-5" />
                            Go to Dashboard
                        </Button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Go back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;