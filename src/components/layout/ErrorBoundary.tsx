import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('HoneyCharge ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-text">문제가 발생했어요</p>
            <p className="mt-1 text-sm text-text-secondary">화면을 새로고침해서 다시 시도해 주세요.</p>
          </div>
          <PrimaryButton fullWidth={false} className="px-8" onClick={() => window.location.assign('/')}>
            홈으로 이동
          </PrimaryButton>
        </div>
      );
    }
    return this.props.children;
  }
}
