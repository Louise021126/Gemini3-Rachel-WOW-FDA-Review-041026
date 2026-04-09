import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, Sun, Globe, Settings, Activity, FileText, 
  Wand2, ShieldAlert, TrendingUp, Layers, Play, 
  Save, Download, CheckCircle2, AlertCircle, Loader2,
  Search, FileJson, Sparkles, Languages, ClipboardList,
  ChevronRight, ArrowRight, BookOpen, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { SubmissionForm } from './components/SubmissionForm';
import { geminiService } from './services/gemini';
import { Language, SubmissionData, AgentResult, Entity } from './types';

// --- Constants & Data ---

const PAINTER_STYLES = [
  { id: 'default', name: 'Default Modern' },
  { id: 'vangogh', name: 'Van Gogh (Swirling)' },
  { id: 'picasso', name: 'Picasso (Geometric)' },
  { id: 'monet', name: 'Monet (Pastel)' },
  { id: 'dali', name: 'Dali (Melting)' },
  { id: 'basquiat', name: 'Basquiat (Gritty)' },
  { id: 'hokusai', name: 'Hokusai (Waves)' },
  { id: 'banksy', name: 'Banksy (Stencil)' },
  { id: 'warhol', name: 'Warhol (Pop Art)' },
  { id: 'kahlo', name: 'Kahlo (Vibrant)' },
  { id: 'rembrandt', name: 'Rembrandt (Chiaroscuro)' },
  { id: 'davinci', name: 'Da Vinci (Sketch)' },
  { id: 'michelangelo', name: 'Michelangelo (Fresco)' },
  { id: 'okeeffe', name: "O'Keeffe (Organic)" },
  { id: 'klimt', name: 'Klimt (Gold Leaf)' },
  { id: 'munch', name: 'Munch (Expressive)' },
  { id: 'seurat', name: 'Seurat (Pointillism)' },
  { id: 'pollock', name: 'Pollock (Drip)' },
  { id: 'mondrian', name: 'Mondrian (Grid)' },
  { id: 'hopper', name: 'Hopper (Cinematic)' },
  { id: 'rothko', name: 'Rothko (Color Field)' },
];

const MODELS = [
  'gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview'
];

const DEFAULT_TEMPLATE = `510(k) 審查報告：[裝置名稱] ([510(k) 編號])
1. 執行摘要 (Executive Summary)
[內容...]

2. 行政與分類資訊 (Administrative and Classification Information)
[內容...]

3. 裝置描述 (Device Description)
[內容...]

4. 適應症 (Indications for Use)
[內容...]

5. 實質等效性比較 (Substantial Equivalence Discussion)
[內容...]

6. 符合之共識標準 (Consensus Standards)
[內容...]

7. 性能數據：軟體驗證與確認 (V&V)
[內容...]

8. 詳細審查清單 (Detailed Review Checklist)
[內容...]

9. 數據集中提取的 20 個關鍵實體 (Extracted Entities)
[內容...]

10. 結論 (Conclusion)
[內容...]

11. 後續審查追蹤問題 (20 Follow-up Questions)
[內容...]`;

