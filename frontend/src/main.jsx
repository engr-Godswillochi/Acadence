import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@fontsource-variable/ibm-plex-sans';
// Base first, then the canonical visual layer. Both are imported before the app
// so component-scoped sheets (such as dialog.css) always land underneath them.
import './styles/index.css';
// Campus Wayfinding is the canonical visual layer; index.css supplies the shared structural base.
import './styles/registry-light.css';
import './styles/admin.css';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><NotificationProvider><App /></NotificationProvider></AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
