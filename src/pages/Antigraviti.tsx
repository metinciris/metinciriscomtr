import React, { useState, useEffect, useMemo } from 'react';
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
    Filter,
    Info,
    Activity
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
    subjectResults: { name: string, rights: number, wrongs: number, empties: number, net: number }[];
    answers: string; // student's actual answers
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
    answersStart: 32
};

const STEPS = [
    { id: 1, title: 'Cevap kağıdı dizaynı', icon: <Settings size={20} />, description: 'DAT dosya yapısını tanımlayın.' },
    { id: 2, title: 'Veri Girişi', icon: <Upload size={20} />, description: 'DAT dosyasını yükleyin veya yapıştırın.' },
    { id: 3, title: 'Önizleme', icon: <Eye size={20} />, description: 'Yüklenen verileri kontrol edin.' },
    { id: 4, title: 'Cevap Anahtarı', icon: <Key size={20} />, description: 'Doğru cevapları girin.' },
    { id: 5, title: 'Kitapçık/Mapping', icon: <MapIcon size={20} />, description: 'Kitapçık dönüşümlerini ayarlayın.' },
    { id: 6, title: 'Konu Ders sıralaması', icon: <BookOpen size={20} />, description: 'Ders ve konu kapsamlarını belirleyin.' },
    { id: 7, title: 'Puanlama', icon: <Calculator size={20} />, description: 'Puanlama kurallarını ayarlayın.' },
    { id: 8, title: 'Analiz & Rapor', icon: <Download size={20} />, description: 'Sonuçları görün ve indirin.' }
];

// --- Main Component ---