const DICT = {
  en: {
    title: 'ORICKS v4.0',
    subtitle: 'FDA 510(k) AI Review System',
    dashboard: 'Dashboard',
    submission: 'Submission',
    agent: 'AI Agent Workflow',
    editor: 'Dataset Editor',
    settings: 'Settings',
    theme: 'Theme',
    language: 'Language',
    style: 'Painter Style',
    spin: 'Spin Jackslot!',
    model: 'Model Selection',
    startAgent: 'Execute AI Agent',
    processing: 'Processing...',
    step1: '1. Input Data',
    step2: '2. Web Search Summary',
    step3: '3. Comp. Summary',
    step4: '4. Dataset & Report',
    step5: '5. Skill Creator',
    download: 'Download Results',
    pasteSummary: 'Paste 510(k) Summary / Notes',
    pasteTemplate: 'Paste Review Template',
    useDefault: 'Use Default Template',
    outputLang: 'Output Language',
    traditionalChinese: 'Traditional Chinese',
    english: 'English',
  },
  zh: {
    title: 'ORICKS v4.0',
    subtitle: 'FDA 510(k) AI 審查系統',
    dashboard: '儀表板',
    submission: '提交資料',
    agent: 'AI 代理工作流',
    editor: '數據集編輯器',
    settings: '設定',
    theme: '主題',
    language: '語言',
    style: '畫家風格',
    spin: '轉動拉霸！',
    model: '模型選擇',
    startAgent: '執行 AI 代理',
    processing: '處理中...',
    step1: '1. 輸入資料',
    step2: '2. 網頁搜尋摘要',
    step3: '3. 綜合摘要',
    step4: '4. 數據集與報告',
    step5: '5. 技能建立器',
    download: '下載結果',
    pasteSummary: '貼上 510(k) 摘要 / 筆記',
    pasteTemplate: '貼上審查範本',
    useDefault: '使用預設範本',
    outputLang: '輸出語言',
    traditionalChinese: '繁體中文',
    english: '英文',
  }
};

// --- Mock Data ---
const mockChartData = [
  { name: 'Sec 1', completeness: 80, risk: 20 },
  { name: 'Sec 2', completeness: 90, risk: 10 },
  { name: 'Sec 3', completeness: 60, risk: 50 },
  { name: 'Sec 4', completeness: 95, risk: 5 },
  { name: 'Sec 5', completeness: 70, risk: 30 },
];

