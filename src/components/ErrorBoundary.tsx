import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Changing this value clears a previous error, e.g. when navigating. */
  resetKey: string;
}

interface State {
  error: Error | null;
}

/** Keeps one broken page from blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="surface rounded-3xl p-8 text-center max-w-lg mx-auto mt-10">
          <h2 className="font-display text-xl font-semibold">Something went wrong on this page</h2>
          <p className="text-muted text-sm mt-2">
            The rest of DataLens still works. Try another page, or reload to start over.
          </p>
          <button className="btn-primary rounded-full px-5 py-2 text-sm font-semibold mt-5" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
