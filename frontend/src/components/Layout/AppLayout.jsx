import { Outlet, Link, useLocation } from 'react-router-dom';
// Logistical Hub Architecture Refreshed 2026-04-19
import { Factory, QrCode, ClipboardList, LayoutDashboard, Users, UserPlus, ClipboardCheck, Archive, Leaf, CloudSun, Map, Package, FileText, Settings, Moon, Sun, Lock, Bell, ArrowRight, ArrowUp, ChevronDown, X, UserCog, Activity, Menu, Calculator, Beaker, Zap, Waves, Eye, Layers, PlusCircle, RefreshCcw, History, Camera, Fingerprint, Sprout, Calendar, TestTube2, Clock, Landmark, BookOpen, ReceiptText, Scale, LogOut, ShieldCheck, TrendingUp, CheckCircle2, FilePlus, Scissors, Banknote, Droplets, UserCheck, Sparkles, UserCheck as OfficerIcon, CircleDot, TreePine, Bot, Languages } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';

const SidebarLink = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
          ? 'bg-tea-500 text-white shadow-md shadow-tea-500/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-tea-500 transition-colors'} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {badge ? (
        <span className="inline-flex items-center justify-center rounded-full bg-tea-500 text-[11px] text-white px-2 py-1 font-semibold">
          {badge}
        </span>
      ) : null}
    </Link>
  );
};

