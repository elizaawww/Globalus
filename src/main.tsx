import React, { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Terjadi gangguan saat memuat aplikasi.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#060916] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0b132b] border border-sky-500/40 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
            <h1 className="font-display text-xl font-bold text-white">Gagal Memuat GLOBALUS</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Peramban mengalami kendala saat membuka tampilan 3D. Pastikan membuka tautan langsung di browser utama (Chrome/Safari) dan bukan di browser bawaan chat.
            </p>
            <p className="text-[11px] text-rose-300 font-mono break-words">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
