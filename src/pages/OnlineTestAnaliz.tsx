import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Settings,
  Upload,
  Eye,
  Key,
  Map as MapIcon,
  BookOpen,
  Calculator,
  Download,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Info,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// -----------------------------
// Types
// -----------------------------

interface Profile {
  id: string;
  name: string;
  idStart: number;
  idLen: number;
  nameStart: number;
  nameLen: number;
  bookletStart: number;
  bookletLen: number;
  answersStart: number;
  noBooklet: boolean;
}

interface StudentRecord {
  raw: string;
  id: string;
  name: string;
  booklet: string;
  answers: string; // raw order (their booklet order)
  status: 'OK' | 'Warning' | 'Error';
  messages: string[];
}

interface AnswerKey {
  booklet: string; // A/B/C/D
  answers: string; // booklet order
}

/**
 * Mapping is stored as A->X order (what the user pasted from Excel):
 * aToOrder[i] = X_question_number (1-based) where A question (i+1) appears in that booklet.
 *
 * Example: A Q1 -> B Q12  => for booklet B: aToOrder[0] = 12
 */
interface Mapping {
  fromBooklet: string; // B/C/D (source booklet)
  toBooklet: 'A';
  aToOrder: number[]; // length = qCount, 1-based indices
}

interface SubjectRange {
  name: string;
  start: number; // A order
  end: number;   // A order
}

type CancelMode = 'count' | 'correct';
type InvalidMode = 'wrong' | 'separate';

interface ScoringConfig {
  totalScore: number;
  penalty: boolean;
  cancelMode: CancelMode;
  invalidMode: InvalidMode;
}

interface AnalysisResult {
  studentId: string;
  studentName: string;
  booklet: string;

  rights: number;
  wrongs: number;
  empties: number;
  invalids: number;

  net: number;
  score: number;

  // Only if we could normalize to A order:
  normalizedToA?: string;

  subjectResults?: { name: string; rights: number; wrongs: number; empties: number; net: number }[];
}

// -----------------------------
// Constants
// -----------------------------

const DEFAULT_PROFILE: Profile = {
  id: 'varsayilan',
  name: 'Varsayılan Şablon',
  idStart: 21,
  idLen: 10,
  nameStart: 1,
  nameLen: 20,
  bookletStart: 31,
  bookletLen: 1,
  answersStart: 32,
  noBooklet: false
};

const STEPS = [
  { id: 1, title: 'Veri Girişi', icon: <Upload size={20} />, description: 'DAT dosyasını yükleyin veya yapıştırın.' },
  { id: 2, title: 'Dizayn & Önizleme', icon: <Settings size={20} />, description: 'DAT dosya yapısını tanımlayın ve kontrol edin.' },
  { id: 3, title: 'Cevap Anahtarı', icon: <Key size={20} />, description: 'Doğru cevapları girin.' },
  { id: 4, title: 'Kitapçık/Mapping', icon: <MapIcon size={20} />, description: 'Kitapçık dönüşümlerini ayarlayın.' },
  { id: 5, title: 'Konu Ders sıralaması', icon: <BookOpen size={20} />, description: 'Ders ve konu kapsamlarını belirleyin.' },
  { id: 6, title: 'Puanlama Kriterleri', icon: <Calculator size={20} />, description: 'Puanlama kurallarını ayarlayın.' },
  { id: 7, title: 'Analiz & Rapor', icon: <Download size={20} />, description: 'Sonuçları görün ve indirin.' }
];

interface OnlineTestAnalizProps {
  onNavigate: (page: string) => void;
}

