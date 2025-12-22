

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAnimeList } from "@/hooks/use-anime"; // Fixed import

// --- Types ---
interface Image {
    id: string;
    url: string;
    rotation: number;
    title: string;
}

interface Album {
    id: string;
    title: string;
    color: string;
    initialPages: Image[][];
}

interface RackData {
    id: string;
    albums: Album[];
}

// --- Pure SVG Icons (Matching Archive Gallery Design) ---
const IconChevronLeft = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>
);
const IconChevronRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);
const IconX = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

// --- Content Generators ---
const generateImagesFromCategory = (category: string, animeList: any[]): Image[] => {
    const matching = animeList.filter(a => a.category === category);
    return matching.map((a: any, i: number) => ({
        id: `img-${a.id}`,
        url: a.imageUrl || `https://picsum.photos/seed/${a.id}/600/800`,
        rotation: Math.random() * 6 - 3,
        title: a.title || "Untitled"
    }));
};

const generateImagesFromTag = (tag: string, animeList: any[]): Image[] => {
    // Filter anime by tag and map to images
    const matching = animeList.filter(a => a.tags?.includes(tag));
    // Flatten all images? Or just take cover images? Let's take cover images.
    return matching.map((a: any, i: number) => ({
        id: `img-${a.id}`,
        url: a.imageUrl || `https://picsum.photos/seed/${a.id}/600/800`,
        rotation: Math.random() * 6 - 3, // Store random rotation permanently
        title: a.title || "Untitled"
    }));
};



// --- View Components ---

const AlbumCover = ({ album, onClick }: { album: Album; onClick: (a: Album) => void }) => (
    <div
        onClick={() => onClick(album)}
        className={`perspective-container relative w-[14vw] h-[19vw] max-w-[200px] max-h-[280px] min-w-[100px] min-h-[140px] 
               ${album.color} border border-white/10 cursor-pointer 
               transform transition-all duration-500 ease-out
               hover:scale-125 hover:z-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]
               group flex-shrink-0 mx-8 shadow-2xl origin-bottom`}
        style={{ transformStyle: 'preserve-3d' }}
    >
        <div className="absolute inset-0 border-[4px] border-black/20 pointer-events-none" />
        <div className="absolute inset-0 p-4 flex flex-col justify-end items-center">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 border border-white/10 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-[1.2vw] sm:text-[9px] font-mono text-white/90 tracking-[0.3em] uppercase truncate w-full block text-center shadow-sm">
                    {album.title}
                </span>
            </div>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]" />
    </div>
);

const Rack = ({ rack, onAlbumClick }: { rack: RackData; onAlbumClick: (a: Album) => void }) => (
    <div className="relative w-full mb-32 flex flex-col items-center">
        {/* Books Row */}
        <div className="flex justify-center items-end relative z-20 w-full max-w-[90vw] overflow-visible pb-[2px]">
            {rack.albums.map((album) => (
                <AlbumCover key={album.id} album={album} onClick={onAlbumClick} />
            ))}
        </div>

        {/* Shelf Visual */}
        <div className="w-full max-w-[95vw] relative z-10">
            {/* Top surface of shelf */}
            <div className="h-4 w-full bg-[#1a1a1a] transform origin-bottom skew-x-[45deg] scale-y-50 absolute -top-4 left-0 right-0 brightness-150 contrast-125" />
            {/* Front face of shelf */}
            <div className="h-8 w-full bg-[#1a1a1a] shadow-[0_20px_40px_rgba(0,0,0,0.8)] relative z-20" />
            {/* Shadow below shelf */}
            <div className="absolute top-8 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-0" />
        </div>
    </div>
);

// Helper for layout positions
const getGridPositionClass = (index: number, total: number) => {
    // Explicitly enforce the requested order: TL -> TR -> BL -> BR
    if (index === 0) return "col-start-1 row-start-1 self-center justify-self-center";
    if (index === 1) return "col-start-2 row-start-1 self-center justify-self-center";
    if (index === 2) return "col-start-1 row-start-2 self-center justify-self-center";
    if (index === 3) return "col-start-2 row-start-2 self-center justify-self-center";

    return "self-center justify-self-center";
};

