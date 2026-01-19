import React, { useEffect, useMemo, useState } from 'react';
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
  FileSpreadsheet,
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
  Cell,
} from 'recharts';

// --- Types ---

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
  answers: string;
  status: 'OK' | 'Warning' | 'Error';
  messages: string[];
}

interface AnswerKey {
  booklet: string;
  answers: string;
}

interface Mapping {
  fromBooklet: string;
  toBooklet: string; // usually 'A'
  order: number[]; // 1-based indices of 'A' questions
}

interface SubjectRange {
  name: string;
  start: number;
  end: number;
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
  subjectResults: { name: string; rights: number; wrongs: number; empties: number; net: number }[];
  answers: string; // student's answers (A'ya normalize edilmiş olabilir)
}

// --- Constants ---

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
  noBooklet: false,
};

const STEPS = [
  { id: 1, title: 'Veri Girişi', icon: <Upload size={20} />, description: 'DAT dosyasını yükleyin veya yapıştırın.' },
  { id: 2, title: 'Dizayn & Önizleme', icon: <Settings size={20} />, description: 'DAT dosya yapısını tanımlayın ve kontrol edin.' },
  { id: 3, title: 'Cevap Anahtarı', icon: <Key size={20} />, description: 'Doğru cevapları girin.' },
  { id: 4, title: 'Kitapçık/Mapping', icon: <MapIcon size={20} />, description: 'Kitapçık dönüşümlerini ayarlayın.' },
  { id: 5, title: 'Konu Ders sıralaması', icon: <BookOpen size={20} />, description: 'Ders ve konu kapsamlarını belirleyin.' },
  { id: 6, title: 'Puanlama Kriterleri', icon: <Calculator size={20} />, description: 'Puanlama kurallarını ayarlayın.' },
  { id: 7, title: 'Analiz & Rapor', icon: <Download size={20} />, description: 'Sonuçları görün ve indirin.' },
];

