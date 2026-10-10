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
  notes: string | null;
  isActive: boolean;
  registeredCode: boolean;
  registeredConduite: boolean;
  registeredPark: boolean;
  feeInscriptionCode: number;
  feeInscriptionConduite: number;
  feeInscriptionPark: number;
  createdAt: string;
  updatedAt: string;
}

/** Client avec son compte calculé (pour les listes) */
export interface ClientWithAccount extends ClientListItem {
  totalDue: number;
  totalPaid: number;
  balance: number;
  examProgress: { type: string; status: string; failures: number }[];
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
