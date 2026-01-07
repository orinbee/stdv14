
export interface EmployeeRecord {
  stt: number | string;
  fullName: string;
  unit: string;
  parentUnit: string;
  dob: string;
  phone: string;
  status: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
