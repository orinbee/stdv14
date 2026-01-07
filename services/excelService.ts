
import * as XLSX from 'xlsx';
import { EmployeeRecord } from '../types';

export const parseExcelFile = async (file: File): Promise<EmployeeRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Skip header row and map to our interface
        const records: EmployeeRecord[] = jsonData.slice(1).map((row, index) => ({
          stt: row[0] || index + 1,
          fullName: row[1] || '',
          unit: row[2] || '',
          parentUnit: row[3] || '',
          dob: row[4] || '',
          phone: row[5] || '',
          status: row[6] || 'Hoạt động'
        })).filter(item => item.fullName !== ''); // Filter out empty rows

        resolve(records);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
