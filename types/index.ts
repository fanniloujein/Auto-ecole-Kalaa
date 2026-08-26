export interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp: string;
  cin: string;
  birthDate: string | null;
  address: string | null;
  licenseType: string;
  registrationDate: string;
  startDate: string | null;
  totalSessions: number;
  doneSessions: number;
  totalPrice: number;
  paidAmount: number;
  notes: string | null;
  isActive: boolean;
  packageId: string | null;
  packageName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackageListItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sessionsCount: number;
  isActive: boolean;
}

export interface VehicleListItem {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  licenseType: string;
  isActive: boolean;
}

export interface InstructorListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
}
