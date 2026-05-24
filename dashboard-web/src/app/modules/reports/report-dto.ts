export interface ReportByStatus {
  report: {
    status: string;
    total: number;
  }[];
}

export interface ReportByClinic {
  report: {
    clinic_name: string;
    total: number;
  }[];
}

export interface ByClinic {
  clinic: string;
  tickets: number;
}

export interface ByStatus {
  status: string;
  value: number;
  color: string;
}
