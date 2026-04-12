import { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
    children: ReactNode;
}
interface State {
    hasError: boolean;
    error: Error | null;
}
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('UI error:', error, info.componentStack);
    }
    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            return (<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
                        <h1 className="text-lg font-semibold text-gray-900 mb-2">Что-то пошло не так</h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Обновите страницу. Если ошибка повторяется, войдите в аккаунт снова.
                        </p>
                        <button type="button" onClick={() => window.location.assign('/')} className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                            На главную
                        </button>
                    </div>
                </div>);
        }
        return this.props.children;
    }
}
