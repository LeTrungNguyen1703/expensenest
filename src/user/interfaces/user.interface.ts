export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  is_active: boolean | null;
}

export interface UserResponse {
  user_id: number;
  username: string;
  email: string;
  full_name: string | null;
  created_at: Date | null;
  updated_at?: Date | null;
  is_active: boolean | null;
}
