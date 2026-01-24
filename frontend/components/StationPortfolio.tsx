'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

interface Photo { id: number; url: string; }

export default function StationPortfolio({ photos }: { photos: Photo[] }) {
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    if (!photos || photos.length === 0) return null;

    return (
        <>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                <h3 className="font-extrabold text-lg text-black mb-4">Портфоліо робіт</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {photos.map(photo => (
                        <div 
                            key={photo.id} 
                            onClick={() => setFullScreenImage(photo.url)}
                            className="aspect-square relative rounded-xl overflow-hidden cursor-zoom-in group"
                        >
                            <img src={photo.url} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"/>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {fullScreenImage && (
                <div 
                    className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
                    onClick={() => setFullScreenImage(null)}
                >
                    <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                        <X size={24}/>
                    </button>
                    <img 
                        src={fullScreenImage} 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </>
    );
}