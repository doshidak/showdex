import * as React from 'react';

/**
 * Minimum required props for any `component` rendering the `error`.
 *
 * @since 1.0.3
 */
export interface ErrorBoundaryComponentProps {
  error?: Error;
}

export interface ErrorBoundaryProps<
  TProps extends ErrorBoundaryComponentProps = ErrorBoundaryComponentProps,
> {
  component?: React.FC<TProps>;
  children?: React.ReactNode;
  [prop: string]: unknown;
}

export interface ErrorBoundaryState extends ErrorBoundaryComponentProps {
  hasError?: boolean;
}

/**
 * Generic React error boundary component.
 *
 * * Do not render any styling here; this should be handled by the `component`.
 *
 * @since 1.0.3
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.log('ErrorBoundary getDerivedStateFromError()', error, 'instanceof Error?', error instanceof Error);
    return {
      hasError: error instanceof Error,
      error,
    };
  }

  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  // componentDidCatch(error: Error) {
  //   console.log('ErrorBoundary componentDidCatch() error', error, 'instanceof Error?', error instanceof Error);
  //   this.setState({ error });
  // }

  render() {
    const {
      component: Component,
      children,
      ...componentProps
    } = this.props;

    const {
      hasError,
      error,
    } = this.state;

    if (hasError && Component) {
      return (
        <Component
          {...componentProps}
          error={error}
        />
      );
    }

    return children;
  }
}
