import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log("DEBUG: main.jsx - Starting application initialization");

// Add global error handling
window.onerror = (message, source, lineno, colno, error) => {
  console.error("DEBUG: main.jsx - Uncaught Global Error:", { message, source, lineno, colno, error });
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error("DEBUG: main.jsx - Unhandled Promise Rejection:", event.reason);
});

const container = document.getElementById('root');
if (!container) {
  console.error("DEBUG: main.jsx - Root element not found");
  throw new Error('Root element not found');
}

console.log("DEBUG: main.jsx - Root element found, creating React root");

try {
  const root = createRoot(container);
  console.log("DEBUG: main.jsx - React root created successfully");
  
  root.render(<App />);
  console.log("DEBUG: main.jsx - App component rendered successfully");
} catch (error) {
  console.error("DEBUG: main.jsx - Failed to render app:", error);
  
  // Fallback rendering
  container.innerHTML = `
    <div style="padding: 40px; text-align: center; background-color: #fdd; border: 1px solid red; min-height: 100vh; font-family: Arial, sans-serif;">
      <h1>Application Failed to Load</h1>
      <p>There was a critical error loading the application. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
        Refresh Page
      </button>
      <details style="margin-top: 20px; text-align: left; background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd;">
        <summary>Error Details</summary>
        <pre>${error.message}\n${error.stack}</pre>
      </details>
    </div>
  `;
}