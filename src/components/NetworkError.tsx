import { WifiOff } from 'lucide-react';

interface NetworkErrorProps {
    onRetry: () => void;
}

const NetworkError = ({ onRetry }: NetworkErrorProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <WifiOff className="w-16 h-16 text-red-500" />
            <div className="text-xl font-semibold text-red-500 text-center">
                No Internet Connection
            </div>
            <p className="text-light-100/70 text-center">
                Please check your internet connection and try again
            </p>
            <button
                onClick={onRetry}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
                Retry Connection
            </button>
        </div>
    );
};

export default NetworkError;
