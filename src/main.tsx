import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CookiesProvider } from "react-cookie";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookiesProvider>

      <App />
    </CookiesProvider>
  </StrictMode>
);
