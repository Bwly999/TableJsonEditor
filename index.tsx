import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './utils/monacoConfig';
import App from './App';
import './index.css';

// Import Fonts locally
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to mount React application:", error);
  }
} else {
  console.error("Root element not found");
}