import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type BetaSignup = {
  id: string;
  email: string;
  reason: string | null;
  created_at: string;
};

export const BetaAdmin: React.FC = () => {
  const [authorized, setAuthorized] = useState(false);
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const flag = typeof window !== 'undefined'
        ? window.localStorage.getItem('aurum-admin')
        : null;

      if (flag === 'true') {
        setAuthorized(true);
      } else if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    } catch (e) {
      console.error('[AURUM ADMIN] Impossible de lire le flag admin dans localStorage', e);
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;

    const fetchSignups = async () => {
      if (!supabase) {
        setErrorMessage('Supabase non configuré côté client.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('beta_signups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AURUM BETA ADMIN] Erreur chargement beta_signups:', error);
        setErrorMessage("Impossible de charger les inscriptions pour le moment.");
      } else {
        setSignups(data || []);
      }
      setLoading(false);
    };

    fetchSignups();
  }, [authorized]);

  const truncateReason = (reason: string | null) => {
    if (!reason) return '';
    if (reason.length <= 120) return reason;
    return reason.slice(0, 117) + '...';
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (err) {
      console.error('[AURUM BETA ADMIN] Impossible de copier l’email:', err);
    }
  };

  return (
    !authorized ? (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f2e8]">
        <p className="text-sm text-[#7d6a5a]">
          Vérification de l’accès à l’espace admin…
        </p>
      </div>
    ) : (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F2EFE9] px-4 py-10">
      <div className="max-w-5xl mx-auto bg-white/90 rounded-3xl shadow-lg border border-[#E5D0A8]/40 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#A08D75]">Aurum</p>
            <h1 className="text-3xl font-semibold text-[#5C554B]">Dashboard bêta Aurum</h1>
          </div>
          <div className="text-[#5C554B]">
            Total inscrits : <span className="font-semibold">{signups.length}</span>
          </div>
        </div>

        {loading && <p className="text-[#6F665B]">Chargement…</p>}
        {errorMessage && <p className="text-red-600">{errorMessage}</p>}

        {!loading && !errorMessage && (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm text-[#5C554B]">
              <thead className="bg-[#F5ECDD] text-[#5C554B]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((signup) => (
                  <tr key={signup.id} className="border-b border-[#E5D0A8]/50">
                    <td className="px-4 py-3 align-top">
                      {new Date(signup.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 align-top">{signup.email}</td>
                    <td className="px-4 py-3 align-top">{truncateReason(signup.reason)}</td>
                    <td className="px-4 py-3 align-top">
                      <button
                        onClick={() => copyEmail(signup.email)}
                        className="rounded-full bg-[#E5D0A8] text-[#5C554B] px-3 py-1 text-xs shadow-sm hover:shadow transition"
                      >
                        Copier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    )
  );
};
