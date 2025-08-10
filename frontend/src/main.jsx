import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.css'
import './index.css'
import App from './App.jsx'

console.log('main.jsx: Starting React app...');

try {
  const rootElement = document.getElementById('root');
  console.log('main.jsx: Root element found:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  console.log('main.jsx: React root created');
  
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
  
  console.log('main.jsx: React app rendered successfully');
} catch (error) {
  console.error('main.jsx: Error mounting React app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Failed to load application</h1>
      <p>Error: ${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}
