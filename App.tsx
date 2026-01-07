
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserRole, EmployeeRecord } from './types';
import { parseExcelFile } from './services/excelService';
import { saveRecordsToCloud, fetchRecordsFromCloud, isFirebaseConfigured } from './services/firebaseService';
import DataTable from './components/DataTable';
import { 
  FileUp, 
  LayoutDashboard, 
  Settings, 
  Users, 
  ShieldCheck, 
  ShieldAlert,
  Database,
  Info,
  Lock,
  LogOut,
  LogIn,
  X,
  UserCheck,
  UserMinus,
  Briefcase,
  Clock,
  Cloud,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('home');

  const [isConfigWarningVisible, setIsConfigWarningVisible] = useState(!isFirebaseConfigured());

  const setSafeError = (err: any) => {
    if (!err) {
      setError(null);
      return;
    }
    const message = typeof err === 'string' ? err : (err.message || String(err));
    setError(message);
  };

  useEffect(() => {
    const initData = async () => {
      if (!isFirebaseConfigured()) {
        setSafeError("Đang chạy ở chế độ Demo (Offline).");
        loadMockData();
        return;
      }

      setIsLoading(true);
      setSafeError(null);
      try {
        const cloudData = await fetchRecordsFromCloud();
        if (cloudData) {
          setRecords(cloudData.data);
          setLastUpdated(cloudData.lastUpdated);
        } else {
          loadMockData();
        }
      } catch (err: any) {
        setSafeError(err);
        loadMockData();
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const loadMockData = () => {
    const mockData: EmployeeRecord[] = [
      { stt: 1, fullName: 'Nguyễn Văn A (Dữ liệu mẫu)', unit: 'Phòng Kỹ thuật', parentUnit: 'Khối Sản xuất', dob: '15/05/1990', phone: '0901234567', status: 'Đã đăng nhập' },
      { stt: 2, fullName: 'Trần Thị B (Dữ liệu mẫu)', unit: 'Phòng Nhân sự', parentUnit: 'Khối Hành chính', dob: '22/08/1992', phone: '0912345678', status: 'Đã đăng nhập' },
      { stt: 3, fullName: 'Lê Văn C (Dữ liệu mẫu)', unit: 'Phòng Kinh doanh', parentUnit: 'Khối Thương mại', dob: '10/12/1988', phone: '0987654321', status: 'Chưa đăng nhập' },
    ];
    setRecords(mockData);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === 'admin' && loginPassword === 'admin') {
      setIsLoggedIn(true);
      setRole(UserRole.ADMIN);
      setShowLoginModal(false);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(UserRole.USER);
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isLoggedIn || role !== UserRole.ADMIN) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    setSafeError(null);

    try {
      const data = await parseExcelFile(file);
      const now = new Date();
      const timeString = `${now.toLocaleTimeString('vi-VN')} - ${now.toLocaleDateString('vi-VN')}`;
      
      await saveRecordsToCloud(data, timeString);
      
      setRecords(data);
      setLastUpdated(timeString);
      
    } catch (err: any) {
      console.error('Import error:', err);
      setSafeError(err);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  }, [role, isLoggedIn]);

  const filteredRecords = useMemo(() => {
    return records.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [records, searchTerm]);

  const totalPeople = filteredRecords.length;
  const loggedInCount = filteredRecords.filter(r => String(r.status).toLowerCase().includes('đã đăng nhập')).length;
  const notLoggedInCount = filteredRecords.filter(r => String(r.status).toLowerCase().includes('chưa đăng nhập')).length;
  const unitCount = new Set(filteredRecords.map(r => r.unit)).size;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden font-['Inter'] relative">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col md:w-[100px] md:h-full bg-slate-900 text-white py-8 gap-8 items-center border-r border-slate-800 shrink-0">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-4">
          <Database className="w-6 h-6" />
        </div>
        
        <nav className="flex flex-col gap-6 w-full items-center">
          <button className="p-3 text-blue-400 bg-blue-400/10 rounded-xl" title="Bảng điều khiển">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button className="p-3 text-slate-400 hover:text-white" title="Người dùng">
            <Users className="w-6 h-6" />
          </button>
          <button className="p-3 text-slate-400 hover:text-white">
            <Settings className="w-6 h-6" />
          </button>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-6 w-full px-2 pb-4">
          <button 
            onClick={isLoggedIn ? handleLogout : () => setShowLoginModal(true)}
            className={`flex flex-col items-center gap-1 group transition-all p-3 rounded-2xl w-full ${isLoggedIn ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-slate-800 text-slate-500'}`}
          >
            {isLoggedIn ? <ShieldCheck className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            <span className="text-[10px] font-bold uppercase tracking-tight">{isLoggedIn ? 'Admin' : 'Login'}</span>
          </button>
          
          {isLoggedIn && role === UserRole.ADMIN && (
            <label className="cursor-pointer p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex flex-col items-center justify-center">
              <FileUp className="w-6 h-6" />
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
              <span className="text-[9px] font-bold uppercase mt-1">Import</span>
            </label>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <aside className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 z-[100] px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-center justify-between h-full max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1.5 transition-colors px-4 py-2 rounded-2xl ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Trang chủ</span>
          </button>

          {/* Center Action Button (Admin Only) */}
          <div className="-mt-10">
            {isLoggedIn && role === UserRole.ADMIN ? (
              <label className="flex flex-col items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-xl shadow-blue-500/40 text-white active:scale-90 transition-transform cursor-pointer border-4 border-white">
                <FileUp className="w-7 h-7" />
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
              </label>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex flex-col items-center justify-center w-16 h-16 bg-slate-900 rounded-full shadow-xl shadow-slate-900/40 text-white active:scale-90 transition-transform border-4 border-white"
              >
                <Lock className="w-7 h-7" />
              </button>
            )}
          </div>

          <button 
            onClick={isLoggedIn ? handleLogout : () => setShowLoginModal(true)}
            className={`flex flex-col items-center gap-1.5 transition-colors px-4 py-2 rounded-2xl ${isLoggedIn ? 'text-green-600' : 'text-slate-400'}`}
          >
            {isLoggedIn ? <ShieldCheck className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            <span className="text-[10px] font-bold uppercase">{isLoggedIn ? 'Cá nhân' : 'Đăng nhập'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full flex flex-col overflow-hidden pb-20 md:pb-0">
        
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-black text-slate-900 tracking-tight leading-none">TRA CỨU NHÂN SỰ</h1>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase mt-1 hidden sm:block">Hệ thống quản lý trực quan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            <div className={`hidden sm:flex items-center gap-2 text-[10px] font-black px-3 py-2 rounded-xl border ${isFirebaseConfigured() ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
              <Cloud className="w-3.5 h-3.5" />
              <span>{isFirebaseConfigured() ? 'CLOUD SYNC' : 'OFFLINE'}</span>
            </div>

            <div className="flex items-center gap-3 border-l pl-4 md:pl-6 border-slate-200">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl border-2 border-white shadow-md overflow-hidden bg-slate-100 shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isLoggedIn ? 'admin' : 'guest'}`} alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Ticker - More compact for mobile */}
        {lastUpdated && (
          <div className="bg-red-600 h-8 md:h-9 flex items-center overflow-hidden shrink-0 shadow-lg relative z-30">
            <div className="flex items-center gap-1.5 px-4 bg-red-700 h-full text-white font-black text-[9px] md:text-xs z-10 shadow-2xl whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              <span>LIVE:</span>
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
              <div className="absolute whitespace-nowrap animate-marquee text-white font-bold text-[10px] md:text-sm flex items-center gap-12 pl-[100%]">
                <span className="flex items-center gap-2">
                  Dữ liệu đồng bộ lúc: <span className="underline decoration-2 underline-offset-4">{lastUpdated}</span>
                </span>
                <span className="opacity-40">|</span>
                <span>Mọi thay đổi từ Admin sẽ được cập nhật ngay lập tức cho tất cả người dùng</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto bg-slate-100 no-scrollbar">
          <style>
            {`
              @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-160%); } }
              .animate-marquee { animation: marquee 25s linear infinite; }
              @media (max-width: 640px) { .animate-marquee { animation-duration: 18s; } }
            `}
          </style>

          {error && (
            <div className="mb-6 p-4 bg-white border-l-4 border-red-500 rounded-xl shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs md:text-sm text-slate-700 font-medium">{error}</p>
              <button onClick={() => setSafeError(null)} className="ml-auto text-slate-400 p-1 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
          )}

          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-blue-100 rounded-full"></div>
                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest animate-pulse">Đang kết nối Cloud...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 md:gap-10">
              {/* Stats - Horizontal scroll on mobile if needed or 2x2 grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {[
                  { label: 'Tổng số', value: totalPeople, icon: Users, color: 'blue' },
                  { label: 'Hoạt động', value: loggedInCount, icon: UserCheck, color: 'green' },
                  { label: 'Vắng mặt', value: notLoggedInCount, icon: UserMinus, color: 'amber' },
                  { label: 'Đơn vị', value: unitCount, icon: Briefcase, color: 'purple' }
                ].map((stat, i) => (
                  <div key={i} className="group p-5 md:p-8 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-start gap-4 hover:border-blue-300 transition-all hover:shadow-xl hover:shadow-blue-500/5 cursor-default">
                    <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="w-full">
                      <span className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest block">{stat.label}</span>
                      <div className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mt-1">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Table Area */}
              <div className="flex-1 min-h-[500px]">
                <DataTable 
                  data={filteredRecords} 
                  searchTerm={searchTerm} 
                  onSearchChange={setSearchTerm} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop Footer */}
        <footer className="hidden md:flex h-12 px-10 border-t border-slate-200 bg-white items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            VISUAL TRACKING SYSTEM • v2.5.0
          </p>
          <div className="flex gap-6 text-[10px] text-slate-400 font-black">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> FIREBASE READY</span>
            <span>SECURE CLOUD PERSISTENCE</span>
          </div>
        </footer>
      </main>

      {/* Modern Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-lg p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
            <div className="relative p-8 md:p-12">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center mb-10 text-center">
                <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl mb-6 shadow-inner">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Xác thực</h2>
                <p className="text-slate-400 text-xs md:text-sm mt-2 font-bold uppercase tracking-wider">Quyền quản trị hệ thống</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <input 
                    type="text" required autoFocus
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    placeholder="Tài khoản admin"
                    value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <input 
                    type="password" required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    placeholder="Mật khẩu"
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {loginError && (
                  <div className="flex items-center gap-3 text-red-600 text-[11px] font-bold bg-red-50 p-4 rounded-2xl border border-red-100 animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all text-sm active:scale-95 uppercase tracking-widest mt-4">
                  Đăng nhập
                </button>
              </form>
            </div>
            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">demo: admin / admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
