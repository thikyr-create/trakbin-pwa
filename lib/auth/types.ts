export type Role = 'caretaker' | 'company' | 'driver' | 'admin' | 'government';
export type AccountType = 'Caretaker' | 'Operations';

export interface LoginInput {
  accountType: AccountType;
  buildingId?: string;
  passcode?: string;
  email?: string;
  password?: string;
}

export interface CaretakerRegisterInput {
  passcode: string;
  buildingType: string;
  officialAddress: string;
  gpsAddress: string;
  latitude: number;
  longitude: number;
  numberOfFlats?: string;
  numberOfShops?: string;
  estate?: string;
}

export interface CompanyRegisterInput {
  email: string;
  password: string;
  companyName: string;
  licenseNumber: string;
  operatingAddress: string;
  contactNumber: string;
}

export interface AuthResult {
  ok: boolean;
  message: string;
  role?: Role;
}

export interface RegisterCaretakerResult {
  ok: boolean;
  message: string;
  buildingId?: string;
}