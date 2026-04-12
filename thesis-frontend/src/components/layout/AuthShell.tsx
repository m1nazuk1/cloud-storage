import React from 'react';
import { Cloud } from 'lucide-react';
interface AuthShellProps {
    children: React.ReactNode;
    showLogo?: boolean;
}
const AuthShell: React.FC<AuthShellProps> = ({ children, showLogo = true }) => {
    return (<div className="relative min-h-screen min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center py-8 pt-safe pb-safe px-4 sm:px-6 sm:py-10">
            <div className="pointer-events-none fixed inset-0 -z-20 bg-[#eef2ff]"/>
            <div className="pointer-events-none fixed inset-0 -z-10 auth-mesh opacity-90"/>
            <div className="pointer-events-none fixed -top-24 -left-28 h-[28rem] w-[28rem] rounded-full bg-violet-400/25 blur-3xl -z-10 animate-float-slow"/>
            <div className="pointer-events-none fixed top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full bg-teal-400/20 blur-3xl -z-10 animate-float-slow-reverse"/>
            <div className="pointer-events-none fixed bottom-0 left-1/4 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl -z-10"/>

            <div className="relative z-10 w-full max-w-md min-w-0 flex flex-col items-center">
                {showLogo && (<div className="mb-8 flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-400/40 to-violet-400/40 blur-xl scale-150"/>
                            <Cloud className="relative h-16 w-16 text-indigo-600 drop-shadow-sm" strokeWidth={1.25}/>
                        </div>
                    </div>)}
                {children}
            </div>
        </div>);
};
export default AuthShell;