interface OnlineTestAnalizProps {
  onNavigate: (page: string) => void;
}

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
  const [scoring, setScoring] = useState({
    totalScore: 100,
    penalty: true,
    cancelMode: 'count',
    invalidMode: 'separate', // 'wrong' | 'separate'
  });

  // Step3: kitapçık tabı reset olmasın (remount olunca A'ya dönmesin)
  const [activeKeyBooklet, setActiveKeyBooklet] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // --- Scroll fix: adım değişince header'a hizala (fazla aşağı kaçmasın) ---
  useEffect(() => {
    if (!currentStep) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`ota-step-${currentStep}`);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90; // header offset
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }, 50);
    return () => window.clearTimeout(t);
  }, [currentStep]);

  // Derived analysis
  const results = useMemo(() => calculateResults(), [students, answerKeys, mappings, subjects, scoring]);

  useEffect(() => {
    localStorage.setItem('online_test_analiz_profile', JSON.stringify(profile));
    if (datContent) parseDat(datContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, datContent]);

  const parseDat = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.replace(/\u0000/g, '')) // null char temizliği
      .filter((line) => line.trim().length > 0);

    const parsed: StudentRecord[] = lines.map((line) => {
      const id = line.substring(profile.idStart - 1, profile.idStart - 1 + profile.idLen).trim();
      const name = line.substring(profile.nameStart - 1, profile.nameStart - 1 + profile.nameLen).trim();

      // noBooklet => herkes A
      const booklet = profile.noBooklet
        ? 'A'
        : (line.substring(profile.bookletStart - 1, profile.bookletStart - 1 + 1).trim() || 'A');

      const answers = line.substring(profile.answersStart - 1).toUpperCase();

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

      // Geçersiz karakter: A-E boşluk * #
      const invalidChars = answers.match(/[^A-E *#]/g);
      if (invalidChars) {
        status = 'Error';
        const uniqueInvalids = [...new Set(invalidChars)].map((char) => {
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

      // Encoding check (replacement char)
      if (line.includes('\uFFFD')) {
        if (status !== 'Error') status = 'Warning';
        const msg = 'Kodlama yanlış olabilir (okunmayan karakterler var).';
        if (!messages.includes(msg)) messages.push(msg);
      }

      return { raw: line, id, name, booklet, answers, status, messages };
    });

    setStudents(parsed);
  };

  function calculateResults(): AnalysisResult[] {
    if (students.length === 0 || answerKeys.length === 0) return [];

    const keyA = answerKeys.find((k) => k.booklet === 'A')?.answers || '';

    const validStudents = students.filter((s) => s.status !== 'Error');
    if (validStudents.length === 0) return [];

    const getKey = (booklet: string) => answerKeys.find((k) => k.booklet === booklet)?.answers || '';

    return validStudents.map((student) => {
      const studentBooklet = student.booklet || 'A';
      const map = studentBooklet !== 'A' ? mappings.find((m) => m.fromBooklet === studentBooklet) : undefined;

      const bookletKey = getKey(studentBooklet);
      const useMappingToA = !!(studentBooklet !== 'A' && map && keyA);

      const targetKey = useMappingToA ? keyA : (bookletKey || keyA);

      // Anahtar yoksa: çökmesin diye boş sonuç
      if (!targetKey || targetKey.length === 0) {
        return {
          studentId: student.id,
          studentName: student.name,
          booklet: studentBooklet,
          rights: 0,
          wrongs: 0,
          empties: 0,
          invalids: 0,
          net: 0,
          score: 0,
          subjectResults: subjects.map((s) => ({ name: s.name, rights: 0, wrongs: 0, empties: 0, net: 0 })),
          answers: student.answers,
        };
      }

      // Öğrenci cevaplarını (gerekirse) A düzenine normalize et
      let studentAnswers = student.answers;

      if (useMappingToA && map) {
        const reordered = new Array(targetKey.length).fill(' ');
        for (let i = 0; i < map.order.length; i++) {
          const aIdx = map.order[i] - 1;
          if (aIdx >= 0 && aIdx < reordered.length) {
            reordered[aIdx] = studentAnswers[i] || ' ';
          }
        }
        studentAnswers = reordered.join('');
      }

      let rights = 0,
        wrongs = 0,
        empties = 0,
        invalids = 0;

      // Subject istatistiği yalnızca A düzeninde anlamlı
      const subjectResults = subjects.map((s) => ({ name: s.name, rights: 0, wrongs: 0, empties: 0, net: 0 }));
      const subjectEnabled = (studentBooklet === 'A') || useMappingToA;

      for (let i = 0; i < targetKey.length; i++) {
        const sAns = studentAnswers[i] || ' ';
        const kAns = targetKey[i];

        let isRight = false,
          isWrong = false,
          isEmpty = false;

        // iptal soru
        if (kAns === ' ' || kAns === '#') {
          if (scoring.cancelMode === 'correct') isRight = true;
        } else if (sAns === ' ') {
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

        if (subjectEnabled && subjects.length > 0) {
          const qNum = i + 1;
          const subIdx = subjects.findIndex((s) => qNum >= s.start && qNum <= s.end);
          if (subIdx !== -1) {
            if (isRight) subjectResults[subIdx].rights++;
            if (isWrong) subjectResults[subIdx].wrongs++;
            if (isEmpty) subjectResults[subIdx].empties++;
          }
        }
      }

      subjectResults.forEach((sr) => {
        sr.net = sr.rights - (scoring.penalty ? sr.wrongs / 4 : 0);
      });

      const net = rights - (scoring.penalty ? wrongs / 4 : 0);
      const activeQuestions = targetKey.split('').filter((c) => c !== ' ' && c !== '#').length;

      // activeQuestions=0 => NaN/Infinity olmasın
      let score = 0;
      if (activeQuestions > 0) {
        score = (net / activeQuestions) * (Number(scoring.totalScore) || 100);
        if (!Number.isFinite(score)) score = 0;
      }

      return {
        studentId: student.id,
        studentName: student.name,
        booklet: studentBooklet,
        rights,
        wrongs,
        empties,
        invalids,
        net,
        score,
        subjectResults,
        answers: studentAnswers,
      };
    });
  }

  // --- Sub-Components (Steps) ---

  const Step2_Profile = () => {
    const exportConfig = () => {
      const data = JSON.stringify(profile, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sınav_Dizaynı_${profile.name}.json`;
      link.click();
      toast.success('Dizayn dışa aktarıldı.');
    };

    const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
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
          <div style={{ backgroundColor: 'white' }} className="p-6 rounded-none shadow-md border-2 border-slate-200 hover:border-[#3498db] transition-colors">
            <label className="block text-xs font-black text-slate-800 mb-3 uppercase tracking-widest">Öğrenci No (ID)</label>
            <div className="flex gap-2 text-slate-900">
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 block mb-1">Başlangıç Karakter</span>
                <input
                  type="number"
                  value={profile.idStart}
                  onChange={(e) => setProfile({ ...profile, idStart: Number(e.target.value) })}
                  className="w-full p-2 border-2 border-slate-300 focus:border-slate-900 outline-none font-black bg-slate-50"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 block mb-1">Karakter Sayısı</span>
                <input
                  type="number"
                  value={profile.idLen}
                  onChange={(e) => setProfile({ ...profile, idLen: Number(e.target.value) })}
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
                  onChange={(e) => setProfile({ ...profile, nameStart: Number(e.target.value) })}
                  className="w-full p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 block mb-1">Karakter Sayısı</span>
                <input
                  type="number"
                  value={profile.nameLen}
                  onChange={(e) => setProfile({ ...profile, nameLen: Number(e.target.value) })}
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
                  onChange={(e) => setProfile({ ...profile, noBooklet: e.target.checked })}
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
                  onChange={(e) => setProfile({ ...profile, bookletStart: Number(e.target.value) })}
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
              onChange={(e) => setProfile({ ...profile, answersStart: Number(e.target.value) })}
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
              <strong>Kitapçık Türü:</strong> Eğer DAT dosyasında belirtilmemişse veya boşsa, tüm öğrenciler otomatik olarak <strong>A kitapçığı</strong> olarak değerlendirilir.
            </li>
            <li>Dizaynınızı JSON dosyası olarak kaydedip daha sonra tekrar yükleyebilirsiniz.</li>
          </ul>
        </div>
      </div>
    );
  };

  const Step1_DataEntry = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">DAT İçeriği</h3>
        <div className="flex items-center gap-3">
          {students.length > 0 && (
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              Bu sınavda {students[0].answers.length} soru tespit edildi.
            </div>
          )}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kodlama:</span>
          <select
            value={encoding}
            onChange={(e) => {
              try {
                setEncoding(e.target.value);
                new TextDecoder(e.target.value); // destek test
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
        onChange={(e) => setDatContent(e.target.value)}
      />

      <div className="flex gap-4">
        <label className="flex-1 cursor-pointer bg-slate-900 text-white p-5 rounded-none text-center font-black uppercase tracking-widest hover:bg-black transition shadow-xl active:scale-[0.98]">
          <Upload size={24} className="inline mr-3" /> Dosyadan Yükle (.dat / .txt)
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (re) => {
                const text = re.target?.result as string;
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

  const Step2_Preview = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'OK' | 'Warning' | 'Error'>('all');
    const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

    const filteredStudents = useMemo(() => {
      return students.filter((s) => {
        const matchesSearch =
          searchTerm === '' ||
          s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    }, [students, searchTerm, statusFilter]);

    const errorCount = students.filter((s) => s.status === 'Error').length;
    const warningCount = students.filter((s) => s.status === 'Warning').length;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="ID veya isim ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border'}`}
            >
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
              className={`px-3 py-1 text-xs font-bold rounded ${
                statusFilter === 'Warning' ? 'bg-amber-500 text-white' : 'bg-white border text-amber-600'
              }`}
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
                    className={`hover:bg-slate-50 border-b last:border-0 cursor-pointer ${
                      s.status === 'Error' ? 'bg-rose-50' : s.status === 'Warning' ? 'bg-amber-50' : ''
                    }`}
                  >
                    <td className="p-3">{s.id}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">{s.booklet}</td>
                    <td className="p-3">{s.answers.length}</td>
                    <td className="p-3 font-mono text-xs">{s.answers.substring(0, 10)}...</td>
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
  };

  const Step3_AnswerKey = () => {
    const activeBooklet = activeKeyBooklet;
    const setActiveBooklet = setActiveKeyBooklet;

    const currentKey = answerKeys.find((k) => k.booklet === activeBooklet)?.answers || '';
    const isNoBooklet = profile.noBooklet;

    const updateKey = (booklet: string, val: string) => {
      const cleanVal = val.toUpperCase().replace(/[^A-E *#]/g, '');
      const otherKeys = answerKeys.filter((k) => k.booklet !== booklet);
      setAnswerKeys([...otherKeys, { booklet, answers: cleanVal }]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, booklet: string) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        const text = (re.target?.result as string) || '';
        updateKey(booklet, text.trim());
        toast.success(`${booklet} kitapçığı yüklendi.`);
      };
      reader.readAsText(file);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {(isNoBooklet ? (['A'] as const) : (['A', 'B', 'C', 'D'] as const)).map((bk) => (
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
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800">
              {activeBooklet} Kitapçığı Cevapları
              {activeBooklet === 'A' && isNoBooklet && (
                <span className="text-xs font-normal text-slate-400 ml-2">(Kitapçık türü belirtilmediyse bunu kullanın)</span>
              )}
            </h4>
            <div className="flex gap-2">
              <label className="cursor-pointer bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-semibold hover:bg-slate-200 border">
                <Upload size={14} className="inline mr-1" /> Dosyadan Yükle
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, activeBooklet)} />
              </label>
              <button
                onClick={() => updateKey(activeBooklet, '')}
                className="bg-rose-50 text-rose-600 px-3 py-1 rounded text-xs font-semibold hover:bg-rose-100 border border-rose-100"
              >
                Temizle
              </button>
            </div>
          </div>

          <textarea
            className="w-full h-32 p-4 font-mono text-xl border rounded bg-slate-50 text-slate-800 tracking-[0.2em] focus:ring-2 focus:ring-[#1ABC9C] outline-none"
            placeholder="Örn: ABCDEABCDE..."
            onChange={(e) => updateKey(activeBooklet, e.target.value)}
            value={currentKey}
          />

          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {currentKey.split('').map((char, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold">{idx + 1}</span>
                <div className={`w-8 h-8 flex items-center justify-center font-bold border rounded ${char === ' ' || char === '#' ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-700'}`}>
                  {char}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 text-xs font-semibold text-slate-500 pt-4 border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#1ABC9C] rounded-full"></div>
              <span>Puanlanan Soru: {currentKey.split('').filter((c) => c !== ' ' && c !== '#').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
              <span>İptal/Boş: {currentKey.split('').filter((c) => c === ' ' || c === '#').length}</span>
            </div>
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
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const Step4_Mapping = () => {
    const [bulkText, setBulkText] = useState('');
    const [activeFrom, setActiveFrom] = useState<'B' | 'C' | 'D'>('B');

    const currentMapping = mappings.find((m) => m.fromBooklet === activeFrom);

    const applyBulk = () => {
      const numbers = bulkText
        .trim()
        .split(/[\s,\t]+/)
        .filter((x) => x)
        .map((x) => Number(x));

      if (numbers.length === 0 || numbers.some((n) => !Number.isFinite(n) || n <= 0)) {
        toast.error('Geçersiz veri.');
        return;
      }

      const keyA = answerKeys.find((k) => k.booklet === 'A')?.answers || '';
      if (keyA && numbers.length !== keyA.length) {
        toast.warning(`Uyarı: Eşleştirme uzunluğu (${numbers.length}) A anahtar uzunluğu (${keyA.length}) ile aynı değil.`);
      }

      const otherMappings = mappings.filter((m) => m.fromBooklet !== activeFrom);
      setMappings([...otherMappings, { fromBooklet: activeFrom, toBooklet: 'A', order: numbers }]);
      toast.success(`${activeFrom} -> A eşleştirmesi güncellendi.`);
      setBulkText('');
    };

    const booklets: Array<'B' | 'C' | 'D'> = ['B', 'C', 'D'];

    return (
      <div className="space-y-6">
        <div className="bg-amber-50 p-4 border border-amber-200 rounded text-amber-800 text-sm flex gap-3">
          <Info size={20} className="shrink-0" />
          <p>
            Eğer sınavınız <strong>tek kitapçık</strong> türü ise (sadece A) bu adımı <strong>atlayabilirsiniz</strong>. Farklı kitapçıklar varsa, her sorunun A kitapçığındaki hangi soruya denk geldiğini buraya girin.
          </p>
        </div>

        <div className="flex gap-2">
          {booklets.map((b) => (
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
            {activeFrom} → A Eşleştirmesi
          </h4>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase">Toplu Eşleştirme Yapıştır</label>
            <textarea
              className="w-full h-32 p-4 font-mono text-sm border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-800 outline-none transition-all"
              placeholder="Örn: 5, 12, 1, 8... (A kitapçığındaki soru numaralarını aralarına boşluk veya virgül koyarak yazın)"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button onClick={applyBulk} className="bg-emerald-600 text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">
              Eşleştirmeyi Uygula
            </button>
          </div>

          {currentMapping && (
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 pt-4 border-t">
              {currentMapping.order.map((aNum, idx) => (
                <div key={idx} className="bg-slate-50 p-2 border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-400 font-bold mb-1">
                    {activeFrom} {idx + 1}
                  </div>
                  <div className="font-extrabold text-slate-800">A {aNum}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Step5_Subjects = () => {
    const [newName, setNewName] = useState('');
    const [newStart, setNewStart] = useState(1);
    const [newEnd, setNewEnd] = useState(10);

    const addSubject = () => {
      if (!newName.trim()) {
        toast.error('Ders/Konu adı boş olamaz.');
        return;
      }
      if (newStart <= 0 || newEnd <= 0 || newEnd < newStart) {
        toast.error('Soru aralığı geçersiz.');
        return;
      }
      setSubjects([...subjects, { name: newName.trim(), start: newStart, end: newEnd }]);
      setNewName('');
    };

    const removeSubject = (idx: number) => setSubjects(subjects.filter((_, i) => i !== idx));

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 p-6 border-2 border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Ders / Konu Adı</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border-2 border-white outline-none focus:border-slate-800 font-bold"
              placeholder="Örn: Anatomi"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Başlangıç Soru</label>
            <input
              type="number"
              value={newStart}
              onChange={(e) => setNewStart(Number(e.target.value))}
              className="w-full p-3 border-2 border-white outline-none focus:border-slate-800 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Bitiş Soru</label>
            <input
              type="number"
              value={newEnd}
              onChange={(e) => setNewEnd(Number(e.target.value))}
              className="w-full p-3 border-2 border-white outline-none focus:border-slate-800 font-bold"
            />
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
                  <div className="text-xs text-slate-400 font-bold">A Kitapçığı Soru Aralığı: {s.start} - {s.end}</div>
                </div>
              </div>
              <button onClick={() => removeSubject(i)} className="text-rose-500 hover:bg-rose-50 p-2 rounded transition-colors">
                <XCircle size={20} />
              </button>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic bg-white border-2 border-dashed border-slate-100">Henüz ders tanımlanmadı.</div>
          )}
        </div>
      </div>
    );
  };

  const Step7_Analysis = () => {
    const sortedResults = useMemo(() => [...results].sort((a, b) => b.score - a.score), [results]);
    const topCount = Math.ceil(results.length * 0.27) || 1;
    const topGroup = sortedResults.slice(0, topCount);
    const bottomGroup = sortedResults.slice(-topCount);

    const missingMappings = useMemo(() => {
      const usedBooklets = Array.from(new Set(students.map((s) => s.booklet))).filter((b) => b !== 'A');
      return usedBooklets.filter((b) => !mappings.some((m) => m.fromBooklet === b));
    }, [students, mappings]);

    const questionStats = useMemo(() => {
      if (results.length === 0 || answerKeys.length === 0) return [];
      if (missingMappings.length > 0) return []; // A düzeni bozulur

      const refKey = answerKeys.find((k) => k.booklet === 'A');
      if (!refKey) return [];

      const stats: any[] = [];
      const ansLen = refKey.answers.length;

      for (let i = 0; i < ansLen; i++) {
        const correctAns = refKey.answers[i];
        if (correctAns === ' ' || correctAns === '#') continue;

        const distributions: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, ' ': 0, '*': 0 };
        let correctCount = 0;
        let topCorrect = 0;
        let bottomCorrect = 0;

        results.forEach((r) => {
          const ans = r.answers[i] || ' ';
          distributions[ans] = (distributions[ans] || 0) + 1;
          if (ans === correctAns) correctCount++;
        });

        topGroup.forEach((r) => {
          if (r.answers[i] === correctAns) topCorrect++;
        });
        bottomGroup.forEach((r) => {
          if (r.answers[i] === correctAns) bottomCorrect++;
        });

        const diffIndex = correctCount / results.length;
        const discIndex = (topCorrect - bottomCorrect) / topCount;

        let diffText = '';
        if (diffIndex >= 0.85) diffText = 'Çok Kolay';
        else if (diffIndex >= 0.7) diffText = 'Kolay';
        else if (diffIndex >= 0.4) diffText = 'Orta';
        else if (diffIndex >= 0.25) diffText = 'Zor';
        else diffText = 'Çok Zor';

        let discText = '';
        if (discIndex >= 0.4) discText = 'Mükemmel Ayırıcı';
        else if (discIndex >= 0.3) discText = 'İyi Ayırıcı';
        else if (discIndex >= 0.2) discText = 'Zayıf (Düzeltilmeli)';
        else discText = 'Çok Zayıf (Hatalı/Ayırıcı Değil)';

        const evalText = `${discText} (${diffText})`;

        stats.push({
          number: i + 1,
          correctAns,
          diffIndex,
          discIndex,
          evalText,
          distributions,
        });
      }

      return stats;
    }, [results, answerKeys, topGroup, bottomGroup, missingMappings]);

    // FIX: undefined.count çökmesi olmasın + totalScore'a göre histogram
    const scoreData = useMemo(() => {
      const maxScore = Number(scoring.totalScore) || 100;

      const labels = [
        `0-${Math.round(maxScore * 0.2)}`,
        `${Math.round(maxScore * 0.2)}-${Math.round(maxScore * 0.4)}`,
        `${Math.round(maxScore * 0.4)}-${Math.round(maxScore * 0.6)}`,
        `${Math.round(maxScore * 0.6)}-${Math.round(maxScore * 0.8)}`,
        `${Math.round(maxScore * 0.8)}-${Math.round(maxScore)}`,
      ];

      const ranges = labels.map((name) => ({ name, count: 0 }));

      results.forEach((r) => {
        const s = Number(r.score);
        if (!Number.isFinite(s)) return;
        const ratio = maxScore > 0 ? s / maxScore : 0;
        const rawIdx = Math.floor(ratio * 5);
        const idx = Math.max(0, Math.min(4, rawIdx));
        ranges[idx].count++;
      });

      return ranges;
    }, [results, scoring.totalScore]);

    const statsData = useMemo(
      () => [
        { name: 'Doğru', value: results.reduce((acc, r) => acc + r.rights, 0), color: '#10b981' },
        { name: 'Yanlış', value: results.reduce((acc, r) => acc + r.wrongs, 0), color: '#ef4444' },
        { name: 'Boş', value: results.reduce((acc, r) => acc + r.empties, 0), color: '#94a3b8' },
      ],
      [results]
    );

    return (
      <div className="space-y-8">
        {missingMappings.length > 0 && (
          <div className="bg-rose-50 p-6 border-2 border-rose-200 rounded text-rose-800 space-y-3">
            <div className="flex items-center gap-3 font-black uppercase tracking-widest text-sm">
              <AlertTriangle size={24} /> Eksik Kitapçık Eşleştirmesi!
            </div>
            <p className="text-sm">
              Sınavda kullanılan <strong>{missingMappings.join(', ')}</strong> kitapçıkları için henüz bir eşleştirme (mapping) tanımlamadınız.
              <br />
              <strong>Soru analizi ve A düzeninde raporlar</strong> için lütfen <strong>Adım 4</strong>'e giderek bu kitapçıkların A kitapçığına göre dizilimini girin.
              <br />
              (Not: Puan hesapları artık kitapçık anahtarı varsa mapping olmadan da çalışır.)
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
            <div className="text-4xl font-extrabold">{(results.reduce((acc, r) => acc + r.score, 0) / (results.length || 1)).toFixed(2)}</div>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-amber-500 text-white p-6 rounded-none shadow-lg border-b-4 border-amber-700">
            <div className="text-sm opacity-80 font-bold uppercase tracking-tight">En Yüksek</div>
            <div className="text-4xl font-extrabold">{results.length > 0 ? Math.max(...results.map((r) => r.score)).toFixed(1) : 0}</div>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-rose-500 text-white p-6 rounded-none shadow-lg border-b-4 border-rose-700">
            <div className="text-sm opacity-80 font-bold uppercase tracking-tight">En Düşük</div>
            <div className="text-4xl font-extrabold">{results.length > 0 ? Math.min(...results.map((r) => r.score)).toFixed(1) : 0}</div>
          </motion.div>
        </div>

        {subjects.length > 0 && (
          <div className="bg-white p-6 border shadow-sm">
            <h4 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm">Ders/Konu Bazlı Başarı Oranları</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub, idx) => {
                const subStats = results.map((r) => r.subjectResults[idx]);
                const avgNet = subStats.reduce((acc, s) => acc + (s?.net || 0), 0) / (results.length || 1);
                const totalQ = sub.end - sub.start + 1;
                return (
                  <div key={idx} className="p-4 bg-slate-50 border-l-4 border-[#3498db]">
                    <div className="font-black text-slate-800 text-xs mb-1 uppercase tracking-tight">{sub.name}</div>
                    <div className="text-2xl font-black text-slate-900">
                      {avgNet.toFixed(2)} <small className="text-xs text-slate-400 font-bold">NET (Ort)</small>
                    </div>
                    <div className="w-full bg-white h-2 mt-2 rounded-full overflow-hidden">
                      <div className="bg-[#3498db] h-full" style={{ width: `${(avgNet / totalQ) * 100}%` }}></div>
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
                let csv = 'sep=;\nNo;Doğru;A;B;C;D;E;Gecersiz (*);Zorluk (P);Ayır. (D);Değerlendirme\n';
                questionStats.forEach((qs) => {
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
                    {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                      <td key={opt} className={`p-3 text-center ${qs.correctAns === opt ? 'bg-emerald-50 font-black' : 'text-slate-400'}`}>
                        {qs.distributions[opt] || 0}
                      </td>
                    ))}
                    <td className="p-3 text-center text-slate-400">{(qs.distributions[' '] || 0) + (qs.distributions['*'] || 0)}</td>
                    <td className={`p-3 text-center font-bold ${qs.diffIndex < 0.3 ? 'text-rose-600' : qs.diffIndex > 0.7 ? 'text-emerald-600' : ''}`}>
                      {qs.diffIndex.toFixed(2)}
                    </td>
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
                    ? "Eksik kitapçık eşleştirmeleri nedeniyle soru analizi gösterilemiyor. Lütfen Adım 4'ü tamamlayın."
                    : 'Soru analizi için veri bekleniyor.'}
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
                  results.forEach((r) => {
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

              <button
                onClick={() => {
                  if (results.length === 0) return;
                  const refKey = answerKeys.find((k) => k.booklet === 'A');
                  if (!refKey) return;
                  const qCount = refKey.answers.length;

                  let csv = 'sep=;\nID;Ad Soyad;Kitapçık;';
                  for (let i = 1; i <= qCount; i++) csv += `S${i};`;
                  csv += '\n';

                  results.forEach((r) => {
                    csv += `${r.studentId};${r.studentName};${r.booklet};`;
                    for (let i = 0; i < qCount; i++) csv += `${r.answers[i] || ' '};`;
                    csv += '\n';
                  });

                  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `Cevap_Matrisi_${new Date().toLocaleDateString('tr-TR')}.csv`);
                  link.click();
                  toast.success('Cevap matrisi indirildi.');
                }}
                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-none font-bold text-xs uppercase hover:bg-amber-700 transition shadow-md"
              >
                <Download size={14} /> Cevap Matrisi
              </button>

              <button
                onClick={() => {
                  let csv = 'sep=;\nID;Ad Soyad;Durum;Mesajlar\n';
                  students
                    .filter((s) => s.status !== 'OK')
                    .forEach((s) => {
                      csv += `${s.id};${s.name};${s.status};${s.messages.join(' | ')}\n`;
                    });

                  if (csv.split('\n').length <= 2) {
                    toast.info('Hatalı kayıt bulunamadı.');
                    return;
                  }

                  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `Hata_Raporu_${new Date().toLocaleDateString('tr-TR')}.csv`);
                  link.click();
                  toast.success('Hata raporu indirildi.');
                }}
                className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-none font-bold text-xs uppercase hover:bg-rose-700 transition shadow-md"
              >
                <Download size={14} /> Hata Raporu
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
          </div>
        </div>
      </div>
    );
  };

  const isStepDone = (stepId: number) => {
    if (stepId === 1) return datContent.length > 0;
    if (stepId === 2) return students.length > 0;
    if (stepId === 3) return answerKeys.length > 0;
    return true;
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
        {STEPS.map((step) => (
          <div id={`ota-step-${step.id}`} key={step.id} className="bg-white border-2 border-slate-100 shadow-xl overflow-hidden rounded-sm transition-all duration-300 hover:border-slate-300">
            <button
              onClick={() => setCurrentStep(currentStep === step.id ? 0 : step.id)}
              className={`w-full flex items-center justify-between p-5 text-left transition-colors ${currentStep === step.id ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-5">
                <div
                  style={currentStep === step.id ? { backgroundColor: '#1e293b', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
                  className="p-3 rounded-none shadow-md transition-colors"
                >
                  {isStepDone(step.id) && currentStep !== step.id ? <CheckCircle size={24} className="text-emerald-500" /> : React.cloneElement(step.icon as React.ReactElement<any>, { size: 24 })}
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
                    {step.id === 1 && <Step1_DataEntry />}

                    {step.id === 2 && (
                      <div className="space-y-12">
                        <Step2_Profile />
                        <div className="border-t-4 border-slate-900 pt-12">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                              <Eye size={24} className="text-[#3498db]" /> Veri Ayrıştırma Önizlemesi
                            </h4>
                            <button
                              onClick={() => setCurrentStep(3)}
                              className="bg-[#2ecc71] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#27ae60] transition-all shadow-lg"
                            >
                              Dizaynı Kabul Et ve Devam Et
                            </button>
                          </div>
                          <Step2_Preview />
                        </div>
                      </div>
                    )}

                    {step.id === 3 && <Step3_AnswerKey />}
                    {step.id === 4 && <Step4_Mapping />}
                    {step.id === 5 && <Step5_Subjects />}

                    {step.id === 6 && (
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
                              onChange={(e) => setScoring({ ...scoring, totalScore: Number(e.target.value) })}
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
                                  onChange={(e) => setScoring({ ...scoring, penalty: e.target.checked })}
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
                    )}

                    {step.id === 7 && <Step7_Analysis />}

                    <div className="mt-12 flex justify-end gap-3 border-t pt-8">
                      {step.id > 1 && (
                        <button
                          onClick={() => setCurrentStep(step.id - 1)}
                          className="flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <ChevronLeft size={18} /> Önceki Adım
                        </button>
                      )}
                      {step.id < 7 && (
                        <button
                          onClick={() => setCurrentStep(step.id + 1)}
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
