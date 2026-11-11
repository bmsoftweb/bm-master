import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { instalarSelecaoAoFocar } from './utils/selecaoAoFocar';
import './index.css';

// Ao focar um campo, o conteúdo fica todo selecionado (padrão BMsoft)
instalarSelecaoAoFocar();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
