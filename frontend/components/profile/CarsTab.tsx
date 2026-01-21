'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash2, Search, Car as CarIcon, Fuel, Scale } from 'lucide-react';
import { CarData } from '@/app/profile/types'; // Імпорт типу

export default function CarsTab() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [newPlate, setNewPlate] = useState('');
  const [foundCar, setFoundCar] = useState<CarData | null>(null);

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try { const res = await api.get('/my-cars'); setCars(res.data); } catch (e) {}
  };

  const lookupPlate = async () => {
    if (newPlate.length < 3) return toast.error("Введіть номер");
    const toastId = toast.loading("Пошук по базі...");
    try {
        const res = await api.get(`/lookup-car?plate=${newPlate}`);
        if (res.data.error) {
             toast.error(res.data.error, { id: toastId });
             setFoundCar(null);
        } else {
             setFoundCar(res.data);
             toast.success("Авто знайдено!", { id: toastId });
        }
    } catch (e) { toast.error("Помилка з'єднання", { id: toastId }); }
  };

  const saveCar = async () => {
    if (!foundCar) return;
    try {
        await api.post('/my-cars', foundCar);
        toast.success("Авто додано в гараж!");
        setFoundCar(null); setNewPlate(''); loadCars();
    } catch (e) { toast.error("Помилка збереження"); }
  };

  const deleteCar = async (id: number) => {
    if(!confirm("Видалити авто?")) return;
    await api.delete(`/my-cars/${id}`); loadCars(); toast.success("Видалено");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
        {/* ПОШУК АВТО */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-300">
            <h3 className="font-extrabold text-xl mb-4 text-black">Додати авто за держ. номером</h3>
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-blue-600 rounded-l-lg flex flex-col items-center justify-center border-r border-blue-700 z-10">
                        <span className="text-white text-[10px] font-bold">UA</span>
                        <div className="w-6 h-3 bg-blue-400 mt-1"></div>
                        <div className="w-6 h-3 bg-yellow-400"></div>
                    </div>
                    <input 
                        value={newPlate}
                        onChange={e => setNewPlate(e.target.value.toUpperCase())}
                        placeholder="AA 1234 AA"
                        className="w-full pl-16 pr-4 py-4 border-2 border-gray-300 rounded-lg font-mono text-2xl uppercase font-extrabold focus:border-black outline-none tracking-widest text-black placeholder:text-gray-300"
                    />
                </div>
                <button onClick={lookupPlate} className="bg-black text-white px-6 rounded-lg hover:bg-gray-800 font-bold shadow-lg">
                    <Search size={24} />
                </button>
            </div>

            {foundCar && (
                <div className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden shadow-lg animate-in fade-in mt-6">
                    <div className="bg-black text-white p-5 flex justify-between items-center">
                        <div>
                            <h4 className="font-extrabold text-xl tracking-tight">{foundCar.brand_model}</h4>
                            <p className="text-gray-300 text-sm font-bold">{foundCar.license_plate}</p>
                        </div>
                        <span className="bg-white text-black px-3 py-1 rounded-md text-lg font-extrabold">
                            {foundCar.year} рік
                        </span>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                        <div className="border-b-2 border-gray-100 pb-2">
                            <span className="text-black font-extrabold text-xs uppercase block mb-1 opacity-70">VIN Код</span>
                            <span className="font-mono font-bold text-black text-lg">{foundCar.vin || '---'}</span>
                        </div>
                        <div className="border-b-2 border-gray-100 pb-2">
                            <span className="text-black font-extrabold text-xs uppercase block mb-1 opacity-70">Колір</span>
                            <span className="font-bold text-black text-lg">{foundCar.color || '---'}</span>
                        </div>
                        <div className="border-b-2 border-gray-100 pb-2">
                            <span className="text-black font-extrabold text-xs uppercase block mb-1 opacity-70">Двигун / Паливо</span>
                            <div className="flex items-center gap-2">
                                <Fuel size={18} className="text-black"/>
                                <span className="font-bold text-black text-lg">{foundCar.engine_volume} / {foundCar.fuel}</span>
                            </div>
                        </div>
                        <div className="border-b-2 border-gray-100 pb-2">
                            <span className="text-black font-extrabold text-xs uppercase block mb-1 opacity-70">Вага</span>
                            <div className="flex items-center gap-2">
                                <Scale size={18} className="text-black"/>
                                <span className="font-bold text-black text-lg">{foundCar.weight || '---'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <button onClick={saveCar} className="w-full py-4 bg-green-600 text-white rounded-lg font-extrabold text-lg hover:bg-green-700 transition shadow-md">
                            Це моє авто – Зберегти
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* СПИСОК АВТО */}
        <h3 className="font-extrabold text-2xl px-1 text-black">Мій гараж</h3>
        <div className="grid gap-4">
            {cars.length === 0 && <p className="text-gray-600 font-medium px-1">Поки що гараж порожній.</p>}
            {cars.map(car => (
                <div key={car.id} className="bg-white p-5 rounded-xl shadow-md border-2 border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-black transition">
                    <div className="flex items-start gap-5">
                        <div className="bg-black text-white p-4 rounded-xl">
                            <CarIcon size={32}/>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-xl text-black">{car.brand_model}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="bg-gray-100 text-black px-3 py-1 rounded text-sm font-bold border border-gray-300">
                                    {car.license_plate}
                                </span>
                                <span className="bg-gray-100 text-black px-3 py-1 rounded text-sm font-bold">
                                    {car.year} р.
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => car.id && deleteCar(car.id)} className="self-end md:self-center text-red-600 hover:bg-red-50 p-3 rounded-xl transition">
                        <Trash2 size={24}/>
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
}