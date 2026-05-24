export interface Clinic {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface ClinicList {
  clinics: Clinic[];
}
