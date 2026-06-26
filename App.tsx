import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle,
  Calendar,
  Bell,
  Play,
  Square,
  Volume2,
  VolumeX,
  ChevronRight,
  Info,
  Users,
  Languages,
  Activity,
  FileCheck,
  ArrowRight,
  Clock,
  Send,
  RefreshCw,
  Plus,
  Trash2,
  HelpCircle,
  ShieldCheck,
  Smartphone,
  Sun,
  Moon,
  Palette
} from "lucide-react";
import { AnalysisResult, DocumentPreset, ChatMessage, Reminder, HistoryItem } from "./types";

const PERSONAS = [
  { id: "Student", name: "Student", icon: "🎓", desc: "A girl or boy applying for scholarship, exams, or circulars." },
  { id: "Senior Citizen", name: "Senior Citizen", icon: "👴", desc: "Struggles with prescriptions, bill terminologies, and pensions." },
  { id: "Rural User", name: "Rural Farmer/User", icon: "🌾", desc: "Prefers regional languages; needs local CSC / schemes info." },
  { id: "First-time Smartphone User", name: "Family Member", icon: "📱", desc: "Handles household bills, utility slips, and government forms." },
  { id: "Small Business Owner", name: "Business Owner", icon: "🛒", desc: "Manages GST invoices, bank notices, and credit slips." }
];

