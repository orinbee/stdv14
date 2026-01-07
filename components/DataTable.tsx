
import React, { useState, useMemo } from 'react';
import { EmployeeRecord } from '../types';
import { Search, Filter, ChevronDown, ChevronUp, User, MapPin, Phone, Calendar, Info } from 'lucide-react';

interface DataTableProps {
  data: EmployeeRecord[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, searchTerm, onSearchChange }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof EmployeeRecord; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    const result = [...data];
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, sortConfig]);

  const handleSort = (key: keyof EmployeeRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status: string) => {
    const s = String(status).toLowerCase();
    if (s.includes('đã đăng nhập') || s.includes('hoạt động') || s.includes('active')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (s.includes('chưa đăng nhập') || s.includes('nghỉ') || s.includes('inactive')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Search Bar - Sticky on top */}
      <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh tên, SĐT, đơn vị..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50/50 px-4 py-2 rounded-full border border-blue-100 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            <span>Kết quả: <span className="font-bold text-blue-700">{data.length}</span></span>
          </div>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-widest border-b border-slate-100">
              {[
                { label: 'STT', key: 'stt' },
                { label: 'Họ và tên', key: 'fullName' },
                { label: 'Đơn vị', key: 'unit' },
                { label: 'Đơn vị cha', key: 'parentUnit' },
                { label: 'Ngày sinh', key: 'dob' },
                { label: 'Số điện thoại', key: 'phone' },
                { label: 'Trạng thái', key: 'status' }
              ].map((col) => (
                <th 
                  key={col.key}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort(col.key as keyof EmployeeRecord)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedData.length > 0 ? (
              sortedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium">{row.stt}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.fullName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.unit}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.parentUnit}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{row.dob}</td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-mono font-medium">{row.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(row.status)} whitespace-nowrap uppercase`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic">Không có dữ liệu phù hợp</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Card List */}
      <div className="md:hidden flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
        {sortedData.length > 0 ? (
          sortedData.map((row, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {row.stt}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{row.fullName}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(row.status)} uppercase mt-1`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div className="text-xs">
                    <p className="font-medium">{row.unit}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{row.parentUnit}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono font-bold text-blue-700">{row.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs">{row.dob}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Không tìm thấy kết quả nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
