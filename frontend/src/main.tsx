import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app-extensions.css';
import { restoreWorkerProfile } from './hooks/useWorkerProfile';

const root = document.getElementById('root');
if (!root) throw new Error('SunShield root element is missing.');
restoreWorkerProfile();

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
