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