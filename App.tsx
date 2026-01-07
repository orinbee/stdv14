
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

  useEffect(() => {
    const initData = async () => {
      if (!isFirebaseConfigured()) {
        setError("Firebase chưa được cấu hình. Ứng dụng đang chạy ở chế độ Demo (Offline).");
        loadMockData();
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const cloudData = await fetchRecordsFromCloud();
        if (cloudData) {
          setRecords(cloudData.data);
          setLastUpdated(cloudData.lastUpdated);
        } else {
          loadMockData();
        }
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra khi kết nối với Firebase.");
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
    if (loginUsername === 'admin' && loginPassword === 'Tuqn@123') {
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
    setError(null);

    try {
      const data = await parseExcelFile(file);
      const now = new Date();
      const timeString = `${now.toLocaleTimeString('vi-VN')} - ${now.toLocaleDateString('vi-VN')}`;
      
      await saveRecordsToCloud(data, timeString);
      
      setRecords(data);
      setLastUpdated(timeString);
      
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Có lỗi xảy ra khi đồng bộ với Cloud.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  }, [role, isLoggedIn]);

  const filteredRecords = useMemo(() => {
    return records.filter(item => 
      Object.values(item).some(val => 
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [records, searchTerm]);

  const totalPeople = filteredRecords.length;
  const loggedInCount = filteredRecords.filter(r => r.status.toLowerCase().includes('đã đăng nhập')).length;
  const notLoggedInCount = filteredRecords.filter(r => r.status.toLowerCase().includes('chưa đăng nhập')).length;
  const unitCount = new Set(filteredRecords.map(r => r.unit)).size;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 overflow-hidden font-['Inter']">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-full md:w-[10%] min-w-[110px] bg-slate-900 text-white flex flex-col items-center py-8 gap-8 border-r border-slate-800 z-10 transition-all">
        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
          <Database className="w-6 h-6" />
        </div>
        
        <nav className="flex flex-col gap-6 w-full items-center">
          <button className="p-3 text-blue-400 bg-blue-400/10 rounded-lg group relative" title="Bảng điều khiển">
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all group relative" title="Người dùng">
            <Users className="w-6 h-6" />
          </button>
          <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all group relative" title="Cài đặt">
            <Settings className="w-6 h-6" />
          </button>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-6 w-full px-2 pb-4">
          <button 
            onClick={isLoggedIn ? handleLogout : () => setShowLoginModal(true)}
            className={`flex flex-col items-center gap-1 group transition-all p-3 rounded-xl w-full max-w-[70px] ${isLoggedIn ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-slate-800 text-slate-500 hover:text-slate-200'}`}
          >
            {isLoggedIn ? (
              <>
                <ShieldCheck className="w-6 h-6 group-hover:hidden" />
                <LogOut className="w-6 h-6 hidden group-hover:block" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Admin</span>
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Login</span>
              </>
            )}
          </button>

          <div className="relative group w-full flex justify-center">
            {isLoggedIn && role === UserRole.ADMIN ? (
              <label className="cursor-pointer p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex flex-col items-center gap-2 w-full max-w-[70px]">
                <FileUp className="w-6 h-6" />
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
                <span className="text-[9px] font-bold uppercase">Import</span>
              </label>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="p-4 bg-slate-800 text-slate-600 rounded-2xl cursor-pointer hover:bg-slate-700 hover:text-slate-400 flex flex-col items-center gap-2 w-full max-w-[70px] transition-all"
                title="Đăng nhập Admin để tải lên"
              >
                <Lock className="w-6 h-6" />
                <span className="text-[9px] font-bold uppercase">Locked</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT */}
      <main className="w-full md:w-[90%] h-full flex flex-col overflow-hidden">
        {/* Firebase Config Warning Banner */}
        {isConfigWarningVisible && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-8 flex items-center justify-between animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3 text-amber-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <span className="font-bold">Yêu cầu cấu hình:</span> Vui lòng cập nhật thông tin Firebase trong file <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">services/firebaseService.ts</code> để đồng bộ dữ liệu Cloud.
              </div>
            </div>
            <button 
              onClick={() => setIsConfigWarningVisible(false)}
              className="text-amber-400 hover:text-amber-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Trực quan theo dõi & Tra cứu</h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">v2.1.0 Cloud</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${isFirebaseConfigured() ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
              <Cloud className="w-3.5 h-3.5" />
              <span>Dữ liệu: {isFirebaseConfigured() ? 'Firebase Cloud' : 'Offline Mode'}</span>
            </div>

            {isLoggedIn && role === UserRole.ADMIN && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs font-semibold">Quản trị</span>
              </div>
            )}
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900">{isLoggedIn ? 'Quản trị viên' : 'Khách truy cập'}</span>
                <span className="text-xs text-slate-500">{isLoggedIn ? 'admin@system.local' : 'guest@viewer.local'}</span>
              </div>
              <div className={`w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center ${isLoggedIn ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isLoggedIn ? 'admin' : 'guest'}`} 
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Update Notification Ticker */}
        {lastUpdated && (
          <div className="bg-red-600 h-8 flex items-center overflow-hidden shrink-0 border-y border-red-700">
            <div className="flex items-center gap-2 px-4 bg-red-700 h-full text-white font-bold text-xs z-10 shadow-lg whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              <span>CẬP NHẬT:</span>
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
              <div className="absolute whitespace-nowrap animate-marquee text-white font-medium text-sm flex items-center gap-8 pl-[100%]">
                <span className="flex items-center gap-2">
                  <span className="text-red-200 font-bold">•</span> 
                  Dữ liệu được cập nhật mới nhất vào lúc: <span className="font-bold underline tracking-wider">{lastUpdated}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-red-200 font-bold">•</span> 
                  Trạng thái: <span className="font-bold">{isFirebaseConfigured() ? 'Đã đồng bộ Cloud' : 'Chế độ Demo (Chưa cấu hình)'}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-8 overflow-y-auto">
          <style>
            {`
              @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-200%); } }
              .animate-marquee { animation: marquee 35s linear infinite; }
            `}
          </style>

          {error && (
            <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <Info className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-bold mb-1">Lỗi hệ thống / Cấu hình</h3>
                  <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                  {error.includes("permission-denied") || error.includes("YOUR_API_KEY") ? (
                    <div className="mt-4 p-4 bg-white border border-red-100 rounded-xl space-y-3">
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Hướng dẫn khắc phục:</p>
                      <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                        <li>Truy cập <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink className="w-3 h-3"/></a></li>
                        <li>Bật <b>Cloud Firestore API</b> trong mục "APIs & Services".</li>
                        <li>Tạo Database và đặt Rules: <code className="bg-slate-100 px-1 rounded">allow read, write: if true;</code></li>
                        <li>Copy cấu hình vào <code className="bg-slate-100 px-1 rounded italic font-mono">services/firebaseService.ts</code></li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Đang kết nối Cloud...</p>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-6">
              {/* Dashboard / Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-blue-200 transition-colors">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng số (Tìm thấy)</span>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalPeople}</div>
                  </div>
                </div>
                
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-green-200 transition-colors">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đã đăng nhập</span>
                    <div className="text-2xl font-bold text-green-600 mt-0.5">{loggedInCount}</div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-amber-200 transition-colors">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <UserMinus className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Chưa đăng nhập</span>
                    <div className="text-2xl font-bold text-amber-600 mt-0.5">{notLoggedInCount}</div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:border-purple-200 transition-colors">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Số đơn vị</span>
                    <div className="text-2xl font-bold text-purple-600 mt-0.5">{unitCount}</div>
                  </div>
                </div>
              </div>

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

        <footer className="h-10 px-8 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            © 2024 Hệ thống quản lý thông tin trực quan • Google Cloud Console required
          </p>
          <div className="flex gap-4 text-[10px] text-slate-400 font-medium">
            <span className="hover:text-slate-600 cursor-pointer">Bảo mật</span>
            <span className="hover:text-slate-600 cursor-pointer">Điều khoản</span>
          </div>
        </footer>
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="relative p-8">
              <button 
                onClick={() => { setShowLoginModal(false); setLoginError(''); }}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Yêu cầu đăng nhập</h2>
                <p className="text-slate-500 text-center mt-2">Đăng nhập quyền Admin để đồng bộ dữ liệu Cloud.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</label>
                  <input 
                    type="text"
                    required
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập 'admin'"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
                  <input 
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập 'admin'"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    <Info className="w-4 h-4" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Đăng nhập
                </button>
              </form>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-xs text-slate-400 italic">Gợi ý: admin / admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
