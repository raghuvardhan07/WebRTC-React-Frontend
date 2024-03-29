import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { SocketProvider } from './context/SocketProvider';
import { PeerProvider } from './context/PeerProvider';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
      <SocketProvider>
        <PeerProvider>
          <App />
        </PeerProvider>
      </SocketProvider>
    </Router>
);

