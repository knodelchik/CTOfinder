'use client';
import { Star } from 'lucide-react';

interface Review { 
    id: number; 
    author_name: string; 
    rating: number; 
    comment: string; 
    created_at: string; 
}

export default function StationReviews({ reviews }: { reviews: Review[] }) {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-10 text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star size={32} className="text-gray-300"/>
                </div>
                <h3 className="font-bold text-gray-900">Ще немає відгуків</h3>
                <p className="text-gray-500 text-sm mt-1">Будьте першим, хто оцінить роботу цього майстра!</p>
            </div>
        );
    }

    const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-xl text-black">Відгуки клієнтів</h3>
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                    <Star size={18} className="fill-yellow-400 text-yellow-400"/>
                    <span className="font-black text-lg text-yellow-700">{averageRating}</span>
                    <span className="text-xs text-yellow-600 font-bold">({reviews.length})</span>
                </div>
            </div>
            
            <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm uppercase">
                                    {review.author_name.charAt(0)}
                                </div>
                                <div>
                                    <span className="font-bold text-base text-black block">{review.author_name}</span>
                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={12} 
                                                className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed font-medium pl-[52px]">
                            {review.comment}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}