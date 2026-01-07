
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

  const [isConfigWarningVisible, setIsConfigWarningVisible] = useState(!isFirebaseConfigured());

  // Safe error setter to prevent circular structure serialization
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
        setSafeError("Firebase chưa cấu hình. Đang chạy chế độ Demo.");
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
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 overflow-hidden font-['Inter'] relative select-none md:select-auto">
      
      {/* SIDEBAR (Desktop) / BOTTOM NAV (Mobile) */}
      <aside className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 text-white flex flex-row items-center justify-around px-2 border-t border-slate-800 z-50 
                       md:relative md:flex-col md:w-[10%] md:h-full md:min-w-[100px] md:border-r md:border-t-0 md:py-8 md:gap-8 md:justify-start shadow-[0_-4px_10px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="hidden md:block p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
          <Database className="w-6 h-6" />
        </div>
        
        <nav className="flex flex-row md:flex-col gap-6 w-full items-center justify-around md:justify-start">
          <button className="p-3 text-blue-400 bg-blue-400/10 rounded-lg active:scale-95 transition-transform" title="Bảng điều khiển">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button className="p-3 text-slate-400 hover:text-white active:scale-95 transition-transform" title="Người dùng">
            <Users className="w-6 h-6" />
          </button>
          
          <div className="flex items-center justify-center">
            {isLoggedIn && role === UserRole.ADMIN ? (
              <label className="cursor-pointer p-3 bg-blue-600 hover:bg-blue-500 rounded-full md:rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex flex-col items-center justify-center active:scale-90">
                <FileUp className="w-6 h-6" />
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isLoading} />
                <span className="hidden md:block text-[9px] font-bold uppercase mt-1">Import</span>
              </label>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="p-3 bg-slate-800 text-slate-500 rounded-full md:rounded-2xl active:scale-90">
                <Lock className="w-6 h-6" />
                <span className="hidden md:block text-[9px] font-bold uppercase mt-1">Lock</span>
              </button>
            )}
          </div>

          <button className="p-3 text-slate-400 hover:text-white md:hidden active:scale-95" onClick={isLoggedIn ? handleLogout : () => setShowLoginModal(true)}>
            {isLoggedIn ? <LogOut className="w-6 h-6 text-red-400" /> : <LogIn className="w-6 h-6" />}
          </button>
          
          <button className="hidden md:block p-3 text-slate-400 hover:text-white active:scale-95">
            <Settings className="w-6 h-6" />
          </button>
        </nav>

        <div className="hidden md:flex mt-auto flex-col items-center gap-6 w-full px-2 pb-4">
          <button 
            onClick={isLoggedIn ? handleLogout : () => setShowLoginModal(true)}
            className={`flex flex-col items-center gap-1 group transition-all p-3 rounded-xl w-full active:scale-95 ${isLoggedIn ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-slate-800 text-slate-500'}`}
          >
            {isLoggedIn ? <ShieldCheck className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            <span className="text-[10px] font-bold uppercase tracking-tight">{isLoggedIn ? 'Admin' : 'Login'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full flex flex-col overflow-hidden pb-16 md:pb-0">
        
        {/* Firebase Config Warning Banner */}
        {isConfigWarningVisible && (
          <div className="bg-amber-50 border-b border-amber-200 p-2 px-4 flex items-center justify-between z-40 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 text-amber-800 text-[10px] md:text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="truncate">Kiểm tra kết nối hoặc cấu hình Firebase trong <code className="bg-amber-100 px-1 rounded font-mono">firebaseService.ts</code></p>
            </div>
            <button onClick={() => setIsConfigWarningVisible(false)} className="text-amber-400 p-1"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Header */}
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="md:hidden p-2 bg-blue-600 rounded-lg text-white">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-sm md:text-xl font-bold text-slate-800 tracking-tight truncate max-w-[150px] md:max-w-none">Hệ thống Tra cứu</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            <div className={`hidden sm:flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-lg border ${isFirebaseConfigured() ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isFirebaseConfigured() ? 'Cloud Firestore' : 'Offline Mode'}</span>
            </div>

            <div className="flex items-center gap-2 md:gap-3 border-l pl-2 md:pl-6 border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] md:text-sm font-semibold text-slate-900">{isLoggedIn ? 'Quản trị viên' : 'Khách'}</span>
                <span className="text-[8px] md:text-xs text-slate-500">{isLoggedIn ? 'admin@sys' : 'guest@view'}</span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isLoggedIn ? 'admin' : 'guest'}`} alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Notification Ticker */}
        {lastUpdated && (
          <div className="bg-red-600 h-7 md:h-8 flex items-center overflow-hidden shrink-0 shadow-inner">
            <div className="flex items-center gap-1 px-3 bg-red-700 h-full text-white font-bold text-[9px] md:text-xs z-10 shadow-lg whitespace-nowrap">
              <Clock className="w-3 h-3" />
              <span className="hidden md:inline">CẬP NHẬT:</span>
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
              <div className="absolute whitespace-nowrap animate-marquee text-white font-medium text-[10px] md:text-sm flex items-center gap-8 pl-[100%]">
                <span>Dữ liệu mới nhất cập nhật lúc: <span className="font-bold underline">{lastUpdated}</span></span>
                <span className="opacity-60">•</span>
                <span>Hệ thống: {isFirebaseConfigured() ? 'Cloud Sync Hoạt động' : 'Đang sử dụng dữ liệu Cache/Mẫu'}</span>
                <span className="opacity-60">•</span>
                <span className="text-[10px] md:text-xs italic opacity-80">(Kiểm tra kết nối internet nếu dữ liệu không đồng bộ)</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 md:p-8 overflow-y-auto no-scrollbar">
          <style>
            {`
              @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-160%); } }
              .animate-marquee { animation: marquee 30s linear infinite; }
              @media (max-width: 768px) { .animate-marquee { animation-duration: 18s; } }
            `}
          </style>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-red-700 font-medium">{error}</p>
                  {error.includes("permission-denied") && (
                    <p className="mt-2 text-[10px] md:text-xs text-red-600/70">Mẹo: Đảm bảo Security Rules trên Firebase cho phép đọc/ghi.</p>
                  )}
                </div>
                <button onClick={() => setSafeError(null)} className="text-red-400 p-1 hover:text-red-600"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs md:text-sm font-medium animate-pulse">Đang đồng bộ dữ liệu...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Dashboard Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {[
                  { label: 'Tổng số', value: totalPeople, icon: Users, color: 'blue' },
                  { label: 'Đã Login', value: loggedInCount, icon: UserCheck, color: 'green' },
                  { label: 'Chưa Login', value: notLoggedInCount, icon: UserMinus, color: 'amber' },
                  { label: 'Đơn vị', value: unitCount, icon: Briefcase, color: 'purple' }
                ].map((stat, i) => (
                  <div key={i} className="p-3 md:p-6 bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 md:gap-4 hover:border-blue-200 transition-colors">
                    <div className={`p-2 md:p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-lg md:rounded-xl shrink-0 shadow-inner`}>
                      <stat.icon className="w-4 h-4 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-tight truncate block">{stat.label}</span>
                      <div className="text-lg md:text-2xl font-bold text-slate-900 leading-tight mt-0.5">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="flex-1 min-h-[450px]">
                <DataTable 
                  data={filteredRecords} 
                  searchTerm={searchTerm} 
                  onSearchChange={setSearchTerm} 
                />
              </div>
            </div>
          )}
        </div>

        <footer className="hidden md:flex h-10 px-8 border-t border-slate-200 bg-white items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            © 2024 VISUAL LOOKUP SYSTEM • PROFESSIONAL CLOUD v2.3.1
          </p>
          <div className="flex gap-4 text-[10px] text-slate-400 font-bold">
            <span className="text-blue-500">FIREBASE SYNC: ON</span>
            <span className="text-green-500">OFFLINE CACHE: READY</span>
          </div>
        </footer>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-300">
            <div className="relative p-6 md:p-10">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors active:scale-90">
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center mb-8 text-center">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-inner">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">XÁC THỰC ADMIN</h2>
                <p className="text-slate-500 text-xs md:text-sm mt-2 font-medium">Cần quyền quản trị để thay đổi dữ liệu Cloud</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tên đăng nhập</label>
                  <input 
                    type="text" required autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    placeholder="admin"
                    value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mật khẩu</label>
                  <input 
                    type="password" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    placeholder="admin"
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 text-red-600 text-[11px] bg-red-50 p-2.5 rounded-lg border border-red-100 animate-shake">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-xl shadow-slate-200 transition-all text-sm active:scale-95 uppercase tracking-widest mt-2">
                  Xác nhận
                </button>
              </form>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">Gợi ý: admin / admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