// -----------------------------
// Helpers
// -----------------------------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function cleanAnswerString(val: string) {
  return val
    .toUpperCase()
    .replace(/\r/g, '')
    .replace(/[^\sA-E*#]/g, '')
    .replace(/\t/g, ' ')
    .replace(/\n/g, '')
    .replace(/#/g, '#'); // keep
}

function isCancelledKeyChar(k: string) {
  return k === ' ' || k === '#';
}

function safeCharAt(s: string, idx: number) {
  if (!s) return ' ';
  return s[idx] ?? ' ';
}

/**
 * Invert A->X mapping into X->A mapping (both 1-based arrays)
 * xToA[xIndex] = aQuestionNumber
 */
function invertAToOrder(aToOrder: number[], qCount: number): number[] | null {
  if (aToOrder.length < qCount) return null;
  const xToA = new Array<number>(qCount).fill(0);

  for (let a = 0; a < qCount; a++) {
    const xQ = aToOrder[a];
    if (!Number.isFinite(xQ)) return null;
    const xIdx = xQ - 1;
    if (xIdx < 0 || xIdx >= qCount) return null;
    xToA[xIdx] = a + 1;
  }
  if (xToA.some(v => v === 0)) return null;
  return xToA;
}

/**
 * Build booklet key from A key + A->X mapping.
 * Returns X-order key string.
 */
function deriveBookletKeyFromA(aKey: string, aToOrder: number[], qCount: number): string | null {
  if (!aKey || aKey.length < qCount) return null;
  if (aToOrder.length < qCount) return null;

  const out = new Array<string>(qCount).fill(' ');
  for (let a = 0; a < qCount; a++) {
    const xQ = aToOrder[a];
    const xIdx = xQ - 1;
    if (xIdx < 0 || xIdx >= qCount) return null;
    out[xIdx] = safeCharAt(aKey, a);
  }
  return out.join('');
}

function listNumbersFromText(txt: string): number[] {
  return txt
    .trim()
    .split(/[\s,;]+/g)
    .filter(Boolean)
    .map(x => Number(x))
    .filter(n => Number.isFinite(n));
}

/**
 * Parse Excel-like table:
 * Columns (TSV/CSV-ish): A_anahtar, B_sira, C_sira, D_sira, SoruNo
 */
function parseMappingTable(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const rows: { aAns?: string; b?: number; c?: number; d?: number; q?: number }[] = [];

  for (const line of lines) {
    // Prefer tab split; fallback whitespace
    let cells = line.split('\t').map(c => c.trim()).filter(Boolean);
    if (cells.length < 5) {
      cells = line.split(/\s+/g).map(c => c.trim()).filter(Boolean);
    }
    if (cells.length < 5) continue;

    const last = cells[cells.length - 1];
    if (!/^\d+$/.test(last)) continue;

    const q = Number(last);
    const aAns = cells[0]?.toUpperCase();
    const b = Number(cells[1]);
    const c = Number(cells[2]);
    const d = Number(cells[3]);

    rows.push({ aAns, b, c, d, q });
  }

  if (rows.length === 0) return null;

  const qCount = Math.max(...rows.map(r => r.q ?? 0));
  const aKeyArr = new Array<string>(qCount).fill(' ');
  const aToB = new Array<number>(qCount).fill(0);
  const aToC = new Array<number>(qCount).fill(0);
  const aToD = new Array<number>(qCount).fill(0);

  for (const r of rows) {
    if (!r.q) continue;
    const i = r.q - 1;

    if (r.aAns && /^[A-E#]$/.test(r.aAns)) aKeyArr[i] = r.aAns === '#' ? '#' : r.aAns;
    if (Number.isFinite(r.b ?? NaN)) aToB[i] = r.b!;
    if (Number.isFinite(r.c ?? NaN)) aToC[i] = r.c!;
    if (Number.isFinite(r.d ?? NaN)) aToD[i] = r.d!;
  }

  const hasB = aToB.every(n => n > 0);
  const hasC = aToC.every(n => n > 0);
  const hasD = aToD.every(n => n > 0);

  return {
    qCount,
    aKey: aKeyArr.join(''),
    mappings: {
      B: hasB ? aToB : null,
      C: hasC ? aToC : null,
      D: hasD ? aToD : null
    }
  };
}

// -----------------------------
// Step Components (stable identity)
// -----------------------------

function Step1DataEntry(props: {
  datContent: string;
  setDatContent: (v: string) => void;
  encoding: string;
  setEncoding: (v: string) => void;
  detectedQuestionCount: number;
}) {
  const { datContent, setDatContent, encoding, setEncoding, detectedQuestionCount } = props;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">DAT İçeriği</h3>
        <div className="flex items-center gap-3">
          {detectedQuestionCount > 0 && (
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              Bu sınavda {detectedQuestionCount} soru tespit edildi.
            </div>
          )}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kodlama:</span>
          <select
            value={encoding}
            onChange={e => {
              try {
                setEncoding(e.target.value);
                // Test support
                // eslint-disable-next-line no-new
                new TextDecoder(e.target.value);
              } catch {
                toast.error('Seçilen kodlama bu tarayıcıda desteklenmiyor.');
              }
            }}
            className="p-2 border-2 border-slate-200 bg-white rounded-none font-bold text-slate-800 focus:border-slate-800 outline-none"
          >
            <option value="utf-8">UTF-8</option>
            <option value="windows-1254">Windows-1254 (TR)</option>
          </select>
        </div>
      </div>

      <textarea
        className="w-full h-80 p-6 font-mono text-sm border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-800 text-slate-900 outline-none transition-all shadow-inner"
        placeholder="DAT dosyası içeriğini buraya yapıştırın veya dosyayı sürükleyin..."
        value={datContent}
        onChange={e => setDatContent(e.target.value)}
      />

      <div className="flex gap-4">
        <label className="flex-1 cursor-pointer bg-slate-900 text-white p-5 rounded-none text-center font-black uppercase tracking-widest hover:bg-black transition shadow-xl active:scale-[0.98]">
          <Upload size={24} className="inline mr-3" /> Dosyadan Yükle (.dat / .txt)
          <input
            type="file"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = re => {
                const text = (re.target?.result as string) ?? '';
                setDatContent(text);
              };
              try {
                reader.readAsText(file, encoding);
              } catch {
                toast.error('Dosya okuma hatası: Kodlama desteklenmiyor olabilir.');
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

function Step2Profile(props: {
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const { profile, setProfile } = props;

  const exportConfig = () => {
    const data = JSON.stringify(profile, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sinav_Dizayni_${profile.name}.json`;
    link.click();
    toast.success('Dizayn dışa aktarıldı.');
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = re => {
      try {
        const json = JSON.parse(re.target?.result as string);
        setProfile({ ...DEFAULT_PROFILE, ...json, id: 'imported_' + Date.now() });
        toast.success('Dizayn içe aktarıldı.');
      } catch {
        toast.error('Geçersiz dosya formatı.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Dizayn Yönetimi</h3>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-white text-slate-700 px-4 py-2 text-xs font-black uppercase border-2 border-slate-300 hover:border-slate-800 transition-all flex items-center gap-2">
            <Upload size={14} /> Şablon Yükle
            <input type="file" className="hidden" accept=".json" onChange={importConfig} />
          </label>
          <button
            onClick={exportConfig}
            className="bg-white text-slate-700 px-4 py-2 text-xs font-black uppercase border-2 border-slate-300 hover:border-slate-800 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Şablonu İndir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 rounded-none shadow-md border-2 border-slate-200 hover:border-[#3498db] transition-colors bg-white">
          <label className="block text-xs font-black text-slate-800 mb-3 uppercase tracking-widest">Öğrenci No (ID)</label>
          <div className="flex gap-2 text-slate-900">
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block mb-1">Başlangıç Karakter</span>
              <input
                type="number"
                value={profile.idStart}
                onChange={e => setProfile({ ...profile, idStart: Number(e.target.value) })}
                className="w-full p-2 border-2 border-slate-300 focus:border-slate-900 outline-none font-black bg-slate-50"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block mb-1">Karakter Sayısı</span>
              <input
                type="number"
                value={profile.idLen}
                onChange={e => setProfile({ ...profile, idLen: Number(e.target.value) })}
                className="w-full p-2 border-2 border-slate-300 focus:border-slate-900 outline-none font-black bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-colors">
          <label className="block text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">İsim Soyad</label>
          <div className="flex gap-2 text-slate-800">
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block mb-1">Başlangıç Karakter</span>
              <input
                type="number"
                value={profile.nameStart}
                onChange={e => setProfile({ ...profile, nameStart: Number(e.target.value) })}
                className="w-full p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block mb-1">Karakter Sayısı</span>
              <input
                type="number"
                value={profile.nameLen}
                onChange={e => setProfile({ ...profile, nameLen: Number(e.target.value) })}
                className="w-full p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-colors">
          <label className="block text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">Kitapçık Türü</label>

          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={profile.noBooklet}
                onChange={e => setProfile({ ...profile, noBooklet: e.target.checked })}
                className="w-5 h-5 accent-[#3498db]"
              />
              <span className="text-sm font-bold text-slate-700 group-hover:text-[#3498db] transition-colors">
                Bu DAT dosyasında kitapçık bilgisi YOK (tek kitapçık)
              </span>
            </label>
          </div>

          <div className={`flex gap-2 text-slate-800 ${profile.noBooklet ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block mb-1">Kaçıncı Karakter?</span>
              <input
                type="number"
                value={profile.bookletStart}
                onChange={e => setProfile({ ...profile, bookletStart: Number(e.target.value) })}
                className="w-full p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50"
                disabled={profile.noBooklet}
              />
            </div>
            <div className="flex-1 opacity-50">
              <span className="text-[10px] text-slate-400 block mb-1">Sabit: 1 Karakter</span>
              <input type="number" disabled value={1} className="w-full p-2 border-2 border-slate-100 bg-slate-100 text-slate-400 outline-none font-bold" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-colors md:col-span-1 lg:col-span-1">
          <label className="block text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">Cevap Başlangıcı (Karakter)</label>
          <input
            type="number"
            value={profile.answersStart}
            onChange={e => setProfile({ ...profile, answersStart: Number(e.target.value) })}
            className="w-full p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded border border-blue-100 text-blue-900 text-sm space-y-2">
        <p className="font-bold flex items-center gap-2">
          <Info size={16} /> Önemli Notlar:
        </p>
        <ul className="list-disc list-inside opacity-90 space-y-1">
          <li>Karakter pozisyonları 1'den başlar (Excel mantığı).</li>
          <li>
            <strong>Kitapçık Türü:</strong> Eğer DAT dosyasında belirtilmemişse veya boşsa, tüm öğrenciler otomatik olarak <strong>A kitapçığı</strong> kabul edilir.
          </li>
          <li>Dizaynınızı JSON dosyası olarak kaydedip daha sonra tekrar yükleyebilirsiniz.</li>
        </ul>
      </div>
    </div>
  );
}

function Step2Preview(props: {
  students: StudentRecord[];
}) {
  const { students } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'OK' | 'Warning' | 'Error'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch =
        searchTerm === '' || s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const errorCount = students.filter(s => s.status === 'Error').length;
  const warningCount = students.filter(s => s.status === 'Warning').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="ID veya isim ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 text-xs font-bold rounded ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border'}`}>
            Tümü ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('Error')}
            className={`px-3 py-1 text-xs font-bold rounded ${statusFilter === 'Error' ? 'bg-rose-600 text-white' : 'bg-white border text-rose-600'}`}
          >
            Hatalı ({errorCount})
          </button>
          <button
            onClick={() => setStatusFilter('Warning')}
            className={`px-3 py-1 text-xs font-bold rounded ${statusFilter === 'Warning' ? 'bg-amber-500 text-white' : 'bg-white border text-amber-600'}`}
          >
            Uyarı ({warningCount})
          </button>
        </div>
      </div>

      {selectedStudent && (
        <div className="bg-amber-50 p-4 border border-amber-200 rounded">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-bold text-slate-800">{selectedStudent.id}</span> - <span>{selectedStudent.name}</span>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
          <div className="text-xs font-mono bg-white p-2 border rounded mb-2 break-all">{selectedStudent.answers}</div>
          {selectedStudent.messages.length > 0 && (
            <ul className="text-sm text-amber-800 list-disc list-inside">
              {selectedStudent.messages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-none border-2 border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead style={{ backgroundColor: '#1e293b' }} className="text-white sticky top-0">
              <tr>
                <th className="p-4 border-b border-slate-700 font-black uppercase tracking-widest text-[11px]">ID</th>
                <th className="p-4 border-b border-slate-700 font-black uppercase tracking-widest text-[11px]">Ad Soyad</th>
                <th className="p-4 border-b border-slate-700 font-black uppercase tracking-widest text-[11px]">Kit.</th>
                <th className="p-3 border-b border-slate-700 font-black uppercase tracking-widest text-[11px]">Soru</th>
                <th className="p-4 border-b border-slate-700 font-black uppercase tracking-widest text-[11px]">Cevaplar</th>
                <th className="p-4 border-b border-slate-700 font-black uppercase tracking-widest text-[11px]">Durum</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {filteredStudents.map((s, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedStudent(s)}
                  className={`hover:bg-slate-50 border-b last:border-0 cursor-pointer ${s.status === 'Error' ? 'bg-rose-50' : s.status === 'Warning' ? 'bg-amber-50' : ''}`}
                >
                  <td className="p-3">{s.id}</td>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.booklet}</td>
                  <td className="p-3">{s.answers.length}</td>
                  <td className="p-3 font-mono text-xs">{s.answers.substring(0, 12)}...</td>
                  <td className="p-3">
                    {s.status === 'OK' && <CheckCircle size={16} className="text-emerald-500" />}
                    {s.status === 'Warning' && <AlertTriangle size={16} className="text-amber-500" />}
                    {s.status === 'Error' && <XCircle size={16} className="text-rose-500" />}
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                    Veri bulunamadı. Lütfen DAT yükleyin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-slate-500 italic">* Hata varsa, lütfen DAT dosyasını düzelterek yeniden yükleyin. Sistem üzerinden düzenleme yapılamaz.</p>
    </div>
  );
}

function Step3AnswerKey(props: {
  profile: Profile;
  detectedQuestionCount: number;
  answerKeys: AnswerKey[];
  setAnswerKeys: (keys: AnswerKey[]) => void;

  // Mapping derived keys
  qCount: number;
  derivedKeys: Record<string, string | null>; // B/C/D derived
  keyCompare: Record<string, { mismatches: number; mismatchPositions: number[] } | null>;
  activeBooklet: string;
  setActiveBooklet: (b: string) => void;
}) {
  const { profile, detectedQuestionCount, answerKeys, setAnswerKeys, qCount, derivedKeys, keyCompare, activeBooklet, setActiveBooklet } = props;

  const isNoBooklet = profile.noBooklet;
  const booklets = isNoBooklet ? ['A'] : ['A', 'B', 'C', 'D'];

  const currentKey = answerKeys.find(k => k.booklet === activeBooklet)?.answers || '';

  const updateKey = (booklet: string, val: string) => {
    const cleanVal = cleanAnswerString(val);
    const otherKeys = answerKeys.filter(k => k.booklet !== booklet);
    setAnswerKeys([...otherKeys, { booklet, answers: cleanVal }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, booklet: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = re => {
      const text = (re.target?.result as string) ?? '';
      updateKey(booklet, text.trim());
      toast.success(`${booklet} kitapçığı yüklendi.`);
    };
    reader.readAsText(file);
  };

  const canShowDerived = !isNoBooklet && activeBooklet !== 'A' && !!derivedKeys[activeBooklet];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {booklets.map(bk => (
          <button
            key={bk}
            onClick={() => setActiveBooklet(bk)}
            className={`px-6 py-2 font-bold transition-all border-b-4 ${
              activeBooklet === bk ? 'bg-slate-800 text-white border-[#1ABC9C]' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'
            }`}
          >
            {bk} Kitapçığı
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded border shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <h4 className="font-bold text-slate-800">
            {activeBooklet} Kitapçığı Cevapları{' '}
            {activeBooklet === 'A' && isNoBooklet && <span className="text-xs font-normal text-slate-400 ml-2">(Tek kitapçık)</span>}
          </h4>
          <div className="flex gap-2 flex-wrap">
            <label className="cursor-pointer bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-semibold hover:bg-slate-200 border">
              <Upload size={14} className="inline mr-1" /> Dosyadan Yükle
              <input type="file" className="hidden" onChange={e => handleFileUpload(e, activeBooklet)} />
            </label>
            <button onClick={() => updateKey(activeBooklet, '')} className="bg-rose-50 text-rose-600 px-3 py-1 rounded text-xs font-semibold hover:bg-rose-100 border border-rose-100">
              Temizle
            </button>

            {canShowDerived && (
              <button
                onClick={() => {
                  const dk = derivedKeys[activeBooklet];
                  if (!dk) return;
                  updateKey(activeBooklet, dk);
                  toast.success(`${activeBooklet} anahtarı otomatik anahtardan dolduruldu.`);
                }}
                className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-emerald-700 border border-emerald-600"
              >
                Otomatik Anahtarı Kullan
              </button>
            )}
          </div>
        </div>

        <textarea
          className="w-full h-32 p-4 font-mono text-xl border rounded bg-slate-50 text-slate-800 tracking-[0.2em] focus:ring-2 focus:ring-[#1ABC9C] outline-none"
          placeholder={`Örn: ABCDEABCDE... (Soru sayısı ~ ${qCount || detectedQuestionCount || 0})`}
          onChange={e => updateKey(activeBooklet, e.target.value)}
          value={currentKey}
        />

        {!isNoBooklet && activeBooklet !== 'A' && derivedKeys[activeBooklet] && (
          <div className="bg-slate-50 border p-4 rounded space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold text-slate-800 text-sm">
                Otomatik Üretilen {activeBooklet} Anahtarı (A anahtarı + mapping)
              </div>
              {keyCompare[activeBooklet] && (
                <div className={`text-xs font-bold px-2 py-1 rounded ${keyCompare[activeBooklet]!.mismatches === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  Uyuşmayan: {keyCompare[activeBooklet]!.mismatches} soru
                </div>
              )}
            </div>
            <div className="font-mono text-xs break-all bg-white border p-2">
              {derivedKeys[activeBooklet]}
            </div>

            {keyCompare[activeBooklet] && keyCompare[activeBooklet]!.mismatches > 0 && (
              <div className="text-xs text-rose-700">
                Uyuşmayan soru numaraları (ilk 30): {keyCompare[activeBooklet]!.mismatchPositions.slice(0, 30).join(', ')}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 text-xs font-semibold text-slate-500 pt-4 border-t flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[#1ABC9C] rounded-full"></div>
            <span>Puanlanan Soru: {currentKey.split('').filter(c => c !== ' ' && c !== '#').length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            <span>İptal/Boş(#/boşluk): {currentKey.split('').filter(c => c === ' ' || c === '#').length}</span>
          </div>
          {!!qCount && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              <span>Beklenen Soru: {qCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded border border-blue-100 text-blue-800 text-sm flex gap-3">
        <Info size={18} className="shrink-0" />
        <div>
          <p className="font-bold mb-1">İpucu: Hızlı Giriş</p>
          <ul className="list-disc list-inside opacity-80 space-y-1">
            <li>Cevapları yan yana boşluksuz yazabilirsiniz.</li>
            <li>Excel'den bir sütunu kopyalayıp buraya yapıştırabilirsiniz.</li>
            <li>
              <strong>#</strong> veya <strong>boşluk</strong> karakterleri soruyu iptal eder.
            </li>
            <li>
              Çok kitapçıklı sınavda: Sadece <strong>A anahtarı</strong> + <strong>mapping</strong> girmeniz yeterli. B/C/D anahtarları otomatik üretilecek.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Step4Mapping(props: {
  profile: Profile;
  qCount: number;
  students: StudentRecord[];
  mappings: Mapping[];
  setMappings: (m: Mapping[]) => void;
  answerKeys: AnswerKey[];
  setAnswerKeys: (k: AnswerKey[]) => void;
}) {
  const { profile, qCount, students, mappings, setMappings, answerKeys, setAnswerKeys } = props;

  const [bulkText, setBulkText] = useState('');
  const [tableText, setTableText] = useState('');
  const [activeFrom, setActiveFrom] = useState<'B' | 'C' | 'D'>('B');

  const isNoBooklet = profile.noBooklet;

  const usedBooklets = useMemo(() => {
    const set = new Set(students.map(s => s.booklet));
    return Array.from(set);
  }, [students]);

  const currentMapping = mappings.find(m => m.fromBooklet === activeFrom);

  const applyBulk = () => {
    const numbers = listNumbersFromText(bulkText);
    if (numbers.length === 0) {
      toast.error('Geçersiz veri.');
      return;
    }
    if (qCount > 0 && numbers.length !== qCount) {
      toast.error(`Bu sınav ${qCount} soru görünüyor. Yapıştırdığınız liste ${numbers.length} adet. (Uzunluk aynı olmalı)`);
      return;
    }

    const other = mappings.filter(m => m.fromBooklet !== activeFrom);
    setMappings([...other, { fromBooklet: activeFrom, toBooklet: 'A', aToOrder: numbers }]);
    toast.success(`${activeFrom} mapping güncellendi (A → ${activeFrom}).`);
    setBulkText('');
  };

  const applyTable = () => {
    const parsed = parseMappingTable(tableText);
    if (!parsed) {
      toast.error('Tablo okunamadı. Excel’den kopyalayıp (tab ayrımlı) yapıştırdığınızdan emin olun.');
      return;
    }

    const other = mappings.filter(m => !['B', 'C', 'D'].includes(m.fromBooklet));
    const next: Mapping[] = [...other];

    if (parsed.mappings.B) next.push({ fromBooklet: 'B', toBooklet: 'A', aToOrder: parsed.mappings.B });
    if (parsed.mappings.C) next.push({ fromBooklet: 'C', toBooklet: 'A', aToOrder: parsed.mappings.C });
    if (parsed.mappings.D) next.push({ fromBooklet: 'D', toBooklet: 'A', aToOrder: parsed.mappings.D });

    setMappings(next);

    // If A key in table is present and user A key empty, fill it (or offer)
    const aKeyExisting = answerKeys.find(k => k.booklet === 'A')?.answers ?? '';
    if (!aKeyExisting || aKeyExisting.trim().length === 0) {
      const otherKeys = answerKeys.filter(k => k.booklet !== 'A');
      setAnswerKeys([...otherKeys, { booklet: 'A', answers: cleanAnswerString(parsed.aKey) }]);
      toast.success('Tablodan A anahtarı da alındı.');
    }

    toast.success('Tablodan mapping(ler) alındı.');
  };

  const booklets = ['B', 'C', 'D'] as const;

  const mappingCompleteness = useMemo(() => {
    const missing = usedBooklets.filter(b => b !== 'A' && b !== '' && !mappings.some(m => m.fromBooklet === b));
    return missing;
  }, [usedBooklets, mappings]);

  return (
    <div className="space-y-6">
      {isNoBooklet ? (
        <div className="bg-emerald-50 p-4 border border-emerald-200 rounded text-emerald-800 text-sm flex gap-3">
          <Info size={20} className="shrink-0" />
          <p>
            Bu sınav <strong>tek kitapçık</strong> görünüyor (kitapçık bilgisi yok). Mapping gerekmiyor.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 p-4 border border-amber-200 rounded text-amber-800 text-sm flex gap-3">
          <Info size={20} className="shrink-0" />
          <div className="space-y-2">
            <p>
              <strong>Mapping = soru sırası dönüşümü</strong>. Bu ekranda beklenen format:
              <br />
              <span className="font-mono">A’daki Soru 1 → {activeFrom}’de kaçıncı soru?</span> (yani <strong>A → {activeFrom}</strong>)
            </p>
            <ul className="list-disc list-inside opacity-90">
              <li>
                <strong>Mapping girersen:</strong> B/C/D anahtarları A anahtarından otomatik üretilir + soru bazlı analiz, ders/konu netleri doğru çalışır.
              </li>
              <li>
                <strong>Mapping girmezsen:</strong> Sadece “kitapçık anahtarı” girilmişse öğrenci toplam doğru/yanlış hesaplanır; ama soru analizi / konu analizi güvenilir olmaz (kapalı).
              </li>
            </ul>
          </div>
        </div>
      )}

      {!isNoBooklet && mappingCompleteness.length > 0 && (
        <div className="bg-rose-50 p-4 border border-rose-200 rounded text-rose-800 text-sm flex gap-3">
          <AlertTriangle size={20} className="shrink-0" />
          <p>
            Bu DAT içinde şu kitapçıklar var: <strong>{mappingCompleteness.join(', ')}</strong>. Bunlar için mapping girilmemiş.
          </p>
        </div>
      )}

      {!isNoBooklet && (
        <>
          <div className="bg-white p-6 border-2 border-slate-100 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Excel Tablosunu Yapıştır (Önerilen)</h4>
            <p className="text-sm text-slate-600">
              Excel’deki şu tabloyu aynen kopyala-yapıştır:
              <span className="font-mono ml-2">A anahtar | B sıra | C sıra | D sıra | Soru No</span>
            </p>

            <textarea
              className="w-full h-40 p-4 font-mono text-xs border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-800 outline-none transition-all"
              placeholder="Excel tablosunu buraya yapıştır..."
              value={tableText}
              onChange={e => setTableText(e.target.value)}
            />

            <button onClick={applyTable} className="bg-slate-900 text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">
              Tabloyu Oku ve Uygula
            </button>
          </div>

          <div className="flex gap-2">
            {booklets.map(b => (
              <button
                key={b}
                onClick={() => setActiveFrom(b)}
                className={`px-8 py-3 font-bold text-xs uppercase tracking-widest border-2 transition-all ${
                  activeFrom === b ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                }`}
              >
                {b} Kitapçığı
              </button>
            ))}
          </div>

          <div className="bg-white p-6 border-2 border-slate-100 shadow-sm space-y-6">
            <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm underline decoration-[#3498db] decoration-4">
              A → {activeFrom} Mapping (Soru Sırası)
            </h4>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Toplu Liste Yapıştır</label>
              <textarea
                className="w-full h-32 p-4 font-mono text-sm border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-800 outline-none transition-all"
                placeholder={`Örn: 12 13 14 16 ... (A soru 1→${activeFrom} kaçıncı soru?)`}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
              />
              <button onClick={applyBulk} className="bg-emerald-600 text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">
                Eşleştirmeyi Uygula
              </button>
            </div>

            {currentMapping && (
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2 pt-4 border-t">
                {currentMapping.aToOrder.slice(0, 50).map((xNum, idx) => (
                  <div key={idx} className="bg-slate-50 p-2 border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-400 font-bold mb-1">A {idx + 1}</div>
                    <div className="font-extrabold text-slate-800">
                      {activeFrom} {xNum}
                    </div>
                  </div>
                ))}
                {currentMapping.aToOrder.length > 50 && (
                  <div className="col-span-full text-xs text-slate-500 italic">Önizleme ilk 50 soru gösteriliyor.</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Step5Subjects(props: {
  subjects: SubjectRange[];
  setSubjects: (s: SubjectRange[]) => void;
}) {
  const { subjects, setSubjects } = props;

  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState(1);
  const [newEnd, setNewEnd] = useState(10);

  const addSubject = () => {
    if (!newName) return;
    setSubjects([...subjects, { name: newName, start: newStart, end: newEnd }]);
    setNewName('');
  };

  const removeSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 border-2 border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Ders / Konu Adı</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full p-3 border-2 border-white outline-none focus:border-slate-800 font-bold"
            placeholder="Örn: Patoloji"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Başlangıç Soru</label>
          <input type="number" value={newStart} onChange={e => setNewStart(Number(e.target.value))} className="w-full p-3 border-2 border-white outline-none focus:border-slate-800 font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Bitiş Soru</label>
          <input type="number" value={newEnd} onChange={e => setNewEnd(Number(e.target.value))} className="w-full p-3 border-2 border-white outline-none focus:border-slate-800 font-bold" />
        </div>
        <button onClick={addSubject} className="md:col-span-4 bg-slate-900 text-white p-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
          Listeye Ekle
        </button>
      </div>

      <div className="space-y-2">
        {subjects.map((s, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-white border-2 border-slate-100 hover:border-slate-300 transition-all">
            <div className="flex items-center gap-6">
              <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center font-black">{i + 1}</div>
              <div>
                <div className="font-black text-slate-800 uppercase tracking-tight">{s.name}</div>
                <div className="text-xs text-slate-400 font-bold">
                  A Kitapçığı Soru Aralığı: {s.start} - {s.end}
                </div>
              </div>
            </div>
            <button onClick={() => removeSubject(i)} className="text-rose-500 hover:bg-rose-50 p-2 rounded transition-colors">
              <XCircle size={20} />
            </button>
          </div>
        ))}
        {subjects.length === 0 && <div className="p-12 text-center text-slate-400 italic bg-white border-2 border-dashed border-slate-100">Henüz ders tanımlanmadı.</div>}
      </div>
    </div>
  );
}

function Step6Scoring(props: {
  scoring: ScoringConfig;
  setScoring: (s: ScoringConfig) => void;
}) {
  const { scoring, setScoring } = props;

  return (
    <div className="space-y-8 max-w-4xl">
      <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-sm mb-6 border-b-4 border-slate-900 pb-2 inline-block">Puanlama Kriterleri</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 border-2 border-slate-100 bg-slate-50 hover:border-[#3498db] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calculator size={64} />
          </div>
          <label className="block font-black mb-3 text-xs uppercase tracking-widest text-[#3498db]">Toplam Sınav Puanı</label>
          <input
            type="number"
            className="w-full p-4 border-2 border-white focus:border-[#3498db] focus:ring-4 focus:ring-sky-100 outline-none transition-all font-black text-3xl bg-white shadow-sm"
            value={scoring.totalScore}
            onChange={e => setScoring({ ...scoring, totalScore: Number(e.target.value) })}
          />
        </div>

        <div className="p-8 border-2 border-slate-100 bg-slate-50 hover:border-[#3498db] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle size={64} />
          </div>
          <label className="block font-black mb-3 text-xs uppercase tracking-widest text-[#3498db]">Net Hesabı</label>
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-4 cursor-pointer group/chk">
              <input
                type="checkbox"
                checked={scoring.penalty}
                onChange={e => setScoring({ ...scoring, penalty: e.target.checked })}
                className="w-8 h-8 accent-[#3498db]"
              />
              <span className="font-bold text-lg text-slate-800 group-hover/chk:text-[#3498db] transition-colors">4 Yanlış 1 Doğruyu Götürür</span>
            </label>
          </div>
        </div>
      </div>

      <div className="p-8 border-2 border-slate-100 bg-slate-50 hover:border-[#3498db] transition-colors">
        <label className="block font-black mb-6 text-xs uppercase tracking-widest text-[#3498db]">İptal Edilen Soru Davranışı</label>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setScoring({ ...scoring, cancelMode: 'count' })}
            className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
              scoring.cancelMode === 'count' ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
            }`}
          >
            İptal Soruyu Sayma
          </button>
          <button
            onClick={() => setScoring({ ...scoring, cancelMode: 'correct' })}
            className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
              scoring.cancelMode === 'correct' ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
            }`}
          >
            Herkese Doğru Kabul Et
          </button>
        </div>
      </div>

      <div className="p-8 border-2 border-slate-100 bg-slate-50 hover:border-[#3498db] transition-colors">
        <label className="block font-black mb-6 text-xs uppercase tracking-widest text-[#3498db]">Geçersiz (*) Cevap Davranışı</label>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setScoring({ ...scoring, invalidMode: 'wrong' })}
            className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
              scoring.invalidMode === 'wrong' ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
            }`}
          >
            Yanlış Say (Nete Dahil)
          </button>
          <button
            onClick={() => setScoring({ ...scoring, invalidMode: 'separate' })}
            className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
              scoring.invalidMode === 'separate' ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
            }`}
          >
            Ayrı Say (Nete Dahil Etme)
          </button>
        </div>
      </div>
    </div>
  );
}

function Step7Analysis(props: {
  results: AnalysisResult[];
  students: StudentRecord[];
  subjects: SubjectRange[];
  scoring: ScoringConfig;

  // for question analysis
  qCount: number;
  canDoQuestionStats: boolean;
  missingMappings: string[];
  aKey: string | null;
}) {
  const { results, students, subjects, scoring, qCount, canDoQuestionStats, missingMappings, aKey } = props;

  const sortedResults = useMemo(() => [...results].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)), [results]);
  const topCount = Math.ceil(results.length * 0.27) || 1;
  const topGroup = sortedResults.slice(0, topCount);
  const bottomGroup = sortedResults.slice(-topCount);

  const questionStats = useMemo(() => {
    if (!canDoQuestionStats) return [];
    if (!aKey || aKey.length < qCount) return [];

    const stats: any[] = [];
    for (let i = 0; i < qCount; i++) {
      const correctAns = safeCharAt(aKey, i);
      if (isCancelledKeyChar(correctAns)) continue;

      const distributions: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, ' ': 0, '*': 0 };

      let correctCount = 0;
      let topCorrect = 0;
      let bottomCorrect = 0;

      results.forEach(r => {
        const ans = r.normalizedToA ? safeCharAt(r.normalizedToA, i) : ' ';
        const key = ans === '#' ? ' ' : ans;
        distributions[key] = (distributions[key] || 0) + 1;
        if (key === correctAns) correctCount++;
      });

      topGroup.forEach(r => {
        const ans = r.normalizedToA ? safeCharAt(r.normalizedToA, i) : ' ';
        if (ans === correctAns) topCorrect++;
      });
      bottomGroup.forEach(r => {
        const ans = r.normalizedToA ? safeCharAt(r.normalizedToA, i) : ' ';
        if (ans === correctAns) bottomCorrect++;
      });

      const diffIndex = results.length ? correctCount / results.length : 0;
      const discIndex = topCount ? (topCorrect - bottomCorrect) / topCount : 0;

      let diffText = '';
      if (diffIndex >= 0.85) diffText = 'Çok Kolay';
      else if (diffIndex >= 0.70) diffText = 'Kolay';
      else if (diffIndex >= 0.40) diffText = 'Orta';
      else if (diffIndex >= 0.25) diffText = 'Zor';
      else diffText = 'Çok Zor';

      let discText = '';
      if (discIndex >= 0.40) discText = 'Mükemmel Ayırıcı';
      else if (discIndex >= 0.30) discText = 'İyi Ayırıcı';
      else if (discIndex >= 0.20) discText = 'Zayıf (Düzeltilmeli)';
      else discText = 'Çok Zayıf (Hatalı/Ayırıcı Değil)';

      stats.push({
        number: i + 1,
        correctAns,
        diffIndex,
        discIndex,
        evalText: `${discText} (${diffText})`,
        distributions
      });
    }

    return stats;
  }, [aKey, qCount, results, canDoQuestionStats, topGroup, bottomGroup, topCount]);

  const scoreData = useMemo(() => {
    const ranges = [
      { name: '0-20', count: 0 },
      { name: '20-40', count: 0 },
      { name: '40-60', count: 0 },
      { name: '60-80', count: 0 },
      { name: '80-100', count: 0 }
    ];
    results.forEach(r => {
      const s = Number(r.score);
      if (!Number.isFinite(s)) return;
      const idx = clamp(Math.floor(s / 20), 0, 4);
      ranges[idx].count++;
    });
    return ranges;
  }, [results]);

  const statsData = useMemo(() => {
    return [
      { name: 'Doğru', value: results.reduce((acc, r) => acc + (r.rights || 0), 0), color: '#10b981' },
      { name: 'Yanlış', value: results.reduce((acc, r) => acc + (r.wrongs || 0), 0), color: '#ef4444' },
      { name: 'Boş', value: results.reduce((acc, r) => acc + (r.empties || 0), 0), color: '#94a3b8' }
    ];
  }, [results]);

  return (
    <div className="space-y-8">
      {missingMappings.length > 0 && (
        <div className="bg-rose-50 p-6 border-2 border-rose-200 rounded text-rose-800 space-y-3">
          <div className="flex items-center gap-3 font-black uppercase tracking-widest text-sm">
            <AlertTriangle size={24} /> Eksik Kitapçık Eşleştirmesi!
          </div>
          <p className="text-sm">
            Sınavda kullanılan <strong>{missingMappings.join(', ')}</strong> kitapçıkları için mapping tanımlı değil.
            <br />
            <strong>Soru analizi</strong> ve <strong>konu/ders analizi</strong> doğru çalışmayabilir.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-500 text-white p-6 rounded-none shadow-lg border-b-4 border-emerald-700">
          <div className="text-sm opacity-80 font-bold uppercase tracking-tight">Toplam Öğrenci</div>
          <div className="text-4xl font-extrabold">{results.length}</div>
        </motion.div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-sky-500 text-white p-6 rounded-none shadow-lg border-b-4 border-sky-700">
          <div className="text-sm opacity-80 font-bold uppercase tracking-tight">Genel Ortalama</div>
          <div className="text-4xl font-extrabold">
            {(results.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / (results.length || 1)).toFixed(2)}
          </div>
        </motion.div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-amber-500 text-white p-6 rounded-none shadow-lg border-b-4 border-amber-700">
          <div className="text-sm opacity-80 font-bold uppercase tracking-tight">En Yüksek</div>
          <div className="text-4xl font-extrabold">{results.length > 0 ? Math.max(...results.map(r => Number(r.score) || 0)).toFixed(1) : 0}</div>
        </motion.div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-rose-500 text-white p-6 rounded-none shadow-lg border-b-4 border-rose-700">
          <div className="text-sm opacity-80 font-bold uppercase tracking-tight">En Düşük</div>
          <div className="text-4xl font-extrabold">{results.length > 0 ? Math.min(...results.map(r => Number(r.score) || 0)).toFixed(1) : 0}</div>
        </motion.div>
      </div>

      {subjects.length > 0 && canDoQuestionStats && (
        <div className="bg-white p-6 border shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm">Ders/Konu Bazlı Başarı Oranları</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub, idx) => {
              const subStats = results.map(r => r.subjectResults?.[idx]).filter(Boolean) as any[];
              const avgNet = subStats.reduce((acc, s) => acc + (s?.net || 0), 0) / (results.length || 1);
              const totalQ = sub.end - sub.start + 1;

              return (
                <div key={idx} className="p-4 bg-slate-50 border-l-4 border-[#3498db]">
                  <div className="font-black text-slate-800 text-xs mb-1 uppercase tracking-tight">{sub.name}</div>
                  <div className="text-2xl font-black text-slate-900">
                    {avgNet.toFixed(2)} <small className="text-xs text-slate-400 font-bold">NET (Ort)</small>
                  </div>
                  <div className="w-full bg-white h-2 mt-2 rounded-full overflow-hidden">
                    <div className="bg-[#3498db] h-full" style={{ width: `${totalQ ? (avgNet / totalQ) * 100 : 0}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 border shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
            <Activity size={18} className="text-sky-500" /> Puan Dağılımı
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <ReTooltip />
                <Bar dataKey="count" fill="#3498db" name="Öğrenci Sayısı" />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 border shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
            <Activity size={18} className="text-emerald-500" /> Genel Şık Dağılımı
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm italic">Soru Bazlı İstatistik ve Analiz</h3>
          <button
            onClick={() => {
              if (!questionStats.length) {
                toast.info('Soru analizi verisi yok.');
                return;
              }
              let csv = 'sep=;\nNo;Doğru;A;B;C;D;E;Gecersiz (*);Zorluk (P);Ayır. (D);Değerlendirme\n';
              questionStats.forEach(qs => {
                csv += `${qs.number};${qs.correctAns};${qs.distributions.A};${qs.distributions.B};${qs.distributions.C};${qs.distributions.D};${qs.distributions.E};${
                  (qs.distributions[' '] || 0) + (qs.distributions['*'] || 0)
                };${qs.diffIndex.toFixed(2).replace('.', ',')};${qs.discIndex.toFixed(2).replace('.', ',')};${qs.evalText}\n`;
              });
              const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `Soru_Analizi_${new Date().toLocaleDateString('tr-TR')}.csv`);
              link.click();
              toast.success('Soru analizi raporu indirildi.');
            }}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-black transition shadow-sm"
          >
            <Download size={14} /> İstatistikleri İndir
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-800 text-white uppercase tracking-wider">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3 text-center">Doğru</th>
                <th className="p-3 text-center">A</th>
                <th className="p-3 text-center">B</th>
                <th className="p-3 text-center">C</th>
                <th className="p-3 text-center">D</th>
                <th className="p-3 text-center">E</th>
                <th className="p-3 text-center">Gec. (*)</th>
                <th className="p-3 text-center">Zorluk (P)</th>
                <th className="p-3 text-center">Ayır. (D)</th>
                <th className="p-3">Değerlendirme</th>
              </tr>
            </thead>
            <tbody>
              {questionStats.map((qs, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold">{qs.number}</td>
                  <td className="p-3 text-center font-black text-emerald-600">{qs.correctAns}</td>
                  {['A', 'B', 'C', 'D', 'E'].map(opt => (
                    <td key={opt} className={`p-3 text-center ${qs.correctAns === opt ? 'bg-emerald-50 font-black' : 'text-slate-400'}`}>
                      {qs.distributions[opt] || 0}
                    </td>
                  ))}
                  <td className="p-3 text-center text-slate-400">{(qs.distributions[' '] || 0) + (qs.distributions['*'] || 0)}</td>
                  <td className={`p-3 text-center font-bold ${qs.diffIndex < 0.3 ? 'text-rose-600' : qs.diffIndex > 0.7 ? 'text-emerald-600' : ''}`}>{qs.diffIndex.toFixed(2)}</td>
                  <td className={`p-3 text-center font-bold ${qs.discIndex < 0.2 ? 'text-rose-600' : 'text-emerald-600'}`}>{qs.discIndex.toFixed(2)}</td>
                  <td className="p-3 italic text-slate-500">{qs.evalText}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {questionStats.length === 0 && (
            <div className="p-12 text-center bg-slate-50 border-t">
              <p className="text-slate-400 italic">
                {missingMappings.length > 0
                  ? "Eksik mapping nedeniyle soru analizi kapalı. (A→B/C/D mapping girin)"
                  : "Soru analizi için veri bekleniyor."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm italic">Öğrenci Detaylı Analiz Paneli</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                let csv = 'sep=;\nID;Ad Soyad;Kitapçık;Doğru;Yanlış;Boş;Gecersiz (*);Net;Puan\n';
                results.forEach(r => {
                  csv += `${r.studentId};${r.studentName};${r.booklet};${r.rights};${r.wrongs};${r.empties};${r.invalids};${r.net.toFixed(2).replace('.', ',')};${r.score
                    .toFixed(2)
                    .replace('.', ',')}\n`;
                });
                const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `Ogrenci_Sonuclari_${new Date().toLocaleDateString('tr-TR')}.csv`);
                link.click();
                toast.success('Öğrenci sonuç raporu indirildi.');
              }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-none font-bold text-xs uppercase hover:bg-emerald-700 transition shadow-md"
            >
              <Download size={14} /> Sonuçlar (CSV)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-800 text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-4">Öğrenci ID</th>
                <th className="p-4">İsim Soyad</th>
                <th className="p-4">Kit.</th>
                <th className="p-4 text-center">D</th>
                <th className="p-4 text-center">Y</th>
                <th className="p-4 text-center">Boş</th>
                <th className="p-4 text-center">Gec. (*)</th>
                <th className="p-4 text-center">Net</th>
                <th className="p-4 text-center">Puan</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 font-medium">
              {results.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 border-b last:border-0 transition-colors">
                  <td className="p-4 font-mono">{r.studentId}</td>
                  <td className="p-4 font-bold text-slate-900">{r.studentName || 'İSİMSİZ'}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 px-2 py-1 rounded font-bold text-xs">{r.booklet}</span>
                  </td>
                  <td className="p-4 text-center text-emerald-600 font-bold">{r.rights}</td>
                  <td className="p-4 text-center text-rose-600 font-bold">{r.wrongs}</td>
                  <td className="p-4 text-center text-slate-400">{r.empties}</td>
                  <td className="p-4 text-center text-slate-400">{r.invalids}</td>
                  <td className="p-4 text-center font-extrabold text-slate-800 underline decoration-sky-300">{r.net.toFixed(2)}</td>
                  <td className="p-4 text-center font-black text-slate-900">{r.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {results.length === 0 && (
            <div className="p-12 text-center bg-slate-50 border-t">
              <p className="text-slate-400 italic">Sonuç yok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Main Component
// -----------------------------

export function OnlineTestAnaliz({ onNavigate }: OnlineTestAnalizProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('online_test_analiz_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [datContent, setDatContent] = useState('');
  const [encoding, setEncoding] = useState('utf-8');
  const [students, setStudents] = useState<StudentRecord[]>([]);

  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [subjects, setSubjects] = useState<SubjectRange[]>([]);
  const [scoring, setScoring] = useState<ScoringConfig>({
    totalScore: 100,
    penalty: true,
    cancelMode: 'count',
    invalidMode: 'separate'
  });

  // Step-local states moved up to avoid remount resets:
  const [activeKeyBooklet, setActiveKeyBooklet] = useState<string>('A');

  // Scroll control
  const stepHeaderRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const detectedQuestionCount = useMemo(() => {
    if (!students.length) return 0;
    return students[0]?.answers?.length || 0;
  }, [students]);

  const aKey = useMemo(() => {
    return answerKeys.find(k => k.booklet === 'A')?.answers ?? null;
  }, [answerKeys]);

  const qCount = useMemo(() => {
    const aLen = aKey?.length ?? 0;
    return aLen || detectedQuestionCount || 0;
  }, [aKey, detectedQuestionCount]);

  // Parse DAT when profile or content changes
  useEffect(() => {
    localStorage.setItem('online_test_analiz_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!datContent) {
      setStudents([]);
      return;
    }
    parseDat(datContent, profile, setStudents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datContent, profile]);

  // Auto keep active key booklet valid
  useEffect(() => {
    if (profile.noBooklet && activeKeyBooklet !== 'A') setActiveKeyBooklet('A');
  }, [profile.noBooklet, activeKeyBooklet]);

  // Derived keys (B/C/D) from A + mapping
  const derivedKeys = useMemo(() => {
    const out: Record<string, string | null> = { B: null, C: null, D: null };
    if (!aKey || !qCount) return out;
    ['B', 'C', 'D'].forEach(bk => {
      const map = mappings.find(m => m.fromBooklet === bk);
      if (!map) return;
      out[bk] = deriveBookletKeyFromA(aKey, map.aToOrder, qCount);
    });
    return out;
  }, [aKey, mappings, qCount]);

  // Compare user-entered keys with derived
  const keyCompare = useMemo(() => {
    const out: Record<string, { mismatches: number; mismatchPositions: number[] } | null> = { B: null, C: null, D: null };
    if (!qCount) return out;

    ['B', 'C', 'D'].forEach(bk => {
      const entered = answerKeys.find(k => k.booklet === bk)?.answers ?? '';
      const derived = derivedKeys[bk];
      if (!entered || !derived) return;

      const len = Math.min(entered.length, derived.length, qCount);
      const mismatchPositions: number[] = [];
      for (let i = 0; i < len; i++) {
        const e = safeCharAt(entered, i);
        const d = safeCharAt(derived, i);
        if (e !== d) mismatchPositions.push(i + 1);
      }
      out[bk] = { mismatches: mismatchPositions.length, mismatchPositions };
    });

    return out;
  }, [answerKeys, derivedKeys, qCount]);

  const usedNonABooklets = useMemo(() => {
    const set = new Set(students.map(s => s.booklet));
    return Array.from(set).filter(b => b && b !== 'A');
  }, [students]);

  const missingMappings = useMemo(() => {
    if (profile.noBooklet) return [];
    return usedNonABooklets.filter(b => !mappings.some(m => m.fromBooklet === b));
  }, [usedNonABooklets, mappings, profile.noBooklet]);

  const canDoQuestionStats = useMemo(() => {
    if (profile.noBooklet) return !!aKey;
    if (!aKey || !qCount) return false;
    if (missingMappings.length > 0) return false;
    return true;
  }, [profile.noBooklet, aKey, qCount, missingMappings]);

  // Calculate Results
  const results = useMemo(() => {
    if (!students.length) return [];
    if (!qCount) return [];

    const keyByBooklet = new Map<string, string>();

    // A key is required for full normalization; but we allow fallback per booklet if mapping missing:
    if (aKey) keyByBooklet.set('A', aKey);

    // If mapping exists and A key exists -> derived keys are authoritative
    ['B', 'C', 'D'].forEach(bk => {
      if (derivedKeys[bk]) keyByBooklet.set(bk, derivedKeys[bk]!);
      else {
        // fallback to entered booklet key if user provided
        const entered = answerKeys.find(k => k.booklet === bk)?.answers;
        if (entered) keyByBooklet.set(bk, entered);
      }
    });

    const validStudents = students.filter(s => s.status !== 'Error');

    return validStudents
      .map(student => {
        const booklet = profile.noBooklet ? 'A' : (student.booklet || 'A');

        // Determine if we can normalize this student to A order
        let normalizedToA: string | undefined = undefined;

        if (booklet === 'A' || profile.noBooklet) {
          normalizedToA = student.answers.padEnd(qCount, ' ').slice(0, qCount);
        } else {
          const map = mappings.find(m => m.fromBooklet === booklet);
          const inv = map ? invertAToOrder(map.aToOrder, qCount) : null;

          if (inv && aKey) {
            const out = new Array<string>(qCount).fill(' ');
            // inv is xToA: for each x index, which A question
            for (let xIdx = 0; xIdx < qCount; xIdx++) {
              const aQ = inv[xIdx];
              const aIdx = aQ - 1;
              out[aIdx] = safeCharAt(student.answers, xIdx);
            }
            normalizedToA = out.join('');
          }
        }

        // Decide which key to use for scoring:
        // - If we have normalizedToA and A key exists -> compare in A order to A key
        // - Else -> compare in booklet order using booklet key (limited mode)
        const compareKeyA = aKey && normalizedToA ? aKey : null;
        const compareKeyBooklet = !compareKeyA ? (keyByBooklet.get(booklet) ?? null) : null;

        let rights = 0, wrongs = 0, empties = 0, invalids = 0;

        const subjectResults = canDoQuestionStats && subjects.length > 0
          ? subjects.map(s => ({ name: s.name, rights: 0, wrongs: 0, empties: 0, net: 0 }))
          : undefined;

        const compareLen = qCount;

        for (let i = 0; i < compareLen; i++) {
          const sAns = compareKeyA ? safeCharAt(normalizedToA!, i) : safeCharAt(student.answers, i);
          const kAns = compareKeyA ? safeCharAt(compareKeyA, i) : safeCharAt(compareKeyBooklet ?? '', i);

          let isRight = false, isWrong = false, isEmpty = false;

          if (isCancelledKeyChar(kAns)) {
            if (scoring.cancelMode === 'correct') isRight = true;
          } else if (sAns === ' ' || sAns === '') {
            isEmpty = true;
          } else if (sAns === '*') {
            invalids++;
            if (scoring.invalidMode === 'wrong') isWrong = true;
          } else if (sAns === kAns) {
            isRight = true;
          } else {
            isWrong = true;
          }

          if (isRight) rights++;
          if (isWrong) wrongs++;
          if (isEmpty) empties++;

          // Subject attribution only when normalized to A is possible
          if (compareKeyA && subjectResults) {
            const qNum = i + 1;
            const subIdx = subjects.findIndex(s => qNum >= s.start && qNum <= s.end);
            if (subIdx !== -1) {
              if (isRight) subjectResults[subIdx].rights++;
              if (isWrong) subjectResults[subIdx].wrongs++;
              if (isEmpty) subjectResults[subIdx].empties++;
            }
          }
        }

        if (subjectResults) {
          subjectResults.forEach(sr => {
            sr.net = sr.rights - (scoring.penalty ? sr.wrongs / 4 : 0);
          });
        }

        const net = rights - (scoring.penalty ? wrongs / 4 : 0);

        // Active questions: only meaningful in A-mode (we know cancelled questions)
        let activeQuestions = qCount;
        if (compareKeyA) {
          activeQuestions = compareKeyA.split('').filter(c => !isCancelledKeyChar(c)).length || qCount;
        } else if (compareKeyBooklet) {
          activeQuestions = compareKeyBooklet.split('').filter(c => !isCancelledKeyChar(c)).length || qCount;
        }

        const score = activeQuestions ? (net / activeQuestions) * scoring.totalScore : 0;

        const result: AnalysisResult = {
          studentId: student.id,
          studentName: student.name,
          booklet,
          rights,
          wrongs,
          empties,
          invalids,
          net,
          score,
          normalizedToA: compareKeyA ? normalizedToA : undefined,
          subjectResults
        };

        return result;
      })
      .filter(Boolean);
  }, [students, qCount, profile.noBooklet, aKey, mappings, derivedKeys, answerKeys, scoring, subjects, canDoQuestionStats]);

  const isStepDone = (stepId: number) => {
    if (stepId === 1) return datContent.trim().length > 0;
    if (stepId === 2) return students.length > 0;
    if (stepId === 3) return !!answerKeys.find(k => k.booklet === 'A')?.answers;
    if (stepId === 4) return profile.noBooklet || missingMappings.length === 0 || mappings.length > 0;
    return true;
  };

  // Controlled navigation + scroll
  const goToStep = (id: number) => {
    setCurrentStep(prev => (prev === id ? 0 : id));
    requestAnimationFrame(() => {
      const btn = stepHeaderRefs.current[id];
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // slight offset
        window.scrollBy({ top: -12, left: 0, behavior: 'smooth' });
      }
    });
  };

  return (
    <PageContainer>
      <div style={{ backgroundColor: '#1e293b' }} className="text-white p-10 mb-8 rounded-none border-l-8 border-[#3498db] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div style={{ backgroundColor: '#3498db' }} className="p-3 text-white font-black text-2xl uppercase tracking-widest shadow-lg">
              OT
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight m-0 text-white drop-shadow-lg">ONLINE TEST SINAV ANALİZİ</h1>
          </div>
          <p className="text-slate-200 max-w-4xl text-lg font-medium leading-relaxed mb-4">
            Hızlı, güvenilir ve tamamen tarayıcı tabanlı optik form analiz sistemi. Adımları takip ederek sonuçlarınızı anında raporlayın.
          </p>
          <div className="bg-slate-800/40 p-3 border-l-4 border-[#3498db] text-xs font-bold text-slate-300 inline-flex items-center gap-3">
            <Info size={16} className="text-[#3498db] shrink-0" />
            <span>Güvenlik Notu: Hiçbir veriniz internete gönderilmez. Tüm analizler tamamen tarayıcınızda yapılır.</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-3 pb-20">
        {STEPS.map(step => (
          <div key={step.id} className="bg-white border-2 border-slate-100 shadow-xl overflow-hidden rounded-sm transition-all duration-300 hover:border-slate-300">
            <button
              ref={el => {
                stepHeaderRefs.current[step.id] = el;
              }}
              onClick={() => goToStep(step.id)}
              className={`w-full flex items-center justify-between p-5 text-left transition-colors ${currentStep === step.id ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-5">
                <div
                  style={currentStep === step.id ? { backgroundColor: '#1e293b', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
                  className="p-3 rounded-none shadow-md transition-colors"
                >
                  {isStepDone(step.id) && currentStep !== step.id ? <CheckCircle size={24} className="text-emerald-500" /> : React.cloneElement(step.icon as any, { size: 24 })}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3498db] mb-0.5">Adım {step.id}</div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">{step.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isStepDone(step.id) && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-wider">Tamamlandı</span>}
                <div className={`transition-transform duration-300 ${currentStep === step.id ? 'rotate-180' : ''}`}>
                  <ChevronRight size={24} className="text-slate-400" />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {currentStep === step.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="border-t border-slate-100"
                >
                  <div className="p-8 bg-white min-h-[300px] border-x-2 border-b-2 border-slate-200">
                    {step.id === 1 && (
                      <Step1DataEntry
                        datContent={datContent}
                        setDatContent={setDatContent}
                        encoding={encoding}
                        setEncoding={setEncoding}
                        detectedQuestionCount={detectedQuestionCount}
                      />
                    )}

                    {step.id === 2 && (
                      <div className="space-y-12">
                        <Step2Profile profile={profile} setProfile={setProfile} />
                        <div className="border-t-4 border-slate-900 pt-12">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                              <Eye size={24} className="text-[#3498db]" /> Veri Ayrıştırma Önizlemesi
                            </h4>
                            <button onClick={() => goToStep(3)} className="bg-[#2ecc71] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#27ae60] transition-all shadow-lg">
                              Dizaynı Kabul Et ve Devam Et
                            </button>
                          </div>
                          <Step2Preview students={students} />
                        </div>
                      </div>
                    )}

                    {step.id === 3 && (
                      <Step3AnswerKey
                        profile={profile}
                        detectedQuestionCount={detectedQuestionCount}
                        answerKeys={answerKeys}
                        setAnswerKeys={setAnswerKeys}
                        qCount={qCount}
                        derivedKeys={derivedKeys}
                        keyCompare={keyCompare}
                        activeBooklet={activeKeyBooklet}
                        setActiveBooklet={setActiveKeyBooklet}
                      />
                    )}

                    {step.id === 4 && (
                      <Step4Mapping
                        profile={profile}
                        qCount={qCount}
                        students={students}
                        mappings={mappings}
                        setMappings={setMappings}
                        answerKeys={answerKeys}
                        setAnswerKeys={setAnswerKeys}
                      />
                    )}

                    {step.id === 5 && <Step5Subjects subjects={subjects} setSubjects={setSubjects} />}

                    {step.id === 6 && <Step6Scoring scoring={scoring} setScoring={setScoring} />}

                    {step.id === 7 && (
                      <Step7Analysis
                        results={results}
                        students={students}
                        subjects={subjects}
                        scoring={scoring}
                        qCount={qCount}
                        canDoQuestionStats={canDoQuestionStats}
                        missingMappings={missingMappings}
                        aKey={aKey}
                      />
                    )}

                    <div className="mt-12 flex justify-end gap-3 border-t pt-8">
                      {step.id > 1 && (
                        <button onClick={() => goToStep(step.id - 1)} className="flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                          <ChevronLeft size={18} /> Önceki Adım
                        </button>
                      )}
                      {step.id < 7 && (
                        <button
                          onClick={() => goToStep(step.id + 1)}
                          className="flex items-center gap-3 px-10 py-4 bg-[#3498db] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#2980b9] shadow-lg hover:shadow-sky-200 transition-all active:scale-95"
                        >
                          Sonraki Adım <ChevronRight size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto mt-12 pb-20">
        <div className="bg-[#f8fafc] border-2 border-dashed border-slate-200 p-8 text-center rounded-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Excel Tabanlı Çözüm mü Arıyorsunuz?</h3>
          <p className="text-slate-500 mb-6">Daha kapsamlı analizler ve offline kullanım için Universal Analiz Excel dosyamızı kullanabilirsiniz.</p>
          <button
            onClick={() => onNavigate('sinav-analizi')}
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
          >
            <FileSpreadsheet size={18} />
            Excel (Universal Analiz) Sayfasına Git
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

// -----------------------------
// DAT parser (kept outside)
// -----------------------------
function parseDat(content: string, profile: Profile, setStudents: (s: StudentRecord[]) => void) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  const parsed: StudentRecord[] = lines.map(line => {
    const safeSub = (start1: number, len?: number) => {
      const start = Math.max(0, (start1 || 1) - 1);
      if (!len) return line.substring(start);
      return line.substring(start, start + len);
    };

    const id = safeSub(profile.idStart, profile.idLen).trim();
    const name = safeSub(profile.nameStart, profile.nameLen).trim();

    const bookletRaw = profile.noBooklet ? 'A' : (safeSub(profile.bookletStart, 1).trim() || 'A');
    const booklet = /^[A-D]$/.test(bookletRaw) ? bookletRaw : 'A';

    const answers = safeSub(profile.answersStart).toUpperCase();

    const messages: string[] = [];
    let status: 'OK' | 'Warning' | 'Error' = 'OK';

    if (!id) {
      status = 'Error';
      messages.push('Öğrenci numarası eksik.');
    } else {
      if (!/^\d+$/.test(id)) {
        status = 'Error';
        messages.push(`Öğrenci numarası sadece rakam olmalıdır: ${id}`);
      }
      if (id.startsWith('0')) {
        status = 'Error';
        messages.push(`Öğrenci numarası 0 ile başlayamaz (kurumsal kural): ${id}`);
      }
    }

    if (!name) {
      if (status !== 'Error') status = 'Warning';
      messages.push('İsim alanı boş.');
    }

    const invalidChars = answers.match(/[^A-E *#]/g);
    if (invalidChars) {
      status = 'Error';
      const uniqueInvalids = [...new Set(invalidChars)].map(char => {
        if (char === '\t') return 'TAB';
        if (char === '\r') return 'CR';
        if (char === '\n') return 'LF';
        if (char.charCodeAt(0) < 32) return `ORD(${char.charCodeAt(0)})`;
        return `'${char}'`;
      });
      messages.push(`Cevaplarda geçersiz karakter bulundu: ${uniqueInvalids.join(', ')}`);
    }

    if (answers.includes('*')) {
      if (status !== 'Error') status = 'Warning';
      messages.push('Çift işaretlenmiş (*) sorular var.');
    }

    if (line.includes('\uFFFD')) {
      if (status !== 'Error') status = 'Warning';
      const msg = 'Kodlama yanlış olabilir (okunmayan karakterler var).';
      if (!messages.includes(msg)) messages.push(msg);
    }

    return { raw: line, id, name, booklet, answers, status, messages };
  });

  setStudents(parsed);
}
