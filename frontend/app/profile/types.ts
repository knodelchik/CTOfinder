// app/profile/types.ts

export interface CarData { 
    id?: number; 
    license_plate: string;
    brand_model: string; 
    year: number; 
    vin: string;
    color: string;
    type: string;
    body: string;
    fuel: string;
    engine_volume: string;
    weight: string;
}

export interface Photo {
  id: number;
  url: string;
}

export interface Station {
  id: number;
  name: string;
  description: string;
  services_list: string;
  address: string;
  phone: string;
  location: { x: number; y: number };
  photos: Photo[];
}

// 👇 Цього не вистачало
export interface UserProfile {
    id: number;
    username: string;
    role: 'client' | 'mechanic';
    phone?: string;
}