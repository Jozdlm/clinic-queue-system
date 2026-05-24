import { Clinic } from './clinic-dto';

export interface Ticket {
  id: number;
  ticket_id: number;
  ticket: {
    id: number;
    code: string;
    status: string;
    clinic_id: number;
    clinic: Clinic;
    patient_id: number;
    patient: {
      id: number;
      name: string;
      created_at: string;
    };
    created_at: string;
    updated_at: string;
  };
  clinic_id: number;
  clinic: Clinic;
  position: number;
  created_at: string;
}

export interface QueueList {
  count: number;
  queue: Ticket[];
}
