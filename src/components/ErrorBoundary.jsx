import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.error("DEBUG: ErrorBoundary - Error caught:", error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DEBUG: ErrorBoundary - Uncaught Error in App:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      console.log("DEBUG: ErrorBoundary - Rendering fallback UI");
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: '#fdd', 
          border: '1px solid red',
          minHeight: '100vh',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1>Oops! Something went wrong.</h1>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Refresh Page
          </button>
          <details style={{ 
            whiteSpace: 'pre-wrap', 
            textAlign: 'left', 
            marginTop: '20px',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            border: '1px solid #ddd'
          }}>
            <summary>Error Details (Click to expand)</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;