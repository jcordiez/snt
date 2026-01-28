'use client';

import React, { Component, type ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  fallback?: ReactNode;
}

class ErrorBoundaryInner extends Component<
  ErrorBoundaryProps & { resetErrorBoundary: () => void },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { resetErrorBoundary: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetBoundary = () => {
    this.props.resetErrorBoundary();
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={this.resetBoundary} variant="outline">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function QueryErrorBoundary({ children, onReset, fallback }: ErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundaryInner
          resetErrorBoundary={reset}
          onReset={onReset}
          fallback={fallback}
        >
          {children}
        </ErrorBoundaryInner>
      )}
    </QueryErrorResetBoundary>
  );
}
