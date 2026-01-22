'use client';

import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
    requestId: number;
    targetName: string; // Ім'я того, кого оцінюємо (Майстер або Клієнт)
    reviewType?: 'for_mechanic' | 'for_client'; // 👇 НОВИЙ ПРОП
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReviewModal({ 
    requestId, 
    targetName, 
    reviewType = 'for_mechanic', 
    onClose, 
    onSuccess 
}: ReviewModalProps) {
    
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return toast.error("Будь ласка, поставте оцінку");
        setLoading(true);
        try {
            // 👇 Визначаємо правильний URL
            const url = reviewType === 'for_client' ? '/reviews/client/' : '/reviews/';
            
            await api.post(url, {
                request_id: requestId,
                rating: rating,
                comment: comment
            });
            toast.success("Відгук надіслано!");
            onSuccess();
        } catch (e: any) {
            console.error(e);
            if (e.response?.status === 409) {
                toast.error("Ви вже залишили відгук");
            } else {
                toast.error("Помилка збереження");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-in zoom-in-95 duration-200 shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition"><X/></button>

                <div className="text-center mb-6 pt-2">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl shadow-inner">★</div>
                    <h3 className="text-xl font-extrabold text-black">Оцінити {reviewType === 'for_client' ? 'клієнта' : 'майстра'}</h3>
                    <p className="text-gray-500 text-sm mt-1 font-medium">{targetName}</p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="transition transform hover:scale-110 active:scale-95 focus:outline-none"
                        >
                            <Star 
                                size={36} 
                                className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`}
                            />
                        </button>
                    ))}
                </div>

                <textarea 
                    placeholder="Ваш коментар..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] mb-4 focus:ring-2 focus:ring-black outline-none text-black transition resize-none"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />

                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2 shadow-lg"
                >
                    {loading ? <Loader2 className="animate-spin"/> : 'Надіслати'}
                </button>
            </div>
        </div>
    );
}