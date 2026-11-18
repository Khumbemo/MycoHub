import { Component } from 'react';
import { AlertTriangle, Home, RotateCw } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Catches render errors so one broken page doesn't blank the whole app.
 * Changing `resetKey` (e.g. the route) clears the error, so navigating away
 * recovers without a reload. Records live in IndexedDB, so nothing is lost.
 */
class ErrorBoundary extends Component {
  state = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // A lazily loaded page whose file is gone (e.g. after an app update while offline)
    const chunkFailed = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(
      String(error?.message),
    );

    return (
      <div
        role="alert"
        className={cn(
          'flex items-center justify-center p-6',
          this.props.fullPage ? 'min-h-dvh bg-paper' : 'min-h-[50vh]',
        )}
      >
        <div className="max-w-sm w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-700 mb-3" aria-hidden="true" />
          <h2 className="text-xl text-ink mb-2">
            {chunkFailed ? 'This page needs a reload' : 'Something went wrong on this page'}
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            {chunkFailed
              ? 'The app was updated. Reload to get the latest version.'
              : 'Your saved records are safe on this device. Try reloading, or go back to the dashboard.'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs uppercase"
            >
              <RotateCw className="w-4 h-4" aria-hidden="true" /> Reload
            </button>
            <button
              onClick={() => {
                window.location.hash = '#/';
                this.setState({ error: null });
              }}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-emerald-600 text-ink px-4 py-2.5 rounded-xl text-xs uppercase"
            >
              <Home className="w-4 h-4" aria-hidden="true" /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
