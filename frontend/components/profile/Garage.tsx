'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, Loader2, Info, CheckCircle } from 'lucide-react';
import { CarData } from '../../app/profile/types';

export default function Garage() {
    const [cars, setCars] = useState<CarData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Стан пошуку
    const [searchPlate, setSearchPlate] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Початковий стан (порожній)
    const initialCarState: CarData = {
        license_plate: '',
        brand_model: '',
        year: new Date().getFullYear(),
        vin: '',
        color: '',
        type: '',
        body: '',
        fuel: '',
        engine_volume: '',
        weight: ''
    };
    
    const [newCar, setNewCar] = useState<CarData>(initialCarState);
    const [mode, setMode] = useState<'search' | 'edit'>('search');

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        try {
            const res = await api.get('/my-cars');
            setCars(res.data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleDeleteCar = async (id: number) => {
        if(!confirm("Видалити авто з гаража?")) return;
        try {
            await api.delete(`/my-cars/${id}`);
            fetchCars();
            toast.success("Авто видалено");
        } catch(e) { toast.error("Помилка видалення"); }
    };

    // --- ЛОГІКА ПОШУКУ (Використовує твій існуючий lookup-car) ---
    const handleLookup = async () => {
        if (!searchPlate || searchPlate.length < 3) {
            toast.error("Введіть повний номер");
            return;
        }
        setIsSearching(true);
        try {
            // 👇 ТУТ ВИПРАВЛЕНО: використовуємо твій ендпоінт /lookup-car
            const res = await api.get(`/lookup-car`, { params: { plate: searchPlate } });
            
            if (res.data.error) {
                // Якщо бекенд повернув {"error": ...}
                toast.error(res.data.error);
                setNewCar(prev => ({ ...initialCarState, license_plate: searchPlate.toUpperCase() }));
            } else {
                // Якщо знайшли - заповнюємо форму даними зі скрапера
                setNewCar(res.data);
                toast.success("Авто знайдено! Перевірте дані.");
            }
            setMode('edit'); // Перемикаємо на перегляд даних
            
        } catch (e: any) {
            console.error(e);
            toast.error("Помилка при пошуку. Введіть дані вручну.");
            setNewCar(prev => ({ ...initialCarState, license_plate: searchPlate.toUpperCase() }));
            setMode('edit');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSaveCar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/my-cars', newCar);
            toast.success("Авто додано успішно!");
            setNewCar(initialCarState);
            setSearchPlate('');
            setMode('search'); 
            fetchCars();
        } catch (e) { toast.error("Помилка збереження"); }
    };

    if (loading) return <div className="text-center py-4"><Loader2 className="animate-spin inline"/> Завантаження гаража...</div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* СПИСОК АВТО */}
            <div className="grid gap-4 mb-8">
                {cars.map(car => (
                    <div key={car.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-extrabold text-black">{car.brand_model}</h3>
                                {car.color && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 border border-gray-200 capitalize">
                                        {car.color}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm font-bold text-gray-500 mt-2">
                                <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-black">{car.license_plate}</span>
                                <span>{car.year} р.</span>
                                {car.fuel && <span>• {car.fuel}</span>}
                                {car.engine_volume && <span>• {car.engine_volume}</span>}
                            </div>
                            {car.vin && <div className="text-xs text-gray-400 mt-1 font-mono">VIN: {car.vin}</div>}
                        </div>
                        <button onClick={() => handleDeleteCar(car.id!)} className="text-red-500 hover:bg-red-50 p-3 rounded-xl transition self-end sm:self-center">
                            <Trash2 size={20}/>
                        </button>
                    </div>
                ))}
                {cars.length === 0 && <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">Гараж порожній</div>}
            </div>

            {/* ФОРМА */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                <h3 className="font-bold text-black mb-4 text-lg flex items-center gap-2">
                    <Plus size={20} className="bg-black text-white rounded-full p-0.5"/> Додати авто
                </h3>

                {mode === 'search' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Введіть держ. номер</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="AA1234AA"
                                    className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-black uppercase focus:ring-2 focus:ring-black outline-none text-xl tracking-widest"
                                    value={searchPlate}
                                    onChange={e => setSearchPlate(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                />
                                <button 
                                    onClick={handleLookup}
                                    disabled={isSearching}
                                    className="bg-black text-white px-6 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {isSearching ? <Loader2 className="animate-spin"/> : <Search/>}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Info size={12}/> Ми знайдемо VIN, колір та об'єм двигуна автоматично.
                            </p>
                        </div>
                        <div className="text-center">
                            <button onClick={() => { setNewCar(initialCarState); setMode('edit'); }} className="text-sm text-gray-500 hover:text-black underline font-medium">
                                Пропустити пошук і ввести вручну
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSaveCar} className="grid gap-4">
                        {/* Підтвердження даних */}
                        <div className="bg-green-50 p-4 rounded-xl mb-2 border border-green-100 flex gap-3 items-start">
                             <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18}/>
                             <div>
                                <p className="text-sm text-green-800 font-bold">Дані отримано!</p>
                                <p className="text-xs text-green-700">Перевірте правильність перед збереженням.</p>
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Марка та Модель</label>
                                <input required type="text" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black"
                                    value={newCar.brand_model} onChange={e => setNewCar({...newCar, brand_model: e.target.value})} />
                            </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Держ. Номер</label>
                                <input required type="text" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black uppercase"
                                    value={newCar.license_plate} onChange={e => setNewCar({...newCar, license_plate: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Рік</label>
                                <input required type="number" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black"
                                    value={newCar.year} onChange={e => setNewCar({...newCar, year: Number(e.target.value)})} />
                            </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Паливо</label>
                                <input type="text" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black"
                                    value={newCar.fuel || ''} onChange={e => setNewCar({...newCar, fuel: e.target.value})} placeholder="Бензин"/>
                            </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Об'єм</label>
                                <input type="text" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black"
                                    value={newCar.engine_volume || ''} onChange={e => setNewCar({...newCar, engine_volume: e.target.value})} placeholder="2.0"/>
                            </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Колір</label>
                                <input type="text" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black"
                                    value={newCar.color || ''} onChange={e => setNewCar({...newCar, color: e.target.value})} placeholder="Чорний"/>
                            </div>
                        </div>
                        
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">VIN Код</label>
                             <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-black uppercase"
                                    value={newCar.vin || ''} onChange={e => setNewCar({...newCar, vin: e.target.value})} placeholder="XXXXXXXXXXXXXXXXX"/>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setMode('search')} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">
                                Скасувати
                            </button>
                            <button type="submit" className="flex-[2] bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition">
                                Зберегти в гараж
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}