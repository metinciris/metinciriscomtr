import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fix for React error #306 (Element type is invalid / undefined):
 * - Export BOTH named and default component so whichever import style your router uses will work.
 */

type DbMeeting = {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description?: string | null;
};

function normalizeId(id: string | number) {
  return typeof id === 'string' ? id : String(id);
}

export function Konsensus() {
  const [meetings, setMeetings] = useState<DbMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin create form (minimal)
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [description, setDescription] = useState('');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    let alive = true;

    const run = async () => {
      await checkAuth();
      await fetchMeetings();
    };
    run();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      if (!alive) return;
      await checkAuth();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    const { data } = await supabase.auth.getSession();
    setIsAdmin(!!data.session);
  }

  async function fetchMeetings() {
    setLoading(true);
    const { data, error } = await supabase.from('meetings').select('*').order('date', { ascending: true });
    if (!error) setMeetings((data as DbMeeting[]) || []);
    setLoading(false);
  }

  async function login() {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }

  async function addMeeting() {
    if (!title || !date || !time) return;
    await supabase.from('meetings').insert({ title, date, time, description });
    setTitle('');
    setDescription('');
    await fetchMeetings();
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMeetings = meetings.filter((m) => m.date === todayKey);
  const futureMeetings = meetings.filter((m) => m.date > todayKey);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Patoloji Konsensus Toplantı Takibi</h1>

      <p style={{ marginTop: 0, color: '#4b5563', fontWeight: 600 }}>
        Telegram kanalımız üzerinden{' '}
        <a href="https://t.me/konsensustakip" target="_blank" rel="noopener noreferrer">
          (tıklayın)
        </a>{' '}
        bildirim alın. Toplantılardan 15 dakika önce bildirim gönderilir.
      </p>

      {!isAdmin && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Admin Girişi</h3>
          <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
            <input placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={login} style={{ fontWeight: 800 }}>
              Giriş Yap
            </button>
            {authError && <div style={{ color: '#b91c1c', fontWeight: 700 }}>{authError}</div>}
          </div>
        </div>
      )}

      {isAdmin && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Toplantı Oluştur</h3>
            <button onClick={logout} style={{ fontWeight: 800 }}>
              Çıkış Yap
            </button>
          </div>

          <div style={{ display: 'grid', gap: 8, maxWidth: 520, marginTop: 12 }}>
            <input placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <textarea placeholder="Açıklama" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button onClick={addMeeting} style={{ fontWeight: 800 }}>
              Kaydet
            </button>
          </div>
        </div>
      )}

      {loading && <p>Yükleniyor…</p>}

      {!loading && (
        <>
          <h2 style={{ marginTop: 24 }}>Bugün</h2>
          {todayMeetings.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Bugün için toplantı yok.</p>
          ) : (
            todayMeetings.map((m) => (
              <div
                key={normalizeId(m.id)}
                style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 8 }}
              >
                <div style={{ fontWeight: 900 }}>{m.title}</div>
                <div style={{ color: '#374151', fontWeight: 700 }}>{m.time}</div>
                {m.description && <div style={{ color: '#4b5563', marginTop: 6 }}>{m.description}</div>}
              </div>
            ))
          )}

          <h2 style={{ marginTop: 24 }}>Gelecek Toplantılar</h2>
          {futureMeetings.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Planlanmış toplantı yok.</p>
          ) : (
            futureMeetings.map((m) => (
              <div
                key={normalizeId(m.id)}
                style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 8 }}
              >
                <div style={{ fontWeight: 900 }}>{m.title}</div>
                <div style={{ color: '#374151', fontWeight: 700 }}>
                  {m.date} • {m.time}
                </div>
                {m.description && <div style={{ color: '#4b5563', marginTop: 6 }}>{m.description}</div>}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

// Default export for routers that expect default import
export default Konsensus;
