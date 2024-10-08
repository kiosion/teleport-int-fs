import './index.css';

import React from 'react';

import { createRoot } from 'react-dom/client';

import App from './App';
import { AuthProvider } from './context/AuthProvider';

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
