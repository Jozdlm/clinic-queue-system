export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  code: number;
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  };
}
