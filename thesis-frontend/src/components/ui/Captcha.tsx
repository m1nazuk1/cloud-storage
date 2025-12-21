import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
    onVerify: (isValid: boolean) => void;
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify }) => {
    const [captchaText, setCaptchaText] = useState('');
    const [userInput, setUserInput] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaText(result);
        setUserInput('');
        setIsVerified(false);
        onVerify(false);
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUserInput(value);

        if (value.toLowerCase() === captchaText.toLowerCase()) {
            setIsVerified(true);
            onVerify(true);
        } else {
            setIsVerified(false);
            onVerify(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Security Verification
                </label>
                <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                </button>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 flex items-center justify-center">
                        <div className="text-2xl font-bold tracking-widest text-gray-800 select-none">
                            {captchaText.split('').map((char, index) => (
                                <span
                                    key={index}
                                    className="inline-block mx-0.5"
                                    style={{
                                        transform: `rotate(${Math.random() * 20 - 10}deg)`,
                                        color: `hsl(${Math.random() * 60 + 200}, 70%, 40%)`,
                                    }}
                                >
                  {char}
                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <input
                        type="text"
                        className={`w-full px-4 py-2 border ${
                            userInput && !isVerified
                                ? 'border-red-300'
                                : isVerified
                                    ? 'border-green-300'
                                    : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400`}
                        placeholder="Enter code above"
                        value={userInput}
                        onChange={handleInputChange}
                    />
                    {userInput && !isVerified && (
                        <p className="mt-1 text-sm text-red-600">Incorrect code</p>
                    )}
                    {isVerified && (
                        <p className="mt-1 text-sm text-green-600">✓ Verified</p>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-500">
                Please enter the characters you see in the image to prove you're not a robot.
            </p>
        </div>
    );
};

export default Captcha;