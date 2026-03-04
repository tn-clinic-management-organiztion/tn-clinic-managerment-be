export interface JwtPayload {
  sub: string;    
  username?: string;
  role?: string;
  user_type: 'STAFF' | 'PATIENT' | 'ADMIN';
  staff_id?: string;   
  patient_id?: string; // for patients
  assigned_room_id?: number; // for staff
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}