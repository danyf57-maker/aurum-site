
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BetaLanding } from './components/BetaLanding';
import { BetaThankYou } from './components/BetaThankYou';
import { BetaAdmin } from './components/BetaAdmin';
import AuthLogin from './components/AuthLogin';
import AuthSignup from './components/AuthSignup';
import AdminLogin from './components/AdminLogin';

const rootElement = document.getElementById('root');
const rawPath = window.location.pathname || '/';
// Normalisation : on enlève les slashs de fin sauf pour la racine
const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
console.log('[AURUM ROUTER] rawPath =', rawPath, '→ path =', path);

if (rootElement) {
  const root = createRoot(rootElement);
  let element: JSX.Element;

  if (path === '/admin/login' || path.startsWith('/admin/login/')) {
    element = <AdminLogin />;
  } else if (path.startsWith('/admin/beta')) {
    element = <BetaAdmin />;
  } else if (path.startsWith('/beta/merci')) {
    element = <BetaThankYou />;
  } else if (path.startsWith('/beta')) {
    element = <BetaLanding />;
  } else if (path === '/connexion') {
    element = <AuthLogin />;
  } else if (path === '/inscription') {
    element = <AuthSignup />;
  } else {
    element = <App />;
  }

  root.render(
    <React.StrictMode>
      {element}
    </React.StrictMode>
  );
}