const mockRadarData = [
  { subject: 'Biocompatibility', A: 120, B: 110, fullMark: 150 },
  { subject: 'Software', A: 98, B: 130, fullMark: 150 },
  { subject: 'Electrical', A: 86, B: 130, fullMark: 150 },
  { subject: 'Clinical', A: 99, B: 100, fullMark: 150 },
  { subject: 'Labeling', A: 85, B: 90, fullMark: 150 },
  { subject: 'Sterilization', A: 65, B: 85, fullMark: 150 },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [outputLang, setOutputLang] = useState<Language>('zh');
  const [styleId, setStyleId] = useState('default');
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  
  // Submission Data
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    summary: '',
    reviewNotes: '',
    guidance: '',
    template: DEFAULT_TEMPLATE
  });

  // Agent State
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [agentResults, setAgentResults] = useState<AgentResult>({});
  const [entities, setEntities] = useState<Entity[]>([]);

  const t = DICT[lang];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const spinJackslot = () => {
    setIsSpinning(true);
    let spins = 0;
    const interval = setInterval(() => {
      setStyleId(PAINTER_STYLES[Math.floor(Math.random() * PAINTER_STYLES.length)].id);
      spins++;
      if (spins > 10) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const runAgent = async () => {
    if (!submissionData.summary && !submissionData.reviewNotes) {
      toast.error("Please provide at least a summary or review notes.");
      return;
    }

    setIsAgentRunning(true);
    setAgentStep(1);
    
    try {
      const combinedInput = `${submissionData.summary}\n${submissionData.reviewNotes}\n${submissionData.guidance}`;
      
      // Step 4: Web Search Summary
      setAgentStep(2);
      const webSummary = await geminiService.generateWebSearchSummary(combinedInput, outputLang);
      setAgentResults(prev => ({ ...prev, webSearchSummary: webSummary }));
      
      // Step 5: Comprehensive Summary
      setAgentStep(3);
      const compSummary = await geminiService.generateComprehensiveSummary(combinedInput, webSummary || '', outputLang);
      setAgentResults(prev => ({ ...prev, comprehensiveSummary: compSummary }));
      
      // Step 6: Dataset & Report
      setAgentStep(4);
      const dataset = await geminiService.generateDataset(compSummary || '');
      setEntities(dataset.entities);
      
      const report = await geminiService.generateReviewReport(
        combinedInput, 
        webSummary || '', 
        compSummary || '', 
        dataset, 
        submissionData.template, 
        outputLang
      );
      
      const questions = await geminiService.generateFollowUpQuestions(combinedInput, compSummary || '', outputLang);
      setAgentResults(prev => ({ ...prev, dataset, reviewReport: report, followUpQuestions: questions }));
      
      // Step 7: Skill Creator
      setAgentStep(5);
      const skillMd = await geminiService.generateSkillMd({
        input: combinedInput,
        webSummary,
        compSummary,
        dataset,
        report
      });
      setAgentResults(prev => ({ ...prev, skillMd }));
      
      toast.success("AI Agent workflow completed successfully!");
      setActiveTab('agent');
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during the AI Agent workflow.");
    } finally {
      setIsAgentRunning(false);
      setAgentStep(0);
    }
  };

  const getStyleClasses = () => {
    const base = "min-h-screen transition-all duration-500 font-sans";
    const theme = darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900";
    
    switch(styleId) {
      case 'vangogh': return cn(base, theme, "bg-gradient-to-br from-blue-900/20 via-yellow-600/10 to-blue-800/20");
      case 'picasso': return cn(base, theme, "border-l-8 border-t-8 border-yellow-500/30");
      case 'monet': return cn(base, theme, "bg-gradient-to-tr from-pink-100/10 via-blue-100/10 to-green-100/10");
      case 'dali': return cn(base, theme, "backdrop-blur-sm skew-x-1");
      case 'basquiat': return cn(base, theme, "border-4 border-dashed border-red-500/20");
      case 'hokusai': return cn(base, theme, "bg-[url('https://www.transparenttextures.com/patterns/wavecut.png')] opacity-90");
      case 'banksy': return cn(base, theme, "grayscale contrast-125");
      case 'warhol': return cn(base, theme, "bg-gradient-to-r from-cyan-500/10 via-magenta-500/10 to-yellow-500/10");
      case 'kahlo': return cn(base, theme, "bg-gradient-to-b from-green-800/20 to-red-800/20");
      case 'rembrandt': return cn(base, theme, "shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]");
      case 'davinci': return cn(base, theme, "bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]");
      case 'michelangelo': return cn(base, theme, "bg-gradient-to-b from-blue-200/10 to-orange-100/10");
      case 'okeeffe': return cn(base, theme, "rounded-[100px] overflow-hidden");
      case 'klimt': return cn(base, theme, "bg-gradient-to-br from-yellow-400/20 to-yellow-700/20");
      case 'munch': return cn(base, theme, "animate-pulse");
      case 'seurat': return cn(base, theme, "bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-gray-500/10 to-transparent");
      case 'pollock': return cn(base, theme, "rotate-1");
      case 'mondrian': return cn(base, theme, "grid grid-cols-12 gap-1");
      case 'hopper': return cn(base, theme, "brightness-75 saturate-150");
      case 'rothko': return cn(base, theme, "bg-gradient-to-b from-red-900/30 via-orange-900/30 to-black/30");
      default: return cn(base, theme);
    }
  };

  return (
    <div className={getStyleClasses()}>
      <Toaster position="top-right" />
      
      {/* --- Header --- */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-md dark:bg-black/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                {t.subtitle}
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {[
              { id: 'dashboard', icon: Activity, label: t.dashboard },
              { id: 'submission', icon: FileText, label: t.submission },
              { id: 'agent', icon: Sparkles, label: t.agent },
              { id: 'editor', icon: Database, label: t.editor },
              { id: 'settings', icon: Settings, label: t.settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeTab === item.id 
                    ? "bg-white text-black dark:bg-white dark:text-black shadow-lg" 
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="rounded-full">
              <Globe className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Agents', value: '35', icon: Layers, color: 'text-blue-500' },
                  { label: 'Review Status', value: 'In Progress', icon: Activity, color: 'text-green-500' },
                  { label: 'Risk Level', value: 'Medium', icon: ShieldAlert, color: 'text-yellow-500' },
                  { label: 'Compliance', value: '92%', icon: CheckCircle2, color: 'text-purple-500' },
                ].map((stat, i) => (
                  <Card key={i} className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                      </div>
                      <div className={cn("p-3 rounded-2xl bg-gray-100 dark:bg-gray-800", stat.color)}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Submission Completeness vs Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="completeness" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      Agent Pulse Map (35 Agents)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockRadarData}>
                        <PolarGrid stroke="#888888" opacity={0.2} />
                        <PolarAngleAxis dataKey="subject" stroke="#888888" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#888888" fontSize={10} />
                        <Radar name="Current Submission" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                        <Radar name="Predicate Device" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Live Log Stream */}
              <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    Live Log Stream
                  </CardTitle>
                  <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-500 border-green-500/20">
                    LIVE
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px] w-full rounded-md border border-white/10 bg-black/5 dark:bg-black/40 p-4 font-mono text-xs">
                    <div className="space-y-1">
                      <p className="text-blue-400">[02:32:03] INFO: Initializing 35-Agent FDA 510(k) Review System...</p>
                      <p className="text-green-400">[02:32:05] SUCCESS: Connected to Gemini-3-Flash-Preview</p>
                      <p className="text-gray-400">[02:32:10] DEBUG: Loading regulatory guidance database...</p>
                      <p className="text-yellow-400">[02:32:15] WARN: Predicate device K203142 data retrieved with 92% confidence</p>
                      <p className="text-purple-400">[02:32:20] INFO: Agent #12 (Biocompatibility) starting analysis...</p>
                      <p className="text-blue-400">[02:32:25] INFO: Agent #05 (Software V&V) checking IEC 62304 compliance...</p>
                      <p className="text-gray-400">[02:32:30] DEBUG: Parsing submission summary for key entities...</p>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'submission' && (
            <motion.div
              key="submission"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-500" />
                      {t.pasteSummary}
                    </CardTitle>
                    <CardDescription>Paste your 510(k) submission summary, review notes, or guidance here.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Submission Summary</Label>
                        <Textarea 
                          placeholder="Paste 510(k) summary..." 
                          className="min-h-[200px]"
                          value={submissionData.summary}
                          onChange={(e) => setSubmissionData({...submissionData, summary: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Review Notes</Label>
                        <Textarea 
                          placeholder="Paste review notes..." 
                          className="min-h-[200px]"
                          value={submissionData.reviewNotes}
                          onChange={(e) => setSubmissionData({...submissionData, reviewNotes: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Review Guidance (Optional)</Label>
                      <Textarea 
                        placeholder="Paste 510(k) review guidance..." 
                        className="min-h-[150px]"
                        value={submissionData.guidance}
                        onChange={(e) => setSubmissionData({...submissionData, guidance: e.target.value})}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      {t.pasteTemplate}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSubmissionData({...submissionData, template: DEFAULT_TEMPLATE})}>
                      {t.useDefault}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Paste your report template..." 
                      className="min-h-[300px] font-mono text-sm"
                      value={submissionData.template}
                      onChange={(e) => setSubmissionData({...submissionData, template: e.target.value})}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                      Execution Config
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        {t.outputLang}
                      </Label>
                      <Select value={outputLang} onValueChange={(v: Language) => setOutputLang(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh">{t.traditionalChinese}</SelectItem>
                          <SelectItem value="en">{t.english}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        {t.model}
                      </Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <Button 
                      className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20"
                      onClick={runAgent}
                      disabled={isAgentRunning}
                    >
                      {isAgentRunning ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t.processing}
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          {t.startAgent}
                        </>
                      )}
                    </Button>

                    {isAgentRunning && (
                      <div className="space-y-4 mt-4">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Workflow Progress</span>
                          <span>{Math.round((agentStep / 5) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(agentStep / 5) * 100}%` }}
                          />
                        </div>
                        <div className="space-y-2">
                          {[t.step1, t.step2, t.step3, t.step4, t.step5].map((step, i) => (
                            <div key={i} className={cn(
                              "flex items-center gap-2 text-xs",
                              agentStep > i + 1 ? "text-green-500" : agentStep === i + 1 ? "text-blue-500 font-bold" : "text-gray-500"
                            )}>
                              {agentStep > i + 1 ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Painter Style Jackslot */}
                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-yellow-500" />
                      {t.style}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-16 flex items-center justify-center bg-black/5 dark:bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={styleId}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          className="text-lg font-bold text-center px-4"
                        >
                          {PAINTER_STYLES.find(s => s.id === styleId)?.name}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      onClick={spinJackslot}
                      disabled={isSpinning}
                    >
                      {isSpinning ? <Loader2 className="w-4 h-4 animate-spin" /> : t.spin}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'agent' && (
            <motion.div
              key="agent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <Tabs defaultValue="report" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <TabsTrigger value="report" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Review Report
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Summaries
                  </TabsTrigger>
                  <TabsTrigger value="skill" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Skill.md
                  </TabsTrigger>
                  <TabsTrigger value="dataset" className="flex items-center gap-2">
                    <Database className="w-4 h-4" /> Raw Dataset
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="report" className="mt-6">
                  <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Comprehensive 510(k) Review Report</CardTitle>
                        <CardDescription>Generated based on your submission and FDA guidance.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        const blob = new Blob([agentResults.reviewReport || ''], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = '510k_Review_Report.md';
                        a.click();
                      }}>
                        <Download className="w-4 h-4 mr-2" /> Download MD
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[700px] w-full rounded-md border p-6 bg-white dark:bg-gray-950">
                        <div className="prose dark:prose-invert max-w-none">
                          <Markdown>{agentResults.reviewReport || "No report generated yet. Run the AI Agent to start."}</Markdown>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="mt-6 space-y-8">
                  <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle>Web Search Summary (FDA Guidance)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-6 bg-white dark:bg-gray-950">
                        <div className="prose dark:prose-invert max-w-none">
                          <Markdown>{agentResults.webSearchSummary || "No summary generated yet."}</Markdown>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle>Comprehensive 510(k) Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-6 bg-white dark:bg-gray-950">
                        <div className="prose dark:prose-invert max-w-none">
                          <Markdown>{agentResults.comprehensiveSummary || "No summary generated yet."}</Markdown>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skill" className="mt-6">
                  <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Generated Skill.md</CardTitle>
                        <CardDescription>A reusable skill for reviewing similar medical devices.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        const blob = new Blob([agentResults.skillMd || ''], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'skill.md';
                        a.click();
                      }}>
                        <Download className="w-4 h-4 mr-2" /> Download Skill
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px] w-full rounded-md border p-6 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
                        <pre className="whitespace-pre-wrap">{agentResults.skillMd || "No skill generated yet."}</pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dataset" className="mt-6">
                  <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle>Raw JSON Dataset (50 Entities)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px] w-full rounded-md border p-6 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(agentResults.dataset, null, 2) || "No dataset generated yet."}</pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {activeTab === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              {entities.length > 0 ? (
                <SubmissionForm 
                  entities={entities} 
                  questions={agentResults.followUpQuestions || []}
                  onUpdate={(updated) => {
                    setEntities(updated);
                    setAgentResults(prev => ({ ...prev, dataset: { entities: updated } }));
                    toast.success("Dataset updated successfully!");
                  }} 
                />
              ) : (
                <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Database className="w-16 h-16 text-gray-300" />
                    <h3 className="text-xl font-bold">No Dataset Available</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Run the AI Agent in the Submission tab to extract 50 entities and populate this editor.
                    </p>
                    <Button onClick={() => setActiveTab('submission')} className="mt-4">
                      Go to Submission
                    </Button>
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>{t.settings}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.theme}</Label>
                      <p className="text-xs text-gray-500">Toggle between light and dark mode.</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)}>
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.language}</Label>
                      <p className="text-xs text-gray-500">Change UI language.</p>
                    </div>
                    <Select value={lang} onValueChange={(v: 'en' | 'zh') => setLang(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">繁體中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      AI Model Configuration
                    </Label>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Default Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Footer --- */}
      <footer className="mt-auto py-8 border-t border-white/10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>© 2026 ORICKS Regulatory OS. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
