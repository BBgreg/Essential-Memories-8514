import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('🚀 DEBUG: Application bootstrap starting...');

const container = document.getElementById('root');
if (!container) {
  console.error('❌ DEBUG: Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ DEBUG: Root element found, creating React root...');

const root = createRoot(container);
root.render(<App />);

console.log('✅ DEBUG: Initial render complete');