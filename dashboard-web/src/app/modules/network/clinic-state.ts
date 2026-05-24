export interface ClinicState {
  clinic_id: number;
  clinic_name: string;
  current_ticket: string;
  next_ticket: string;
  waiting_count: number;
}

export interface ClinicStateList {
  clinics: ClinicState[];
}