export default function AppLayout({ theme, onToggleTheme }) {
  const location = useLocation();
  const contentRef = useRef(null);
  const notificationsRef = useRef(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState(false);
  const [isMusterOpen, setIsMusterOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isGISOpen, setIsGISOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOtherCropsOpen, setIsOtherCropsOpen] = useState(false);
  const [isAIHubOpen, setIsAIHubOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('tea-erp-lang') || 'en');
  const [userData, setUserData] = useState({ username: 'Super Admin', photo: '', role: 'Admin', estate: 'Estate Intelligence' });

  useEffect(() => {
    // Close sidebar when route changes on mobile
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const isDark = theme === 'dark';
  const unreadCount = notificationItems.filter((notification) => !notification.isRead).length;
  const previewNotifications = notificationItems.slice(0, 4);

  const clearNotifications = () => {
    setNotificationItems((items) => items.map((item) => ({ ...item, isRead: true })));
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await apiClient.get('/notifications');
        if (response.success) setNotificationItems(response.data);
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };

    loadNotifications();
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const onScroll = () => setShowScrollTop(content.scrollTop > 240);
    content.addEventListener('scroll', onScroll);
    onScroll();

    return () => content.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 glass-panel border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-1 pb-3 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 mb-2 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-col group cursor-default">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Evergreen Logo" className="h-16 w-16 object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110 -mt-1" />
              <div className="flex flex-col min-w-0">
                <h2 className="text-xl font-black font-outfit tracking-tighter leading-none">
                  <span className="bg-gradient-to-r from-tea-600 to-emerald-600 dark:from-tea-400 dark:to-emerald-400 bg-clip-text text-transparent">Evergreen</span>
                </h2>
                <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] opacity-80 mt-1">Estate ERP</h3>
              </div>
            </div>
            <p className="text-[7px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.4em] whitespace-nowrap px-1 mt-0.5">
              Plantation Management
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />

          
          {/* Crop Intelligence Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsCropOpen(!isCropOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isCropOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Leaf size={20} className={isCropOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Crop Intelligence</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isCropOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCropOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">

                <div className="text-[9px] font-black text-rose-500/70 dark:text-rose-400/70 uppercase tracking-widest pb-1 mb-1">
                  Intelligence & Strategy
                </div>
                <Link to="/crop/operations-intel" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/crop/operations-intel' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Activity size={14} className="opacity-70" /> Operations Intel
                </Link>
                <Link to="/crop/factory-weight" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/crop/factory-weight' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Factory size={14} className="opacity-70" /> Factory Crop Weight
                </Link>

                <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/50 mt-1 mb-1" />
                <div className="text-[9px] font-black text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest pb-1 mb-1">
                  Agronomic Rounds
                </div>
                <Link to="/crop/pruning" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/crop/pruning' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Scissors size={14} className="opacity-70" /> Pruning Dashboard
                </Link>
                <Link to="/crop/plucking-round" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/crop/plucking-round' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <RefreshCcw size={14} className="opacity-70" /> Plucking Round
                </Link>
                <Link to="/crop/rounds-intel" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/crop/rounds-intel' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <RefreshCcw size={14} className="opacity-70" /> Rounds Intelligence
                </Link>
              </div>
            )}
          </div>

          {/* Other Crops Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsOtherCropsOpen(!isOtherCropsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isOtherCropsOpen ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <CircleDot size={20} className={isOtherCropsOpen ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-500'} />
                <span className="font-semibold text-sm">Other Crops</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isOtherCropsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOtherCropsOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="text-[9px] font-black text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest pb-1 mb-1">
                  Cinnamon & Coconut
                </div>
                <Link to="/crop/other-crop-intel" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-amber-600 dark:hover:text-amber-400 ${location.pathname === '/crop/other-crop-intel' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Activity size={14} className="opacity-70" /> Crop Intelligence
                </Link>
                <Link to="/other-crops/operations" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-amber-600 dark:hover:text-amber-400 ${location.pathname === '/other-crops/operations' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Activity size={14} className="opacity-70" /> Crop Operations
                </Link>
                <Link to="/other-crops/sales" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-amber-600 dark:hover:text-amber-400 ${location.pathname === '/other-crops/sales' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Banknote size={14} className="opacity-70" /> Crop Sales Ledger
                </Link>
                <Link to="/cinnamon/compliance" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-amber-600 dark:hover:text-amber-400 ${location.pathname === '/cinnamon/compliance' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <ShieldCheck size={14} className="opacity-70" /> Cinnamon Compliance
                </Link>
              </div>
            )}
          </div>
          
          {/* Intelligence Hub Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsAIHubOpen(!isAIHubOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isAIHubOpen ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={20} className={isAIHubOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500'} />
                <span className="font-semibold text-sm">Intelligence Hub</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isAIHubOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isAIHubOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="text-[9px] font-black text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-widest pb-1 mb-1">
                  AI & Expert Advisors
                </div>
                <Link to="/calculators/chatbots" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${location.pathname === '/calculators/chatbots' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Sparkles size={14} className="opacity-70" /> Agronomic AI Bots
                </Link>
                <Link to="/other-crops/krushi-ai" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${location.pathname === '/other-crops/krushi-ai' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Bot size={14} className="opacity-70" /> Krushi AI Advisor
                </Link>
              </div>
            )}
          </div>
          
          {/* Smart Muster & Workforce Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsMusterOpen(!isMusterOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isMusterOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Users size={20} className={isMusterOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Smart Muster & HR</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isMusterOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isMusterOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/workforce" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/workforce' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <ClipboardCheck size={14} className="opacity-70" /> Daily Muster Log
                </Link>
                <Link to="/workforce/view" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/workforce/view' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Eye size={14} className="opacity-70" /> View Workers
                </Link>
                <Link to="/workforce/registration" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/workforce/registration' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <UserPlus size={14} className="opacity-70" /> Worker Registration
                </Link>
                <Link to="/workforce/archive" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/workforce/archive' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <Archive size={14} className="opacity-70" /> Personnel Archive
                </Link>
                <Link to="/workforce/release" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/workforce/release' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                   <CheckCircle2 size={14} className="opacity-70" /> Duty Release Hub
                </Link>
              </div>
            )}
          </div>

          {/* Smart Attendance Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isAttendanceOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Clock size={20} className={isAttendanceOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Smart Attendance</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isAttendanceOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isAttendanceOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/attendance/today" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/attendance/today' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Calendar size={14} className="opacity-70" /> Today's Attendance
                </Link>
                <Link to="/attendance/live" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/attendance/live' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Camera size={14} className="opacity-70" /> Live Face ID
                </Link>
                <Link to="/attendance/qr" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/attendance/qr' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <QrCode size={14} className="opacity-70" /> Tactical QR Scan
                </Link>
                <Link to="/attendance/manual" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/attendance/manual' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <ShieldCheck size={14} className="opacity-70" /> Manual Override
                </Link>
                <Link to="/attendance/enroll" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/attendance/enroll' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Fingerprint size={14} className="opacity-70" /> Biometric Enroll
                </Link>
              </div>
            )}
          </div>

          {/* Payroll Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsPayrollOpen(!isPayrollOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isPayrollOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Banknote size={20} className={isPayrollOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Payrall</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isPayrollOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isPayrollOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/payrall" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/payrall' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Calculator size={14} className="opacity-70" /> Daily Wages
                </Link>
                <Link to="/payrall/monthly" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/payrall/monthly' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <ReceiptText size={14} className="opacity-70" /> Monthly Payroll
                </Link>
                <Link to="/payrall/tea-packets" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/payrall/tea-packets' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Package size={14} className="opacity-70" /> Tea Packet Issue
                </Link>
                <Link to="/payrall/advances" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/payrall/advances' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Banknote size={14} className="opacity-70" /> Cash Advance
                </Link>
                <Link to="/payrall/casual" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/payrall/casual' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <UserCheck size={14} className="opacity-70" /> Casual & Contract
                </Link>
              </div>
            )}
          </div>

          {/* Inventory Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isInventoryOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Package size={20} className={isInventoryOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Inventory</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isInventoryOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isInventoryOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/inventory/goods" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/goods' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <FileText size={14} className="opacity-70" /> Goods Inventory
                </Link>
                <Link to="/inventory/tea-packets" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/tea-packets' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Package size={14} className="opacity-70" /> Tea Packet Stock
                </Link>
                <Link to="/inventory/goods/issue" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/goods/issue' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <RefreshCcw size={14} className="opacity-70" /> Issue Stock
                </Link>
                <Link to="/inventory/goods/history" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/goods/history' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <History size={14} className="opacity-70" /> Issue History
                </Link>
                <Link to="/inventory/suppliers" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/suppliers' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Users size={14} className="opacity-70" /> Suppliers Directory
                </Link>
                <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/50 mt-1" />
                <Link to="/inventory/biological-assets" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/biological-assets' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Leaf size={14} className="opacity-70" /> Biological Assets
                </Link>
                <Link to="/inventory/physical-assets" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/physical-assets' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Settings size={14} className="opacity-70" /> Physical Assets
                </Link>
                <Link to="/inventory/biological-audit" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/inventory/biological-audit' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <PlusCircle size={14} className="opacity-70" /> Asset Registration
                </Link>
              </div>
            )}
          </div>

          {/* Finance Module */}
          <div className="space-y-1">
            <button
              onClick={() => setIsFinanceOpen(!isFinanceOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isFinanceOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Landmark size={20} className={isFinanceOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Finance</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isFinanceOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFinanceOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/finance/overview" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/overview' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Activity size={14} className="opacity-70" /> Overview
                </Link>
                <Link to="/finance/accounts" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/accounts' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Landmark size={14} className="opacity-70" /> Chart of Accounts
                </Link>
                <Link to="/finance/journal" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/journal' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <BookOpen size={14} className="opacity-70" /> Journal Entries
                </Link>
                <Link to="/finance/expenses" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/expenses' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <ReceiptText size={14} className="opacity-70" /> Expenses
                </Link>
                <Link to="/finance/capital-expenses" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/capital-expenses' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Landmark size={14} className="opacity-70" /> Capital Expenses
                </Link>
                <Link to="/finance/income" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/income' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Banknote size={14} className="opacity-70" /> Income
                </Link>
                <Link to="/finance/trial-balance" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/trial-balance' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Scale size={14} className="opacity-70" /> Trial Balance
                </Link>
                <Link to="/finance/estate-cop" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-green-700 dark:hover:text-green-400 ${location.pathname === '/finance/estate-cop' ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Leaf size={14} className="opacity-70" /> Estate COP
                </Link>
                <Link to="/finance/daily-weekly-cop" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-green-700 dark:hover:text-green-400 ${location.pathname === '/finance/daily-weekly-cop' ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Leaf size={14} className="opacity-70" /> Daily/Weekly COP
                </Link>
                <Link to="/finance/leaf-income" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/finance/leaf-income' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Banknote size={14} className="opacity-70" /> Leaf Income
                </Link>
              </div>
            )}
          </div>

          {/* Compliance & Audit Module */}
          <div className="space-y-1">
            <button
              onClick={() => setIsComplianceOpen(!isComplianceOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isComplianceOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className={isComplianceOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Compliances</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isComplianceOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isComplianceOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/compliance/estate" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/compliance/estate' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Landmark size={14} className="opacity-70" /> Estate Registration
                </Link>
                <Link to="/compliance/tea-land" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/compliance/tea-land' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Leaf size={14} className="opacity-70" /> Tea Land Registration
                </Link>
                <Link to="/compliance/insurance" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/compliance/insurance' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <ShieldCheck size={14} className="opacity-70" /> Insurance Registry
                </Link>
                <Link to="/compliance/subsidies" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/compliance/subsidies' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <FilePlus size={14} className="opacity-70" /> Subsidies
                </Link>
                <Link to="/compliance/epf-guidelines" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/compliance/epf-guidelines' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <BookOpen size={14} className="opacity-70" /> EPF Guidelines
                </Link>
                <Link to="/compliance/etf-guidelines" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/compliance/etf-guidelines' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <FileText size={14} className="opacity-70" /> ETF Guidelines
                </Link>
              </div>
            )}
          </div>

          {/* Weather & Climate Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsWeatherOpen(!isWeatherOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isWeatherOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <CloudSun size={20} className={isWeatherOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Weather & Climate</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isWeatherOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isWeatherOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/weather/realtime" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/weather/realtime' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Eye size={14} className="opacity-70" /> Real-Time Weather
                </Link>
                <Link to="/weather/fertilizer" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/weather/fertilizer' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Leaf size={14} className="opacity-70" /> Fertilizer Rec.
                </Link>
                <Link to="/weather/historical" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/weather/historical' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Activity size={14} className="opacity-70" /> Historical Data
                </Link>
              </div>
            )}
          </div>

          {/* GIS Mapping Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsGISOpen(!isGISOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isGISOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Map size={20} className={isGISOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">GIS Mapping</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isGISOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isGISOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/mapping" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/mapping' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Map size={14} className="opacity-70" /> Field Map
                </Link>
                <Link to="/mapping/field-data" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/mapping/field-data' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <FileText size={14} className="opacity-70" /> Field Data
                </Link>
                <Link to="/mapping/gps-tracking" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/mapping/gps-tracking' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <CloudSun size={14} className="opacity-70" /> GPS Tracking
                </Link>
                <Link to="/mapping/blocks" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/mapping/blocks' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Package size={14} className="opacity-70" /> Field Blocks
                </Link>
                <Link to="/mapping/divisions" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/mapping/divisions' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Layers size={14} className="opacity-70" /> Divisions
                </Link>
              </div>
            )}
          </div>

          {/* Reports Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isReportsOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className={isReportsOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Reports</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isReportsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isReportsOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/reports/attendance" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/reports/attendance' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Activity size={14} className="opacity-70" /> Attendance Analytics
                </Link>
                <Link to="/reports/plucker-performance" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/reports/plucker-performance' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <TrendingUp size={14} className="opacity-70" /> Performance Analytics
                </Link>
                <Link to="/reports/blockwise" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/reports/blockwise' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Map size={14} className="opacity-70" /> Blockwise Harvest
                </Link>
                <Link to="/reports/asset-disposals" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/reports/asset-disposals' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Archive size={14} className="opacity-70" /> Asset Disposal Archive
                </Link>
              </div>
            )}
          </div>

          {/* Calculators Module */}
          <div className="space-y-1">
            <button 
              onClick={() => setIsCalculatorsOpen(!isCalculatorsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isCalculatorsOpen ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Calculator size={20} className={isCalculatorsOpen ? 'text-tea-600 dark:text-tea-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-tea-500'} />
                <span className="font-semibold text-sm">Calculators</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isCalculatorsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCalculatorsOpen && (
              <div className="pl-12 pr-4 py-1 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Link to="/calculators/ph-dolomite" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/calculators/ph-dolomite' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Waves size={14} className="opacity-70" /> pH Dolomite Cal
                </Link>

                <Link to="/calculators/foliar" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/calculators/foliar' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Beaker size={14} className="opacity-70" /> Foliar Applications
                </Link>
                <Link to="/calculators/b-cal" className={`flex items-center gap-2 py-1 text-xs font-medium transition-colors hover:text-tea-600 dark:hover:text-tea-400 ${location.pathname === '/calculators/b-cal' ? 'text-tea-600 dark:text-tea-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Zap size={14} className="opacity-70" /> Units Converter
                </Link>
              </div>
            )}
          </div>

          <SidebarLink to="/accounts" icon={UserCog} label="Accounts & Users" />
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight flex items-center gap-1">
                {userData.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)] animate-pulse shrink-0"></div>
                <p className="text-[7px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest truncate">
                  v2.4.0 • {userData.estate}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[8px] text-tea-600 dark:text-tea-400 font-bold uppercase tracking-wider bg-tea-50 dark:bg-tea-900/40 px-1.5 py-0.5 rounded-md border border-tea-100 dark:border-tea-800">
              {userData.role?.replace('_', ' ') || ''}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* Top Header */}
        <header className="h-16 px-4 lg:px-8 flex items-center justify-between glass-panel border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg lg:text-xl font-semibold text-slate-800 dark:text-slate-100 font-outfit capitalize truncate max-w-[150px] sm:max-w-none">
              {location.pathname === '/' ? 'Overview & Analytics' : location.pathname.substring(1).replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={() => {
                const newLang = language === 'en' ? 'si' : 'en';
                setLanguage(newLang);
                localStorage.setItem('tea-erp-lang', newLang);
                window.dispatchEvent(new Event('languageChange'));
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-800"
              aria-label="Toggle Language"
            >
              <Languages size={18} className="text-tea-600 dark:text-tea-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {language === 'en' ? 'SI' : 'EN'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>

            {/* Notifications Quick Access */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                aria-label="Open Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tea-500 text-[10px] font-bold text-white px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-3xl glass-panel shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Alerts</p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{unreadCount} unread</span>
                      </div>
                      <button
                        onClick={clearNotifications}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Clear notifications"
                      >
                        <X size={14} />
                        Clear
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {previewNotifications.map((notification) => (
                        <div key={notification.id} className="rounded-2xl p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{notification.title}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 overflow-hidden text-ellipsis">{notification.message}</p>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{notification.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                      <Link
                        to="/notifications"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-tea-500 px-4 py-2 text-sm font-semibold text-white hover:bg-tea-600 transition-colors"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        View all notifications
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 transition-all hover:opacity-80">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userData.username}</p>
                  <p className="text-[10px] font-bold text-tea-600 dark:text-tea-400 uppercase tracking-widest leading-none mt-1">{userData.estate}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tea-500 to-tea-600 text-white flex items-center justify-center font-bold shadow-lg shadow-tea-500/20 ring-2 ring-white dark:ring-slate-900 overflow-hidden">
                  {userData.photo ? (
                    <img src={userData.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userData.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                <div className="glass-panel border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-2xl">
                  <div className="p-3">
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 transition-colors">
                      <Settings size={16} /> User Settings
                    </Link>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 dark:text-red-400 transition-colors"
                    >
                      <Lock size={16} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable View */}
        <div ref={contentRef} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in relative flex-grow w-full">
            <Outlet />
          </div>

          <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 lg:px-8 py-4 text-xs lg:text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center sm:text-left">Evergreen Estate ERP © 2026 · Estate intelligence for plantations</p>
            <div className="flex items-center gap-3">
              <Link to="/privacy" className="text-tea-600 hover:text-tea-500 transition-colors">Privacy</Link>
              <Link to="/support" className="text-tea-600 hover:text-tea-500 transition-colors">Support</Link>
              <Link to="/release-notes" className="text-tea-600 hover:text-tea-500 transition-colors">Release Notes</Link>
            </div>
          </footer>
        </div>

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-tea-600 text-white shadow-2xl shadow-tea-600/20 hover:bg-tea-700 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center p-4 mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Logout</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                Are you sure you want to log out of your session? You will need to log back in to access the system.
              </p>
              <div className="flex w-full gap-3 mt-1">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-600/20 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