export function Antigraviti() {
    const [currentStep, setCurrentStep] = useState(1);
    const [profile, setProfile] = useState<Profile>(() => {
        const saved = localStorage.getItem('antigraviti_profile');
        return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    });
    const [datContent, setDatContent] = useState('');
    const [encoding, setEncoding] = useState('UTF-8');
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [subjects, setSubjects] = useState<SubjectRange[]>([]);
    const [scoring, setScoring] = useState({ totalScore: 100, penalty: true, cancelMode: 'count' }); // count: sayma, correct: doğru kabul et
    const [studentList, setStudentList] = useState<Map<string, string>>(new Map()); // ID -> Name comparison list

    // Derived analysis
    const results = useMemo(() => calculateResults(), [students, answerKeys, mappings, subjects, scoring]);

    useEffect(() => {
        localStorage.setItem('antigraviti_profile', JSON.stringify(profile));
    }, [profile]);

    // --- Handlers ---

    const handleNext = () => currentStep < 8 && setCurrentStep(prev => prev + 1);
    const handleBack = () => currentStep > 1 && setCurrentStep(prev => prev - 1);

    const parseDat = (content: string) => {
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
        const parsed: StudentRecord[] = lines.map(line => {
            const id = line.substring(profile.idStart - 1, profile.idStart - 1 + profile.idLen).trim();
            const name = line.substring(profile.nameStart - 1, profile.nameStart - 1 + profile.nameLen).trim();
            const booklet = line.substring(profile.bookletStart - 1, profile.bookletStart - 1 + profile.bookletLen).trim() || 'A';
            const answers = line.substring(profile.answersStart - 1).toUpperCase();

            const messages: string[] = [];
            let status: 'OK' | 'Warning' | 'Error' = 'OK';

            if (!id) {
                status = 'Error';
                messages.push('Öğrenci numarası eksik.');
            }
            if (!name) {
                status = 'Warning';
                messages.push('İsim alanı boş.');
            }
            if (answers.includes('*')) {
                messages.push('Çift işaretlenmiş (*) sorular var.');
            }

            return { raw: line, id, name, booklet, answers, status, messages };
        });
        setStudents(parsed);
    };

    function calculateResults(): AnalysisResult[] {
        if (students.length === 0 || answerKeys.length === 0) return [];

        const refKey = answerKeys.find(k => k.booklet === 'A') || answerKeys[0];
        if (!refKey) return [];

        return students.map(student => {
            let studentAnswers = student.answers;
            const studentKey = answerKeys.find(k => k.booklet === student.booklet) || refKey;

            // If we have mapping and student is not in A, we might need to reorder or just compare with their own booklet key
            // The rule: şıklar değişmez, soru sırası değişir.
            // So if we have a mapping for booklet B to A, we map student's answers in B to A's order, then compare with A's key.

            let rights = 0, wrongs = 0, empties = 0, invalids = 0;
            const subResults: any[] = [];

            // Comparison logic
            const targetAnswers = studentKey.answers;
            for (let i = 0; i < targetAnswers.length; i++) {
                const sAns = studentAnswers[i] || ' ';
                const kAns = targetAnswers[i];

                if (kAns === ' ' || kAns === '#') { // Cancelled question
                    if (scoring.cancelMode === 'correct') rights++;
                    continue;
                }

                if (sAns === ' ') empties++;
                else if (sAns === '*') invalids++;
                else if (sAns === kAns) rights++;
                else wrongs++;
            }

            const net = rights - (scoring.penalty ? wrongs / 4 : 0);
            const activeQuestions = targetAnswers.split('').filter(c => c !== ' ' && c !== '#').length;
            const score = (net / activeQuestions) * scoring.totalScore;

            return {
                studentId: student.id,
                studentName: student.name,
                booklet: student.booklet,
                rights, wrongs, empties, invalids, net, score,
                subjectResults: [],
                answers: studentAnswers
            };
        });
    }

    // --- Sub-Components (Steps) ---

    const Step1_Profile = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                    style={{ backgroundColor: 'white' }}
                    className="p-6 rounded-none shadow-md border-2 border-slate-200 hover:border-[#3498db] transition-colors"
                >
                    <label className="block text-xs font-black text-slate-800 mb-3 uppercase tracking-widest">Öğrenci No (ID)</label>
                    <div className="flex gap-2 text-slate-900">
                        <input type="number" value={profile.idStart} onChange={e => setProfile({ ...profile, idStart: Number(e.target.value) })} className="w-24 p-2 border-2 border-slate-300 focus:border-slate-900 outline-none font-black bg-slate-50" placeholder="Başla" />
                        <span className="self-center font-bold">/</span>
                        <input type="number" value={profile.idLen} onChange={e => setProfile({ ...profile, idLen: Number(e.target.value) })} className="w-24 p-2 border-2 border-slate-300 focus:border-slate-900 outline-none font-black bg-slate-50" placeholder="Boy" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-none shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-colors">
                    <label className="block text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">İsim Soyad</label>
                    <div className="flex gap-2 text-slate-800">
                        <input type="number" value={profile.nameStart} onChange={e => setProfile({ ...profile, nameStart: Number(e.target.value) })} className="w-24 p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50" />
                        <span className="self-center font-bold">/</span>
                        <input type="number" value={profile.nameLen} onChange={e => setProfile({ ...profile, nameLen: Number(e.target.value) })} className="w-24 p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-none shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-colors">
                    <label className="block text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">Kitapçık</label>
                    <div className="flex gap-2 text-slate-800">
                        <input type="number" value={profile.bookletStart} onChange={e => setProfile({ ...profile, bookletStart: Number(e.target.value) })} className="w-24 p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50" />
                        <span className="self-center font-bold">/</span>
                        <input type="number" value={profile.bookletLen} onChange={e => setProfile({ ...profile, bookletLen: Number(e.target.value) })} className="w-24 p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-none shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-colors">
                    <label className="block text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">Cevap Başlangıcı</label>
                    <input type="number" value={profile.answersStart} onChange={e => setProfile({ ...profile, answersStart: Number(e.target.value) })} className="w-full p-2 border-2 border-slate-200 focus:border-slate-800 outline-none font-bold bg-slate-50" />
                </div>
            </div>

            <div className="bg-amber-50 p-4 rounded border border-amber-200 text-amber-800 text-sm">
                <Info className="inline-block mr-2" size={16} />
                Not: Pozisyonlar 1'den başlar (Excel mantığı).
            </div>
        </div>
    );

    const Step2_DataEntry = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">DAT İçeriği</h3>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kodlama:</span>
                    <select value={encoding} onChange={e => setEncoding(e.target.value)} className="p-2 border-2 border-slate-200 bg-white rounded-none font-bold text-slate-800 focus:border-slate-800 outline-none">
                        <option value="UTF-8">UTF-8</option>
                        <option value="ISO-8859-9">Windows-1254 (TR)</option>
                    </select>
                </div>
            </div>
            <textarea
                className="w-full h-80 p-6 font-mono text-sm border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-800 text-slate-900 outline-none transition-all shadow-inner"
                placeholder="DAT dosyası içeriğini buraya yapıştırın veya dosyayı sürükleyin..."
                value={datContent}
                onChange={e => {
                    setDatContent(e.target.value);
                    parseDat(e.target.value);
                }}
            />
            <div className="flex gap-4">
                <label className="flex-1 cursor-pointer bg-slate-900 text-white p-5 rounded-none text-center font-black uppercase tracking-widest hover:bg-black transition shadow-xl active:scale-[0.98]">
                    <Upload size={24} className="inline mr-3" /> Dosyadan Yükle (.dat / .txt)
                    <input type="file" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (re) => {
                            const text = re.target?.result as string;
                            setDatContent(text);
                            parseDat(text);
                        };
                        // In a real app we'd use encoding here
                        reader.readAsText(file, encoding);
                    }} />
                </label>
            </div>
        </div>
    );

    const Step3_Preview = () => (
        <div className="space-y-4">
            <div className="bg-white rounded-none border-2 border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead style={{ backgroundColor: '#1e293b' }} className="text-white">
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
                            {students.map((s, i) => (
                                <tr key={i} className="hover:bg-slate-50 border-b last:border-0 cursor-pointer">
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
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">Veri bulunamadı. Lütfen DAT yükleyin.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <p className="text-sm text-slate-500 italic">* Hata varsa, lütfen DAT dosyasını düzelterek yeniden yükleyin. Sistem üzerinden düzenleme yapılamaz.</p>
        </div>
    );

    const Step4_AnswerKey = () => {
        const [activeBooklet, setActiveBooklet] = useState('A');
        const currentKey = answerKeys.find(k => k.booklet === activeBooklet)?.answers || '';

        const updateKey = (booklet: string, val: string) => {
            const cleanVal = val.toUpperCase().replace(/[^A-E *#]/g, '');
            const otherKeys = answerKeys.filter(k => k.booklet !== booklet);
            setAnswerKeys([...otherKeys, { booklet, answers: cleanVal }]);
        };

        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, booklet: string) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                const text = re.target?.result as string;
                // Simple parsing: if DAT, look for a specific ID or just take the first line's answers
                // For now, assume it's a plain text/CSV with answers
                updateKey(booklet, text.trim());
                toast.success(`${booklet} kitapçığı yüklendi.`);
            };
            reader.readAsText(file);
        };

        return (
            <div className="space-y-6">
                <div className="flex flex-wrap gap-2 mb-4">
                    {['A', 'B', 'C', 'D'].map(bk => (
                        <button
                            key={bk}
                            onClick={() => setActiveBooklet(bk)}
                            className={`px-6 py-2 font-bold transition-all border-b-4 ${activeBooklet === bk
                                ? 'bg-slate-800 text-white border-[#1ABC9C]'
                                : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`}
                        >
                            {bk} Kitapçığı
                        </button>
                    ))}
                </div>

                <div className="bg-white p-6 rounded border shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800">{activeBooklet} Kitapçığı Cevapları</h4>
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
                        onChange={e => updateKey(activeBooklet, e.target.value)}
                        value={currentKey}
                    />

                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {currentKey.split('').map((char, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <span className="text-[10px] text-slate-400 font-bold">{idx + 1}</span>
                                <div className={`w-8 h-8 flex items-center justify-center font-bold border rounded ${char === ' ' || char === '#' ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-700'
                                    }`}>
                                    {char}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 text-xs font-semibold text-slate-500 pt-4 border-t">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-[#1ABC9C] rounded-full"></div>
                            <span>Puanlanan Soru: {currentKey.split('').filter(c => c !== ' ' && c !== '#').length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                            <span>İptal/Boş: {currentKey.split('').filter(c => c === ' ' || c === '#').length}</span>
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
                            <li><strong>#</strong> veya <strong>boşluk</strong> karakterleri soruyu iptal eder.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const Step8_Analysis = () => {
        const scoreData = useMemo(() => {
            const ranges = [
                { name: '0-20', count: 0 },
                { name: '20-40', count: 0 },
                { name: '40-60', count: 0 },
                { name: '60-80', count: 0 },
                { name: '80-100', count: 0 },
            ];
            results.forEach(r => {
                const idx = Math.min(Math.floor(r.score / 20), 4);
                ranges[idx].count++;
            });
            return ranges;
        }, [results]);

        const statsData = useMemo(() => [
            { name: 'Doğru', value: results.reduce((acc, r) => acc + r.rights, 0), color: '#10b981' },
            { name: 'Yanlış', value: results.reduce((acc, r) => acc + r.wrongs, 0), color: '#ef4444' },
            { name: 'Boş', value: results.reduce((acc, r) => acc + r.empties, 0), color: '#94a3b8' },
        ], [results]);

        return (
            <div className="space-y-8">
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
                        <div className="text-4xl font-extrabold">{results.length > 0 ? Math.max(...results.map(r => r.score)).toFixed(1) : 0}</div>
                    </motion.div>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-rose-500 text-white p-6 rounded-none shadow-lg border-b-4 border-rose-700">
                        <div className="text-sm opacity-80 font-bold uppercase tracking-tight">En Düşük</div>
                        <div className="text-4xl font-extrabold">{results.length > 0 ? Math.min(...results.map(r => r.score)).toFixed(1) : 0}</div>
                    </motion.div>
                </div>

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
                    <div className="p-4 border-b bg-slate-50 flex flex-wrap justify-between items-center gap-4">
                        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm italic">Öğrenci Detaylı Analiz Paneli</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    let csv = "ID;Ad Soyad;Kitapçık;Doğru;Yanlış;Boş;İptal;Net;Puan\n";
                                    results.forEach(r => {
                                        csv += `${r.studentId};${r.studentName};${r.booklet};${r.rights};${r.wrongs};${r.empties};${r.invalids};${r.net};${r.score}\n`;
                                    });
                                    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", url);
                                    link.setAttribute("download", `Analiz_${new Date().toLocaleDateString('tr-TR')}.csv`);
                                    link.click();
                                    toast.success("Rapor indirildi.");
                                }}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-none font-bold text-xs uppercase hover:bg-emerald-700 transition shadow-md"
                            >
                                <Download size={16} /> Excel (CSV)
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
                                    <th className="p-4 text-center">B</th>
                                    <th className="p-4 text-center">Net</th>
                                    <th className="p-4 text-center">Puan</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-600 font-medium">
                                {results.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50 border-b last:border-0 transition-colors">
                                        <td className="p-4 font-mono">{r.studentId}</td>
                                        <td className="p-4 font-bold text-slate-900">{r.studentName || 'İSİMSİZ'}</td>
                                        <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded font-bold text-xs">{r.booklet}</span></td>
                                        <td className="p-4 text-center text-emerald-600 font-bold">{r.rights}</td>
                                        <td className="p-4 text-center text-rose-600 font-bold">{r.wrongs}</td>
                                        <td className="p-4 text-center text-slate-400">{r.empties}</td>
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
        if (stepId === 1) return true; // Always setup
        if (stepId === 2) return datContent.length > 0;
        if (stepId === 3) return students.length > 0;
        if (stepId === 4) return answerKeys.length > 0;
        return false;
    };

    const StepPlaceholder = (id: number) => (
        <div className="bg-white p-12 rounded-lg border-2 border-dashed border-slate-200 text-center">
            <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
                {STEPS[id - 1].icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{STEPS[id - 1].title}</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">{STEPS[id - 1].description}</p>
            <div className="bg-amber-50 text-amber-700 p-4 rounded text-sm border border-amber-100 flex items-center gap-3 justify-center">
                <Info size={18} />
                Bu özellik geliştirme aşamasındadır.
            </div>
        </div>
    );

    return (
        <PageContainer>
            {/* Header Section - Modern Dark Theme with Forced Contrast */}
            <div
                style={{ backgroundColor: '#1e293b' }}
                className="text-white p-10 mb-8 rounded-none border-l-8 border-[#3498db] shadow-2xl overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Activity size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div
                            style={{ backgroundColor: '#3498db' }}
                            className="p-3 text-white font-black text-2xl uppercase tracking-widest shadow-lg"
                        >
                            OT
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight m-0 text-white drop-shadow-lg">ONLINE TEST SINAV ANALİZİ</h1>
                    </div>
                    <p className="text-slate-200 max-w-4xl text-lg font-medium leading-relaxed">
                        Hızlı, güvenilir ve tamamen tarayıcı tabanlı optik form analiz sistemi. Adımları takip ederek sonuçlarınızı anında raporlayın.
                    </p>
                </div>
            </div>

            {/* Accordion Layout */}
            <div className="max-w-6xl mx-auto space-y-3 pb-20">
                {STEPS.map((step) => (
                    <div key={step.id} className="bg-white border-2 border-slate-100 shadow-xl overflow-hidden rounded-sm transition-all duration-300 hover:border-slate-300">
                        {/* Accordion Header */}
                        <button
                            onClick={() => setCurrentStep(currentStep === step.id ? 0 : step.id)}
                            className={`w-full flex items-center justify-between p-5 text-left transition-colors ${currentStep === step.id ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-center gap-5">
                                <div
                                    style={currentStep === step.id ? { backgroundColor: '#1e293b', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
                                    className={`p-3 rounded-none shadow-md transition-colors`}
                                >
                                    {isStepDone(step.id) && currentStep !== step.id ? (
                                        <CheckCircle size={24} className="text-emerald-500" />
                                    ) : (
                                        React.cloneElement(step.icon as React.ReactElement<any>, { size: 24 })
                                    )}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3498db] mb-0.5">Adım {step.id}</div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{step.title}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isStepDone(step.id) && (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-wider">Tamamlandı</span>
                                )}
                                <div className={`transition-transform duration-300 ${currentStep === step.id ? 'rotate-180' : ''}`}>
                                    <ChevronRight size={24} className="text-slate-400" />
                                </div>
                            </div>
                        </button>

                        {/* Accordion Content */}
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
                                        {step.id === 1 && <Step1_Profile />}
                                        {step.id === 2 && <Step2_DataEntry />}
                                        {step.id === 3 && <Step3_Preview />}
                                        {step.id === 4 && <Step4_AnswerKey />}
                                        {step.id === 5 && StepPlaceholder(5)}
                                        {step.id === 6 && StepPlaceholder(6)}
                                        {step.id === 7 && (
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
                                                            className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${scoring.cancelMode === 'count'
                                                                ? 'bg-slate-900 text-white border-slate-900 scale-105'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
                                                                }`}
                                                        >
                                                            İptal Soruyu Sayma
                                                        </button>
                                                        <button
                                                            onClick={() => setScoring({ ...scoring, cancelMode: 'correct' })}
                                                            className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${scoring.cancelMode === 'correct'
                                                                ? 'bg-slate-900 text-white border-slate-900 scale-105'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
                                                                }`}
                                                        >
                                                            Herkese Doğru Kabul Et
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {step.id === 8 && <Step8_Analysis />}

                                        <div className="mt-12 flex justify-end gap-3 border-t pt-8">
                                            {step.id > 1 && (
                                                <button
                                                    onClick={() => setCurrentStep(step.id - 1)}
                                                    className="flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                                                >
                                                    <ChevronLeft size={18} /> Önceki Adım
                                                </button>
                                            )}
                                            {step.id < 8 && (
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
        </PageContainer>
    );
}