// Helper for dynamic font size
const getFontSizeClass = (length: number) => {
    // Prioritize readability/size: allow wrapping to 2-3 lines
    if (length <= 25) return "text-[12px]";
    if (length <= 50) return "text-[10px]";
    return "text-[9px]";
};

const BookView = ({ album, onClose }: { album: Album; onClose: () => void }) => {
    const [pages, setPages] = useState<Image[][]>(album.initialPages);
    const [index, setIndex] = useState(0);

    const flipNext = (e: React.MouseEvent) => {
        e?.stopPropagation();
        if (index + 1 >= pages.length) {
            // This logic needs to be updated if we want to dynamically load more images for a tag
            // For now, we'll just stop at the end of initialPages
            return;
        }
        setIndex(index + 1);
    };

    const flipPrev = (e: React.MouseEvent) => {
        e?.stopPropagation();
        if (index > 0) setIndex(index - 1);
    };

    const currentBatch = pages[index];
    const leftPage = currentBatch.slice(0, 4);
    const rightPage = currentBatch.slice(4, 8);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-md animate-in fade-in duration-500"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl aspect-[1.4/1] md:aspect-[1.6/1]"
            >
                {/* Fake Page Thickness / Fanning Edges */}
                <div className="absolute top-[2px] bottom-[2px] left-[-6px] right-[-6px] bg-[#f8f6f1] border-x border-[#d6d3cd] rounded-sm shadow-sm z-0" />
                <div className="absolute top-[4px] bottom-[4px] left-[-10px] right-[-10px] bg-[#f4f1eb] border-x border-[#d6d3cd] rounded-sm shadow-sm -z-10" />
                <div className="absolute top-[6px] bottom-[6px] left-[-14px] right-[-14px] bg-[#efebe4] border-x border-[#d6d3cd] rounded-sm shadow-lg -z-20" />

                {/* Main Book Container */}
                <div className="relative w-full h-full flex bg-[#fdfbf7] rounded-sm shadow-2xl overflow-hidden z-10">

                    {/* Left Page Side */}
                    <div className="flex-1 relative border-r border-black/5 group/left">
                        {/* Curvature Gradient Overlay - Behind Content */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5 pointer-events-none z-10" />

                        {/* Prev Button - Total Edge Positioned (Thinner) */}
                        {index > 0 && (
                            <button
                                onClick={flipPrev}
                                className="absolute left-0 top-0 bottom-0 z-50 px-0 sm:px-1 flex items-center justify-center text-stone-300 hover:text-stone-800 hover:bg-black/5 transition-all focus:outline-none w-8 sm:w-12"
                            >
                                <IconChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 transform group-active/left:scale-90 transition-transform" />
                            </button>
                        )}



                        {/* Main Left Page Content */}
                        <div className="absolute inset-0 flex flex-col p-6 sm:p-10 md:p-12 pr-8 sm:pr-14 z-20">
                            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6 transition-opacity duration-300">
                                {leftPage.map((img, i) => (
                                    <div
                                        key={img.id}
                                        className={`relative bg-white p-2 pb-10 shadow-md hover:shadow-2xl transition-all duration-500 delay-75 
        rotate-[var(--rotation)] hover:rotate-0 hover:scale-110 hover:-translate-y-2 hover:z-50 transform-gpu cursor-pointer ${getGridPositionClass(i, leftPage.length)}`}
                                        style={{ '--rotation': `${img.rotation}deg` } as React.CSSProperties}
                                    >
                                        <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                                            <img
                                                src={img.url}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                alt="gallery-img"
                                            />
                                        </div>
                                        <div className="absolute bottom-1 left-2 right-2 text-center flex items-center justify-center min-h-[32px]">
                                            <p className={`${getFontSizeClass(img.title.length)} text-gray-800 font-bold tracking-widest leading-tight opacity-80 line-clamp-3 whitespace-normal`} style={{ fontFamily: 'monospace' }}>
                                                {img.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-center items-center text-gray-300 font-mono text-xs tracking-widest uppercase">
                                <span>Page {index * 2 + 1}</span>
                            </div>
                        </div>
                    </div>

                    {/* Central Spine */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[60px] -ml-[30px] z-30 pointer-events-none">
                        {/* Simple Spine Highlight */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent blur-sm" />
                        <div className="absolute inset-0 border-r border-black/5" />
                    </div>

                    {/* Right Page Side */}
                    <div className="flex-1 relative group/right">
                        {/* Curvature Gradient Overlay - Behind Content */}
                        <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-transparent to-black/5 pointer-events-none z-10" />

                        {/* Next Button - Total Edge Positioned (Thinner) */}
                        <button
                            onClick={flipNext}
                            className="absolute right-0 top-0 bottom-0 z-50 px-0 sm:px-1 flex items-center justify-center text-stone-300 hover:text-stone-800 hover:bg-black/5 transition-all focus:outline-none w-8 sm:w-12"
                        >
                            <IconChevronRight className="w-8 h-8 sm:w-10 sm:h-10 transform group-active/right:scale-90 transition-transform" />
                        </button>

                        {/* Main Right Page Content */}
                        <div className="absolute inset-0 flex flex-col p-6 sm:p-10 md:p-12 pl-8 sm:pl-14 z-20">
                            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6 transition-opacity duration-300">
                                {rightPage.map((img, i) => (
                                    <div
                                        key={img.id}
                                        className={`relative bg-white p-2 pb-10 shadow-md hover:shadow-2xl transition-all duration-500 delay-75
        rotate-[var(--rotation)] hover:rotate-0 hover:scale-110 hover:-translate-y-2 hover:z-50 transform-gpu cursor-pointer ${getGridPositionClass(i, rightPage.length)}`}
                                        style={{ '--rotation': `${img.rotation}deg` } as React.CSSProperties}
                                    >
                                        <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                                            <img
                                                src={img.url}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                alt="gallery-img"
                                            />
                                        </div>
                                        <div className="absolute bottom-1 left-2 right-2 text-center flex items-center justify-center min-h-[32px]">
                                            <p className={`${getFontSizeClass(img.title.length)} text-gray-800 font-bold tracking-widest leading-tight opacity-80 line-clamp-3 whitespace-normal`} style={{ fontFamily: 'monospace' }}>
                                                {img.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-center items-center text-gray-300 font-mono text-xs tracking-widest uppercase">
                                <span>Page {index * 2 + 2}</span>
                            </div>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors group"
                    >
                        <IconX />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function InfiniteShelf() {
    const { data: animeList = [], isLoading: isListLoading } = useAnimeList();
    const [racks, setRacks] = useState<RackData[]>([]);
    const [selected, setSelected] = useState<Album | null>(null);
    const [booksPerRow, setBooksPerRow] = useState(3);
    const [isReady, setIsReady] = useState(false);
    const [location, setLocation] = useLocation();

    // Extract unique tags and create "Albums" from them
    const allTags = Array.from(new Set(animeList?.flatMap(a => a.tags || []) || [])).sort();

    const handleResize = useCallback(() => {
        if (typeof window === 'undefined') return;
        const width = window.innerWidth;
        let count = 2;
        if (width > 1800) count = 6;
        else if (width > 1400) count = 5;
        else if (width > 1024) count = 4;
        else if (width > 640) count = 3;
        setBooksPerRow(count);
    }, []);

    useEffect(() => {
        handleResize();
        setIsReady(true);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    // Build Racks based on Categories & Tags
    useEffect(() => {
        if (!isReady || isListLoading) return;

        if (animeList.length === 0) {
            setRacks([]);
            return;
        }

        // Helper to chunk array
        const chunkArray = <T,>(array: T[], size: number): T[][] => {
            const result: T[][] = [];
            for (let i = 0; i < array.length; i += size) {
                result.push(array.slice(i, i + size));
            }
            return result;
        };

        const newRacks: RackData[] = [];

        // 1. Special Rack (Watched & Plan to Watch & Master Data)
        const watchedImages = generateImagesFromCategory('watched', animeList);
        const plannedImages = generateImagesFromCategory('plan_to_watch', animeList);

        // Master Data: All Anime
        const masterImages = animeList.map((a: any) => ({
            id: `img-${a.id}`,
            url: a.imageUrl || `https://picsum.photos/seed/${a.id}/600/800`,
            rotation: Math.random() * 6 - 3,
            title: a.title || "Untitled"
        }));

        const specialRack: RackData = {
            id: 'rack-special-0',
            albums: [
                {
                    id: 'album-special-watched',
                    title: 'EVERYTHING WATCHED',
                    color: 'bg-emerald-950', // Distinct color for Watched
                    initialPages: watchedImages.length > 0 ? chunkArray(watchedImages, 8) : [[]]
                },
                {
                    id: 'album-special-planning',
                    title: 'WATCH LIST',
                    color: 'bg-blue-950', // Distinct color for Planning
                    initialPages: plannedImages.length > 0 ? chunkArray(plannedImages, 8) : [[]]
                },
                {
                    id: 'album-special-master',
                    title: 'MASTER DATA',
                    color: 'bg-slate-950', // Darkest color for Master
                    initialPages: masterImages.length > 0 ? chunkArray(masterImages, 8) : [[]]
                }
            ]
        };
        newRacks.push(specialRack);

        // 2. Tag Racks
        if (allTags.length > 0) {
            const tagAlbums: Album[] = allTags.map((tag: string, i: number) => {
                const allImages = generateImagesFromTag(tag, animeList);
                const pagedImages = allImages.length > 0 ? chunkArray(allImages, 8) : [[]];

                return {
                    id: `album-${tag}-${i}`,
                    title: tag.toUpperCase(),
                    color: 'bg-stone-800',
                    initialPages: pagedImages
                };
            });

            // Chunk albums into racks
            for (let i = 0; i < tagAlbums.length; i += booksPerRow) {
                newRacks.push({
                    id: `rack-${i + 1}`, // Offset ID to avoid collision with special rack
                    albums: tagAlbums.slice(i, i + booksPerRow)
                });
            }
        }

        setRacks(newRacks);

    }, [booksPerRow, isReady, isListLoading, animeList.length, allTags]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.style.overflow = selected ? 'hidden' : 'auto';
        }
    }, [selected]);

    if (!isReady || isListLoading) return <div className="min-h-screen bg-[#101010] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-500" /></div>;

    const colors = [
        'bg-red-950', 'bg-blue-950', 'bg-emerald-950', 'bg-amber-950',
        'bg-purple-950', 'bg-slate-900', 'bg-stone-800', 'bg-neutral-900'
    ];

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#252525_0%,_#050505_100%)] text-stone-400 font-sans selection:bg-white selection:text-black overflow-x-hidden">
            <header className="sticky top-0 z-40 bg-transparent py-12 sm:py-20 px-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-[2px] -z-10" />

                {/* Back Button */}
                <button
                    onClick={() => setLocation("/")}
                    className="absolute top-8 left-8 text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-white transition-colors"
                >
                    ← Return Home
                </button>

                <h1 className="text-2xl sm:text-5xl font-light tracking-[0.4em] sm:tracking-[0.7em] text-white/90 uppercase opacity-90 drop-shadow-lg">Archive Gallery</h1>
                <div className="flex items-center justify-center gap-6 sm:gap-10 mt-6 sm:mt-10">
                    <div className="h-px w-10 sm:w-20 bg-white/20" />
                    <p className="text-[8px] sm:text-[10px] font-mono tracking-[0.3em] sm:tracking-[0.5em] text-stone-400 uppercase">Perpetual Visual Exhibit</p>
                    <div className="h-px w-10 sm:w-20 bg-white/20" />
                </div>
            </header>

            <main className="max-w-[1900px] mx-auto py-24 sm:py-48 min-h-[50vh]">
                {racks.length > 0 ? (
                    racks.map((rack, idx) => (
                        // Assign colors dynamically here if needed, or in generation
                        <Rack key={rack.id} rack={{
                            ...rack,
                            albums: rack.albums.map((a, i) => ({ ...a, color: colors[(idx + i) % colors.length] }))
                        }} onAlbumClick={setSelected} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <p className="text-sm font-mono tracking-widest uppercase">The Archive is Empty</p>
                    </div>
                )}

                {/* Footer Message - Unlock More */}
                <div className="flex flex-col items-center py-20 sm:py-40 gap-8 border-t border-white/5 mt-10">
                    <div className="w-16 h-[1px] bg-white/20" />
                    <span className="text-[10px] sm:text-xs font-mono tracking-[0.3em] text-stone-500 uppercase text-center max-w-md leading-relaxed selection:bg-red-500/30">
                        Explore more to unlock new volumes
                    </span>
                    <IconX />
                </div>
            </main>

            {selected && <BookView album={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
