import React, { useState } from 'react';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const adminPassword = import.meta.env.VITE_AURUM_ADMIN_PASSWORD;
  const isConfigMissing = !adminPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isConfigMissing) {
      console.error('[AURUM ADMIN] Aucun mot de passe admin configuré (VITE_AURUM_ADMIN_PASSWORD manquant).');
      return;
    }

    if (password === adminPassword) {
      window.localStorage.setItem('aurum-admin', 'true');
      window.location.href = '/admin/beta';
    } else {
      setErrorMessage('Le passage doré reste fermé. Le mot de passe ne correspond pas.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f2e8] px-4">
      <div className="w-full max-w-md bg-white/80 rounded-3xl shadow-sm p-8 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#A08D75]">Aurum – Accès réservé</p>
          <h1 className="text-2xl md:text-3xl font-serif text-[#6c4a3a]">Connexion administrateur</h1>
          <p className="text-sm text-[#7d6a5a]">Cet espace est réservé à la gestion de la bêta Aurum.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#7d6a5a]">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#e0d2c0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9b678]"
              placeholder="••••••••"
              disabled={isConfigMissing}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isConfigMissing}
            className="w-full rounded-3xl bg-[#d9b678] text-[#4d3828] font-medium py-2.5 text-sm hover:bg-[#e4c489] transition disabled:opacity-60"
          >
            Entrer dans l’espace admin
          </button>
        </form>

        {isConfigMissing && (
          <p className="text-sm text-center text-[#b02a2a]">
            L’espace admin n’est pas configuré. Contacte le créateur d’Aurum.
          </p>
        )}

        {errorMessage && !isConfigMissing && (
          <p className="text-sm text-center text-[#b02a2a]">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
