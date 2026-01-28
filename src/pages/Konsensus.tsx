import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
};

export default function Konsensus() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchMeetings();
    checkAuth();
    supabase.auth.onAuthStateChange(() => checkAuth());
  }, []);

  async function checkAuth() {
    const { data } = await supabase.auth.getSession();
    setIsAdmin(!!data.session);
  }

  async function fetchMeetings() {
    setLoading(true);
    const { data } = await supabase.from('meetings').select('*').order('date');
    setMeetings(data || []);
    setLoading(false);
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) checkAuth();
  }

  async function logout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }

  async function addMeeting() {
    if (!title || !date || !time) return;
    await supabase.from('meetings').insert({ title, date, time, description });
    setTitle(''); setDate(''); setTime(''); setDescription('');
    fetchMeetings();
  }

  const today = new Date().toISOString().slice(0, 10);

  const todayMeetings = meetings.filter(m => m.date === today);
  const futureMeetings = meetings.filter(m => m.date > today);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Patoloji Konsensus Toplantı Takibi</h1>

      {!isAdmin && (
        <div style={{ marginBottom: 24 }}>
          <h3>Admin Girişi</h3>
          <input placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={login}>Giriş Yap</button>
        </div>
      )}

      {isAdmin && (
        <div style={{ marginBottom: 24 }}>
          <button onClick={logout}>Çıkış Yap</button>
          <h3>Toplantı Oluştur</h3>
          <input placeholder="Başlık" value={title} onChange={e => setTitle(e.target.value)} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          <textarea placeholder="Açıklama" value={description} onChange={e => setDescription(e.target.value)} />
          <button onClick={addMeeting}>Kaydet</button>
        </div>
      )}

      {loading && <p>Yükleniyor…</p>}

      {!loading && (
        <>
          <h2>Bugün</h2>
          {todayMeetings.map(m => (
            <div key={m.id}>
              <strong>{m.title}</strong> – {m.time}
            </div>
          ))}

          <h2>Gelecek Toplantılar</h2>
          {futureMeetings.map(m => (
            <div key={m.id}>
              <strong>{m.title}</strong> – {m.date} {m.time}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
