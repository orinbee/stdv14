
import React, { useState, useMemo } from 'react';
import { EmployeeRecord } from '../types';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

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
    const s = status.toLowerCase();
    if (s.includes('đã đăng nhập') || s.includes('hoạt động') || s.includes('active')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (s.includes('chưa đăng nhập') || s.includes('nghỉ') || s.includes('inactive')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm thông tin (Họ tên, đơn vị, SĐT...)"
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Tìm thấy: <span className="font-semibold text-slate-900">{data.length}</span> bản ghi</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
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
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => handleSort(col.key as keyof EmployeeRecord)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig?.key === col.key ? (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length > 0 ? (
              sortedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{row.stt}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.fullName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.unit}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.parentUnit}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.dob}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{row.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(row.status)} whitespace-nowrap`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Không tìm thấy dữ liệu phù hợp với từ khóa "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
