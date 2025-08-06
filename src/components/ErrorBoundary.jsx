import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h1 className="text-xl font-bold text-red-800 mb-2">
                Something went wrong
              </h1>
              <p className="text-red-600 mb-4">
                The application encountered an error. Please refresh the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