const LANGUAGES = [
  { code: "English", name: "English (US/IN)", native: "English" },
  { code: "Hindi", name: "Hindi (हिंदी)", native: "हिंदी" },
  { code: "Marathi", name: "Marathi (मराठी)", native: "मराठी" },
  { code: "Tamil", name: "Tamil (தமிழ்)", native: "தமிழ்" },
  { code: "Telugu", name: "Telugu (తెలుగు)", native: "తెలుగు" },
  { code: "Kannada", name: "Kannada (ಕನ್ನಡ)", native: "ಕನ್ನಡ" },
  { code: "Bengali", name: "Bengali (বাংলা)", native: "বাংলা" },
  { code: "Gujarati", name: "Gujarati (ગુજરાતી)", native: "ગુજરાતી" }
];

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark" | "warm">(() => {
    return (localStorage.getItem("saathi_theme") as "light" | "dark" | "warm") || "light";
  });

  // Save theme on updates
  useEffect(() => {
    localStorage.setItem("saathi_theme", theme);
  }, [theme]);

  // Preset list from server
  const [presets, setPresets] = useState<DocumentPreset[]>([]);
  
  // App state
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [activeFile, setActiveFile] = useState<{ name: string; size: string; base64: string; mimeType: string } | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedPersona, setSelectedPersona] = useState<string>("Student");
  
  // Active page state
  const [activePage, setActivePage] = useState<"home" | "analysis" | "chat" | "reminders" | "history">("home");
  const [homeStep, setHomeStep] = useState<1 | 2>(1);

  // Active analysis results
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<{ title: string; desc: string } | null>(null);

  // Reminders and History
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [newReminderText, setNewReminderText] = useState<string>("");
  const [newReminderDate, setNewReminderDate] = useState<string>("");

  // Speech TTS State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [ttsRate, setTtsRate] = useState<number>(1.0);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "c_init",
      role: "assistant",
      text: "Namaste! I am **Pocket Saathi**, your friendly local document helper companion. \n\nYou can upload any Indian document (such as bills, scholarship notices, prescription slips, or pension forms) on the **Home** tab to simplify it, or ask me any questions about Indian schemes, documents, or medical guidelines right here!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // File drag-over state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Document checklist completed items
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  // Fetch presets and load local state on mount
  useEffect(() => {
    // Fetch preset options from Express backend
    fetch("/api/presets")
      .then((res) => res.json())
      .then((data) => setPresets(data))
      .catch((err) => console.error("Error loading presets:", err));

    // Load LocalStorage states
    const savedReminders = localStorage.getItem("saathi_reminders");
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    } else {
      // Default initial mock reminders
      const initial: Reminder[] = [
        {
          id: "r1",
          docTitle: "Pragati Scholarship Notice",
          title: "Submit online form on National Scholarship Portal",
          date: "2026-07-31",
          action: "Submit scholarship degree applications",
          completed: false,
          createdAt: new Date().toISOString()
        }
      ];
      setReminders(initial);
      localStorage.setItem("saathi_reminders", JSON.stringify(initial));
    }

    const savedHistory = localStorage.getItem("saathi_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save state on updates
  useEffect(() => {
    if (reminders.length > 0) {
      localStorage.setItem("saathi_reminders", JSON.stringify(reminders));
    }
  }, [reminders]);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("saathi_history", JSON.stringify(history));
    }
  }, [history]);

  // Handle follow-up chat scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // Loading timeline simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep((prev) => {
          if (prev >= 4) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Speech TTS Player
  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Prepare clean reading content: strip markdown if any
    const cleanText = text
      .replace(/[*#_\-`[\]()]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set appropriate voice accent based on selected language
    if (selectedLanguage === "Hindi") utterance.lang = "hi-IN";
    else if (selectedLanguage === "Marathi") utterance.lang = "mr-IN";
    else if (selectedLanguage === "Tamil") utterance.lang = "ta-IN";
    else if (selectedLanguage === "Telugu") utterance.lang = "te-IN";
    else if (selectedLanguage === "Kannada") utterance.lang = "kn-IN";
    else if (selectedLanguage === "Bengali") utterance.lang = "bn-IN";
    else if (selectedLanguage === "Gujarati") utterance.lang = "gu-IN";
    else utterance.lang = "en-IN"; // Default to beautiful Indian English accent if available

    utterance.rate = ttsRate;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Submit file/preset to analyze
  const handleAnalyze = async (presetIdToUse?: string, fileToUse?: { name: string; size: string; base64: string; mimeType: string }) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setCheckedDocs({});
    handleStopSpeech();

    const currentPreset = presetIdToUse !== undefined ? presetIdToUse : selectedPreset;
    const currentFile = fileToUse !== undefined ? fileToUse : activeFile;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: currentPreset || undefined,
          file: currentFile?.base64 || undefined,
          mimeType: currentFile?.mimeType || undefined,
          language: selectedLanguage,
          userType: selectedPersona
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Analysis failed");
      }

      setAnalysisResult(data);
      
      // Auto-set the checkboxes
      const initialChecked: Record<string, boolean> = {};
      data.requiredDocuments?.forEach((doc: string) => {
        initialChecked[doc] = false;
      });
      setCheckedDocs(initialChecked);

      // Save to History List
      const title = currentPreset 
        ? presets.find(p => p.id === currentPreset)?.title || "Preset Document"
        : (currentFile?.name || "Uploaded Document");

      const newItem: HistoryItem = {
        id: "h_" + Date.now(),
        title,
        date: new Date().toLocaleDateString(),
        type: data.documentType || "Unknown",
        language: selectedLanguage,
        result: data
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 19)]); // Keep last 20
      
      // Reset Chat Messages with initial AI assistant greetings
      setChatMessages([
        {
          id: "c1",
          role: "assistant",
          text: `Namaste! I am your **Pocket Saathi** helper. I have simplified the **${title}** in **${selectedLanguage}** for you as a **${selectedPersona}** profile.
          
Do you have any specific questions about this document? For example, ask me "How do I apply?", "Is my income too high?", or "What happens if I miss the deadline?"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Automatically open the Document Hub view to see findings!
      setActivePage("analysis");

    } catch (err: any) {
      console.error(err);
      setAnalysisError({
        title: err.message === "Gemini API Key Required" ? "Gemini API Key Required" : "Processing Error",
        desc: err.message || "We encountered an issue while translating and analyzing your document. Please verify your connection or choose another file."
      });
      setActivePage("analysis"); // switch to analysis to see the error block
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setSelectedPreset(""); // Clear preset if custom file dropped

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedPreset(""); // Clear preset if custom file uploaded
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Please upload a valid image (PNG, JPG) or a PDF document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        base64: reader.result as string,
        mimeType: file.type
      };
      setActiveFile(fileData);
      handleAnalyze("", fileData);
    };
    reader.readAsDataURL(file);
  };

  // Follow-up Q&A Send
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuestion.trim()) return;

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      text: userQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const currentQuestion = userQuestion;
    setUserQuestion("");
    setIsTyping(true);

    try {
      // Map chat messages for endpoint history format
      const historyPayload = chatMessages.slice(-10).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        text: msg.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentQuestion,
          documentContext: analysisResult,
          history: historyPayload,
          language: selectedLanguage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to chat");

      setChatMessages((prev) => [
        ...prev,
        {
          id: "a_" + Date.now(),
          role: "assistant",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          role: "assistant",
          text: "I apologize, but my chat system is currently experiencing a connection hiccup. Please configure your API Key or try again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Toggle checklist document
  const toggleDocCheck = (doc: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  // Create Smart Reminder from extracted deadline
  const addExtractedReminder = (title: string, date: string, action: string) => {
    // Standardize date to string if arbitrary text received
    const cleanDate = date.match(/\d{4}-\d{2}-\d{2}/) ? date : new Date().toISOString().split('T')[0];
    
    const newRem: Reminder = {
      id: "rem_" + Date.now(),
      docTitle: analysisResult?.documentType || "Analyzed Document",
      title: title,
      date: cleanDate,
      action: action,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setReminders((prev) => [newRem, ...prev]);
    alert(`Alert Saved! A reminder for "${title}" has been successfully configured.`);
  };

  // Add custom manual reminder
  const handleAddManualReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;

    const newRem: Reminder = {
      id: "rem_" + Date.now(),
      docTitle: "Personal Reminder",
      title: newReminderText,
      date: newReminderDate || new Date().toISOString().split('T')[0],
      action: "Self action task",
      completed: false,
      createdAt: new Date().toISOString()
    };

    setReminders((prev) => [newRem, ...prev]);
    setNewReminderText("");
    setNewReminderDate("");
  };

  // Delete/toggle reminders
  const toggleReminderCompleted = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Handle Preset Select
  const selectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setActiveFile(null); // Clear manual upload
    handleAnalyze(presetId);
  };

  const resetAll = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setSelectedPreset("");
    setActiveFile(null);
    handleStopSpeech();
  };

  const handleSuggestionClick = (text: string) => {
    setUserQuestion(text);
    // Submit immediately or populate field
    setTimeout(() => {
      setUserQuestion(text);
    }, 50);
  };

  // Loading timeline helper text
  const loadingSteps = [
    { label: "OCR Transcription Engine", desc: "Extracting letters, numbers, and structural text from document scan..." },
    { label: "Multilingual Transformer Layer", desc: "Detecting technical legal/medical phrasing and mapping to native dictionaries..." },
    { label: "Simplification Pipeline", desc: "Rephrasing legalities, formulas, or medical Latin codes into humble plain instructions..." },
    { label: "Action Synthesis Engine", desc: "Detecting payment structures, required physical files, and critical dates..." },
    { label: "Personalized Recommendation Grid", desc: "Constructing advice guidelines tailored exactly for your selected user profile..." }
  ];

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans theme-${theme}`}>
      {/* Clean Simplified Header */}
      <header className="relative bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950 text-white shadow-lg overflow-hidden border-b border-purple-500/20">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-orange-600 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-pink-600 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between relative z-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-display">
                Pocket Saathi
              </h1>
              <p className="text-xs text-purple-200">Your Empathetic AI Document Companion & Simplified Helper</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Selector Toggle Buttons */}
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm p-1 rounded-full border border-purple-400/20">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-white text-purple-950 shadow-sm"
                    : "text-purple-200 hover:text-white"
                }`}
                title="Light Mode (Default)"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  theme === "dark"
                    ? "bg-white text-purple-950 shadow-sm"
                    : "text-purple-200 hover:text-white"
                }`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("warm")}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  theme === "warm"
                    ? "bg-white text-purple-950 shadow-sm"
                    : "text-purple-200 hover:text-white"
                }`}
                title="Senior/Warm Mode"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden sm:block bg-black/30 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-purple-400/20 text-xs font-mono font-bold text-pink-300">
              🇮🇳 Plain Language Access
            </div>
          </div>
        </div>
      </header>

      {/* Top Tab Navigation bar styled as clear sequential steps */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-1 py-1">
          <button
            onClick={() => setActivePage("home")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activePage === "home"
                ? "border-purple-600 text-purple-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activePage === "home" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>1</span>
            <span>Setup & Profile</span>
          </button>
          
          <button
            onClick={() => setActivePage("analysis")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activePage === "analysis"
                ? "border-purple-600 text-purple-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activePage === "analysis" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>2</span>
            <span>Document Summary</span>
            {analysisResult && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActivePage("chat")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activePage === "chat"
                ? "border-purple-600 text-purple-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activePage === "chat" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>3</span>
            <span>Ask Saathi (AI Chat)</span>
          </button>

          <button
            onClick={() => setActivePage("reminders")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activePage === "reminders"
                ? "border-purple-600 text-purple-900"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activePage === "reminders" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>4</span>
            <span>Alerts & Reminders ({reminders.filter((r) => !r.completed).length})</span>
          </button>

          <button
            onClick={() => setActivePage("history")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
              activePage === "history"
                ? "border-purple-600 text-purple-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activePage === "history" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>5</span>
            <span>Activity Logs ({history.length})</span>
          </button>
        </div>
      </nav>

      {/* Main Body content filtered by activePage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-6">
        
        {/* PAGE 1: HOME & UPLOAD */}
        {activePage === "home" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {/* Step flow state indicator */}
            <div className="flex items-center justify-center gap-3 bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100/40 w-fit mx-auto mb-2">
              <button 
                onClick={() => setHomeStep(1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  homeStep === 1 
                    ? "bg-purple-900 text-white shadow-sm" 
                    : "text-purple-950 hover:bg-purple-100/40"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${homeStep === 1 ? "bg-white text-purple-900" : "bg-purple-100 text-purple-900"}`}>A</span>
                Choose Profile & Language
              </button>
              <span className="text-purple-300 font-bold">➔</span>
              <button 
                onClick={() => setHomeStep(2)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  homeStep === 2 
                    ? "bg-purple-900 text-white shadow-sm" 
                    : "text-purple-950 hover:bg-purple-100/40"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${homeStep === 2 ? "bg-white text-purple-900" : "bg-purple-100 text-purple-900"}`}>B</span>
                Upload & Simplify
              </button>
            </div>

            {homeStep === 1 ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col gap-6 max-w-2xl mx-auto w-full text-left"
              >
                <div className="text-center">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">Step 1 of 2</span>
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-800 font-display mt-2 mb-1.5">Who is translating this document?</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">Pocket Saathi customizes technical explanations, terms, and guidelines specifically for your profile role and language preference.</p>
                </div>

                {/* Persona Selector */}
                <div className="border-t border-slate-100 pt-5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Users className="w-4 h-4 text-purple-600" />
                    1. Select Your Profile
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPersona(p.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          selectedPersona === p.id
                            ? "bg-purple-50/50 border-purple-600 ring-2 ring-purple-100"
                            : "bg-slate-50/50 hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{p.icon}</span>
                          <span className={`text-xs font-bold ${selectedPersona === p.id ? "text-purple-900" : "text-slate-800"}`}>{p.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-normal leading-relaxed">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selector */}
                <div className="border-t border-slate-100 pt-5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Languages className="w-4 h-4 text-orange-600" />
                    2. Select Your Preferred Language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.code)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          selectedLanguage === lang.code
                            ? "bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-100 font-semibold"
                            : "bg-slate-50/40 border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-medium">{lang.name}</span>
                        <span className="text-[10px] text-slate-400 font-light">{lang.native}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setHomeStep(2)}
                    className="bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    Next: Choose Document <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 max-w-3xl mx-auto w-full text-left"
              >
                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`bg-white rounded-3xl border-2 border-dashed p-8 md:p-10 text-center transition-all flex flex-col items-center justify-center min-h-[250px] relative shadow-sm ${
                    isDragging ? "border-purple-600 bg-purple-50" : "border-slate-300 hover:border-purple-400"
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                    <UploadCloud className="w-7 h-7 text-purple-600 animate-bounce" />
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-800 font-display mb-1.5">
                    Analyze & Simplify Any Document
                  </h3>
                  
                  <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
                    Drag and drop a photo (PNG, JPG) or upload a PDF of an Indian bill, prescription, scholarship notice, or government form.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                    <label className="bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg cursor-pointer transition-all shadow-md uppercase tracking-wider">
                      Browse File
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    
                    <span className="text-xs text-slate-400">or select a demo preset below</span>
                  </div>

                  {/* Selected Custom File Block */}
                  {activeFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-3 text-left w-full max-w-md mx-auto"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">{activeFile.name}</div>
                        <div className="text-[10px] text-slate-400">{activeFile.size} | PDF/Image Loaded</div>
                      </div>
                      <button
                        onClick={() => setActiveFile(null)}
                        className="text-slate-400 hover:text-red-500 text-xs px-2"
                      >
                        Clear
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Demo Document Preset List */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
                    <FileCheck className="w-4 h-4 text-pink-600" />
                    Select a Demo Document Preset
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {presets.length === 0 ? (
                      <div className="text-xs text-slate-400 animate-pulse py-2 col-span-2">Loading presets from server...</div>
                    ) : (
                      presets.map((preset) => {
                        let pIcon = "📜";
                        let pColor = "text-purple-600 bg-purple-50";
                        if (preset.id.includes("scholarship")) { pIcon = "🎓"; pColor = "text-indigo-600 bg-indigo-50"; }
                        else if (preset.id.includes("prescription")) { pIcon = "⚕️"; pColor = "text-emerald-600 bg-emerald-50"; }
                        else if (preset.id.includes("bill")) { pIcon = "⚡"; pColor = "text-amber-600 bg-amber-50"; }
                        else if (preset.id.includes("kisan")) { pIcon = "🌾"; pColor = "text-green-600 bg-green-50"; }
                        else if (preset.id.includes("invoice")) { pIcon = "🛒"; pColor = "text-pink-600 bg-pink-50"; }

                        return (
                          <button
                            key={preset.id}
                            onClick={() => selectPreset(preset.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all group ${
                              selectedPreset === preset.id
                                ? "bg-gradient-to-r from-purple-900 to-indigo-950 text-white border-purple-900 shadow-md"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${selectedPreset === preset.id ? "bg-white/25" : pColor}`}>
                                {pIcon}
                              </span>
                              <div className="truncate">
                                <div className="text-xs font-bold truncate">{preset.title}</div>
                                <div className={`text-[10px] ${selectedPreset === preset.id ? "text-slate-300" : "text-slate-500"}`}>{preset.type}</div>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${selectedPreset === preset.id ? "text-white" : "text-slate-400"}`} />
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Big glowing analysis button */}
                  {(selectedPreset || activeFile) && (
                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleAnalyze()}
                        disabled={isAnalyzing}
                        className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Start Pocket Saathi Simplifier
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setHomeStep(1)}
                    className="text-purple-950 text-xs font-bold flex items-center gap-1.5 hover:underline"
                  >
                    ← Back to Profile & Language
                  </button>
                </div>
              </motion.div>
            )}

            {/* Quick onboarding info guide cards showing at the bottom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 text-left">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  How Pocket Saathi Helps
                </h4>
                <ul className="flex flex-col gap-2 mt-2">
                  <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="text-green-500">✓</span> No complex jargon - medical scripts or legal files are rewritten into direct plain local instructions.
                  </li>
                  <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="text-green-500">✓</span> Real-time voice assistance translates and speaks text aloud in gentle regional accent parameters.
                  </li>
                  <li className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="text-green-500">✓</span> Deadlines and bills are caught automatically to protect families from penalty dues or late fees.
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 text-left">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Smartphone className="w-4 h-4 text-orange-600" />
                  Senior & Rural Friendly
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Designed particularly to support senior citizens, students, and rural users across India. You can switch target languages at any time to dynamically re-translate findings, make companion documents checklists, or configure automated reminders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: DOCUMENT HUB & ANALYSIS */}
        {activePage === "analysis" && (
          <div className="flex flex-col gap-6">
            
            {/* ACTIVE LOADING SCREEN */}
            {isAnalyzing && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[500px] text-center">
                <div className="relative mb-8">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-purple-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 font-display mb-1">
                  Pocket Saathi AI is analyzing your document...
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Target Language: <span className="text-purple-600 font-semibold">{selectedLanguage}</span> | User Profile: <span className="text-orange-600 font-semibold">{selectedPersona}</span>
                </p>

                {/* Progress Stepper Timeline */}
                <div className="max-w-md w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 text-left">
                  {loadingSteps.map((step, idx) => {
                    let status = "upcoming";
                    if (idx < analysisStep) status = "completed";
                    else if (idx === analysisStep) status = "active";

                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-1">
                          {status === "completed" && (
                            <div className="w-4.5 h-4.5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                          )}
                          {status === "active" && (
                            <div className="w-4.5 h-4.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold animate-ping">●</div>
                          )}
                          {status === "upcoming" && (
                            <div className="w-4.5 h-4.5 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400 font-bold">{idx + 1}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold ${status === "active" ? "text-purple-900" : status === "completed" ? "text-slate-700" : "text-slate-400"}`}>
                            {step.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-normal mt-0.5">{step.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ANALYSIS ERROR */}
            {analysisError && !isAnalyzing && (
              <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <Info className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 font-display mb-2">{analysisError.title}</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">{analysisError.desc}</p>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleAnalyze()}
                    className="bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try Again
                  </button>
                  <button
                    onClick={() => { resetAll(); setActivePage("home"); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-5 py-2.5 rounded-lg transition-all"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            )}

            {/* EMPTY STATE IF NO ACTIVE DOCUMENT */}
            {!analysisResult && !isAnalyzing && !analysisError && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Active Document Analysis</h3>
                <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                  You haven't selected or uploaded a document for translation yet. Go to the Home & Upload tab, select a profile configuration, and load an Indian notice or prescription to translate and simplify it in real time!
                </p>
                <button
                  onClick={() => setActivePage("home")}
                  className="bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md uppercase tracking-wider"
                >
                  Choose Document to Start
                </button>
              </div>
            )}

            {/* ACTIVE RESULTS BENTO GRID */}
            {analysisResult && !isAnalyzing && !analysisError && (
              <div className="flex flex-col gap-6">
                
                {/* Results Top Header Bar */}
                <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-pink-300">Simplified Analysis Result</div>
                    <h3 className="text-base font-bold font-display mt-0.5">{analysisResult.documentType}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs">
                      Language: <span className="text-orange-300 font-semibold">{selectedLanguage}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs">
                      Profile: <span className="text-pink-300 font-semibold">{selectedPersona}</span>
                    </div>
                    <button
                      onClick={() => { resetAll(); setActivePage("home"); }}
                      className="text-white hover:text-red-300 transition-colors bg-white/10 p-1.5 rounded-lg hover:bg-white/20 ml-2 text-xs"
                      title="Clear and upload new"
                    >
                      Reset File
                    </button>
                  </div>
                </div>

                {/* Warning Banner if operated in simulated offline mode */}
                {analysisResult.isOfflineMode && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-left">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-normal">
                      <strong className="block mb-0.5">Demonstration Mode</strong>
                      {analysisResult.warningMessage}
                    </div>
                  </div>
                )}

                {/* Bento Row 1: Voice Assistant Block & Simplified Summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Voice Player & Summary Panel */}
                  <div className="md:col-span-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    
                    {/* Speech synthesis widget */}
                    <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-xl border border-orange-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          {isSpeaking ? (
                            <div className="flex items-end gap-0.5 h-4">
                              <span className="w-1 h-3 bg-white rounded-full audio-bar"></span>
                              <span className="w-1 h-4 bg-white rounded-full audio-bar"></span>
                              <span className="w-1 h-2 bg-white rounded-full audio-bar"></span>
                              <span className="w-1 h-4 bg-white rounded-full audio-bar"></span>
                              <span className="w-1 h-3 bg-white rounded-full audio-bar"></span>
                            </div>
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </div>
                        
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-slate-800">
                            {isSpeaking ? "Speaking: Summary Breakdown..." : "Listen to Explanation (Voice Assistance)"}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                            Press play to hear the simplified text translated in a gentle voice accent.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Playback speed selector */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-[10px] font-mono">
                          <span className="text-slate-400">Speed:</span>
                          <select
                            value={ttsRate}
                            onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                            className="focus:outline-none bg-transparent font-semibold text-slate-800"
                          >
                            <option value="0.8">0.8x (Slow)</option>
                            <option value="1.0">1.0x (Normal)</option>
                            <option value="1.2">1.2x (Fast)</option>
                          </select>
                        </div>

                        {/* Main playback control */}
                        <button
                          onClick={() => handleSpeak(analysisResult.simplifiedSummary)}
                          className={`font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all ${
                            isSpeaking 
                              ? "bg-slate-800 hover:bg-slate-950 text-white" 
                              : "bg-orange-600 hover:bg-orange-500 text-white"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-white" /> Stop Speech
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" /> Play Speech
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Summary content */}
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What is this document?</h4>
                      <p className="text-xs text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-normal">
                        {analysisResult.documentPurpose}
                      </p>
                    </div>

                    <div className="text-left">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pocket Saathi Plain Language translation</h4>
                      <p className="text-sm text-slate-700 bg-purple-50/20 p-4 rounded-xl border border-purple-100/30 whitespace-pre-wrap leading-relaxed">
                        {analysisResult.simplifiedSummary}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Bento Row 2: Deadlines & Companion Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Deadlines list */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col text-left gap-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      Key Deadlines & Mandated Actions
                    </h4>

                    <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[300px] pr-1">
                      {analysisResult.deadlinesAndActions?.map((act, index) => (
                        <div
                          key={index}
                          className={`p-3.5 rounded-xl border flex flex-col gap-2 relative ${
                            act.isHighPriority 
                              ? "bg-red-50/50 border-red-100/80" 
                              : "bg-blue-50/40 border-blue-100/70"
                          }`}
                        >
                          {act.isHighPriority && (
                            <span className="absolute top-2.5 right-2.5 bg-red-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              CRITICAL
                            </span>
                          )}

                          <div className="pr-12">
                            <h5 className="text-xs font-bold text-slate-800">{act.title}</h5>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Due Date: {act.date}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed bg-white/50 p-2 rounded-lg border border-slate-100/50">
                            {act.actionRequired}
                          </p>

                          <button
                            onClick={() => addExtractedReminder(act.title, act.date, act.actionRequired)}
                            className="self-end text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 uppercase tracking-wider bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200 mt-1"
                          >
                            <Bell className="w-3 h-3 text-purple-600" /> Set Reminder Alert
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supporting Document Checklist */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col text-left gap-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FileCheck className="w-4 h-4 text-purple-600" />
                      Required Companion Documents Checklist
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Check off the documents mentioned in the notice once you have gathered them physically:
                    </p>

                    <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[250px] pr-1">
                      {analysisResult.requiredDocuments?.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs italic">
                          No supporting documents required for this request.
                        </div>
                      ) : (
                        analysisResult.requiredDocuments?.map((doc, idx) => (
                          <div
                            key={idx}
                            onClick={() => toggleDocCheck(doc)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              checkedDocs[doc]
                                ? "bg-green-50 border-green-200 text-slate-500"
                                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={checkedDocs[doc] || false}
                                onChange={() => {}} // toggled by parent div click
                                className="rounded text-green-600 focus:ring-green-500 w-4 h-4 shrink-0"
                              />
                              <span className={`text-xs font-semibold leading-tight break-words pr-2 ${checkedDocs[doc] ? 'line-through' : ''}`}>
                                {doc}
                              </span>
                            </div>
                            {checkedDocs[doc] && (
                              <span className="text-[10px] font-bold text-green-700 bg-green-100/50 px-2 py-0.5 rounded-full shrink-0">
                                READY
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Bento Row 3: Quick Payments if billing details are found */}
                {analysisResult.paymentDetails && analysisResult.paymentDetails.amountDue && (
                  <div className="bg-gradient-to-r from-orange-500 to-pink-600 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm text-left">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-orange-200">Billing details found</div>
                      <h4 className="text-lg font-bold font-display mt-0.5">Amount Due: {analysisResult.paymentDetails.amountDue}</h4>
                      <p className="text-xs text-orange-100 mt-1 leading-normal">
                        Payable to: <strong>{analysisResult.paymentDetails.payee || "Unspecified"}</strong> | Due Date: <strong>{analysisResult.paymentDetails.dueDate || "Immediate"}</strong>
                      </p>
                      {analysisResult.paymentDetails.penaltyDetails && (
                        <div className="text-[11px] text-red-100 mt-1 font-mono italic">
                          * Penalty: {analysisResult.paymentDetails.penaltyDetails}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => alert("Redirecting safely to official BBPS Bharat Bill Pay portal...")}
                      className="bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all uppercase tracking-wider shrink-0"
                    >
                      Quick Pay Online (BBPS)
                    </button>
                  </div>
                )}

                {/* Bento Row 4: Personalized Recommendations */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col text-left gap-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Personalized Smart Tips For You ({selectedPersona})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisResult.recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex flex-col gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick shortcut link to Chatbot Page */}
                <div className="bg-purple-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">💬</div>
                    <div>
                      <h4 className="text-sm font-bold">Have Follow-up Questions about this Document?</h4>
                      <p className="text-xs text-purple-200">Chat with Pocket Saathi Assistant to get personalized advice or clarification.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePage("chat")}
                    className="bg-white text-purple-950 font-bold text-xs px-5 py-2.5 rounded-lg shrink-0 hover:bg-slate-50 transition-all flex items-center gap-1"
                  >
                    Ask Pocket Saathi <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bento Row 6: Original Extracted Transcript */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 text-left">
                  <details className="group">
                    <summary className="text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between select-none">
                      <span>Show OCR Raw Extracted Text Transcript</span>
                      <span className="transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] text-slate-500 whitespace-pre-wrap max-h-[250px] overflow-y-auto leading-normal">
                      {analysisResult.extractedText}
                    </div>
                  </details>
                </div>

              </div>
            )}

          </div>
        )}

        {/* PAGE 3: ASK SAATHI (AI CHATBOT) */}
        {activePage === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Chat Helper Menu Panel */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  Ask Pocket Saathi Help Desk
                </h3>
                <p className="text-xs text-slate-400 mt-1">Our AI chatbot operates in plain, humble local language to answer any doubts.</p>
              </div>

              {analysisResult ? (
                <div className="bg-green-50 border border-green-200 p-3.5 rounded-xl text-xs text-green-900 leading-normal">
                  <div className="font-bold flex items-center gap-1.5 text-green-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    Sync Status: Connected
                  </div>
                  <p className="mt-1 text-[11px] text-green-700">
                    Pocket Saathi is currently synchronized with the loaded document: <strong className="font-semibold">{analysisResult.documentType}</strong>. You can ask queries specifically about it!
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 leading-normal">
                  <div className="font-bold text-blue-800 flex items-center gap-1">
                    ℹ️ General Assistant Mode
                  </div>
                  <p className="mt-1 text-[11px] text-blue-700">
                    No document is loaded yet. You can still type general questions about standard Indian government schemes, bills, scholarships, or how to read prescriptions!
                  </p>
                </div>
              )}

              {/* Recommended Question chips as requested! */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Recommended Queries</span>
                <div className="flex flex-wrap gap-2">
                  {(analysisResult ? [
                    "What is the exact deadline?",
                    "Are there any late fees or penalty?",
                    "What supporting documents are required?",
                    "Summarize this in 3 bullet points please",
                    "How does this affect my persona?"
                  ] : [
                    "How do I apply for the Pragati Scholarship?",
                    "How do senior citizens read medical prescriptions?",
                    "What is PM-Kisan and who is eligible?",
                    "How do I pay a standard electricity bill online?",
                    "What is the National Scholarship Portal?"
                  ]).map((text, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(text)}
                      className="text-left text-[11px] font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-150 transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {analysisResult && (
                <button
                  onClick={() => {
                    resetAll();
                    setChatMessages([
                      {
                        id: "c_init_new",
                        role: "assistant",
                        text: "I have reset the document context. How can I help you with general Indian document guidelines or schemes today?",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="text-xs text-center text-red-500 hover:underline mt-2 border border-red-200/50 hover:bg-red-50/50 py-2 rounded-lg transition-colors w-full"
                >
                  Disconnect Document Context
                </button>
              )}

              <div className="pt-4 border-t border-slate-100 mt-2 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed this Step?</span>
                <button
                  onClick={() => setActivePage("reminders")}
                  className="w-full bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  Configure Alerts & Reminders <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Area Panel */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px] overflow-hidden text-left">
              
              {/* Chat subheader */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                    👥
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Ask Pocket Saathi Assistant</h4>
                    <p className="text-[10px] text-slate-400">
                      {analysisResult ? "Chatting in context of current document" : "General helper assistant mode"}
                    </p>
                  </div>
                </div>
                
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>

              {/* Messages Panel */}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-slate-50/50">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      msg.role === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-normal ${
                        msg.role === "user"
                          ? "bg-purple-900 text-white rounded-tr-none"
                          : "bg-white text-slate-700 border border-slate-200 rounded-tl-none whitespace-pre-wrap font-sans"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="self-start bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Input form */}
              <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Type your question or click on recommended queries..."
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 font-sans"
                />
                <button
                  type="submit"
                  disabled={!userQuestion.trim() || isTyping}
                  className="bg-purple-900 hover:bg-purple-800 text-white rounded-xl p-3 px-5 transition-all disabled:opacity-40 flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

          </div>
        )}

        {/* PAGE 4: ALERTS & REMINDERS */}
        {activePage === "reminders" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Create alert form */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Bell className="w-4 h-4 text-orange-600" />
                  Add Quick Manual Alert
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure customized reminders for scholarship dates, utility bills, or clinic queues.</p>
              </div>

              <form onSubmit={handleAddManualReminder} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Alert Task Detail</label>
                  <input
                    type="text"
                    placeholder="e.g. Bring marksheet copy to Panchayat Office"
                    value={newReminderText}
                    onChange={(e) => setNewReminderText(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-500 text-white rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-1 uppercase tracking-wider shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Task Reminder
                </button>
              </form>
            </div>

            {/* Active Reminders List */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Your Active Alerts Checklist
                </h3>
                <span className="bg-purple-150 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {reminders.filter(r => !r.completed).length} Pending
                </span>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Bell className="w-10 h-10 mx-auto opacity-30 mb-3" />
                  No reminders configured yet. 
                  <p className="mt-1">Add a quick alert manually on the left, or click "Set Alert" inside any analyzed document breakdown!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[450px] overflow-y-auto pr-1">
                  {reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className={`p-3.5 rounded-xl border text-left transition-all relative group flex flex-col gap-1.5 ${
                        rem.completed
                          ? "bg-slate-50/50 border-slate-150 text-slate-400 line-through"
                          : "bg-white border-slate-200 text-slate-800 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={rem.completed}
                            onChange={() => toggleReminderCompleted(rem.id)}
                            className="mt-1 rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight break-words">{rem.title}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">{rem.docTitle}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteReminder(rem.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5 shrink-0"
                          title="Delete reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-orange-600 ml-7 bg-orange-50 px-2 py-0.5 rounded-md w-fit border border-orange-100">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {rem.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                <button
                  onClick={() => setActivePage("history")}
                  className="bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold py-3 px-5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider animate-pulse"
                >
                  View Activity Logs <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* PAGE 5: HISTORY & ACTIVITY LOGS */}
        {activePage === "history" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-purple-600" />
                  Activity Log Registry
                </h3>
                <p className="text-xs text-slate-400 mt-1">Access previous translated results of documents securely stored on your local device.</p>
              </div>

              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("saathi_history");
                  }}
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Logs
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                <FileText className="w-12 h-12 mx-auto opacity-30 mb-3" />
                No history logs registered yet.
                <p className="mt-1">Go to the Home page to select and simplify documents to list them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setAnalysisResult(item.result);
                      setAnalysisError(null);
                      setSelectedLanguage(item.language);
                      // Switch page automatically to analysis results!
                      setActivePage("analysis");
                    }}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-700">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Category: <strong className="text-slate-700 font-semibold">{item.type}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-mono">
                        <span>Analyzed on {item.date}</span>
                        <span>•</span>
                        <span className="text-purple-600 font-bold uppercase">{item.language}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 text-center py-8 px-4 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Pocket Saathi</span>
            <span>|</span>
            <span>Empowering everyday Indians with plain language document accessibility</span>
          </div>
          
          <div className="text-[11px] font-mono text-slate-400">
            Localized Companion Applet © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
