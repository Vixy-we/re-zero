import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertTriangle, CheckCircle, Loader2, Scan, FileText, XCircle, Check } from "lucide-react";
import type { Anime } from "@shared/schema";
import { useUpdateAnime, useDeleteAnime } from "@/hooks/use-anime";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RefreshLibraryDialogProps {
    animeList: Anime[];
}

export function RefreshLibraryDialog({ animeList }: RefreshLibraryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentAnime, setCurrentAnime] = useState<Anime | null>(null);
    const [currentTitle, setCurrentTitle] = useState("");

    // Check Report State
    const [view, setView] = useState<"initial" | "report" | "refreshing" | "completed" | "manual_repair">("initial");
    const [manualIndex, setManualIndex] = useState(0);
    const [manualForm, setManualForm] = useState<Partial<Anime>>({});
    const [reportData, setReportData] = useState<{
        total: number;
        duplicates: number;
        unique: number;
        missingCount: number;
        issues: {
            type: number;
            episodes: number;
            duration: number;
            year: number;
            titles: number;
            communityRating: number;
        };
        badItems: Anime[];
    } | null>(null);

    const [logs, setLogs] = useState<string[]>([]);

    const updateAnime = useUpdateAnime();
    const deleteAnime = useDeleteAnime();
    const abortControllerRef = useRef<AbortController | null>(null);

    const processUpdate = async (anime: Anime, jikanData: any) => {
        await updateAnime.mutateAsync({
            id: anime.id,
            title: jikanData.title_english || jikanData.title,
            type: jikanData.type,
            episodes: jikanData.episodes,
            duration: jikanData.duration,
            releaseYear: jikanData.year || (jikanData.aired?.from ? new Date(jikanData.aired.from).getFullYear() : null),
            // We now skip synopsis (description) to save DB memory
            // Community rating is different from user rating
            communityRating: jikanData.score || null,
            rating: anime.rating,
            notes: anime.notes,
            category: anime.category,
            // Enhance tags if missing
            tags: (anime.tags && anime.tags.length > 0) ? anime.tags : (jikanData.genres?.map((g: any) => g.name) || []),
        });
    };

    const startRefresh = async (targetList?: Anime[]) => {
        setView("refreshing");
        setProgress(0);
        setLogs([]);
        abortControllerRef.current = new AbortController();

        const total = targetList ? targetList.length : animeList.length;
        let successCount = 0;
        let failCount = 0;
        let itemsToRefresh: Anime[] = [];
        let toDeleteIds: number[] = [];

        if (targetList) {
            // Targeted Mode: process only the passed items, no dedupe phase needed for list subset?
            // Actually, safe to just use them directly.
            itemsToRefresh = targetList;
        } else {
            // Full Mode: Deduplication Phase
            // ... (keep existing logic)
            if (!targetList) {
                const uniqueMap = new Map<number, Anime[]>();
                animeList.forEach(a => {
                    if (!uniqueMap.has(a.malId)) uniqueMap.set(a.malId, []);
                    uniqueMap.get(a.malId)!.push(a);
                });

                uniqueMap.forEach((animes) => {
                    if (animes.length > 1) {
                        // Sort by ID descending (keep newest)
                        animes.sort((a, b) => b.id - a.id);
                        itemsToRefresh.push(animes[0]);
                        for (let k = 1; k < animes.length; k++) {
                            toDeleteIds.push(animes[k].id);
                        }
                    } else {
                        itemsToRefresh.push(animes[0]);
                    }
                });
            }

            if (toDeleteIds.length > 0) {
                setLogs(prev => [...prev, `Found ${toDeleteIds.length} duplicates... cleaning up.`]);
                // Limit concurrency for deletes? It's just a few usually.
                for (const id of toDeleteIds) {
                    if (abortControllerRef.current.signal.aborted) break;
                    try {
                        await deleteAnime.mutateAsync(id);
                        // No need to delay much for deletes
                    } catch (e) {
                        console.error("Delete failed", e);
                    }
                }
            }
        }

        // --- REFRESH PHASE ---
        const refreshTotal = itemsToRefresh.length;

        for (let i = 0; i < refreshTotal; i++) {
            if (abortControllerRef.current.signal.aborted) break;

            const anime = itemsToRefresh[i];
            setCurrentAnime(anime);

            try {
                // 1. Fetch from Jikan
                // Respect rate limit: ~2 requests per second
                await new Promise(resolve => setTimeout(resolve, 500));

                const res = await fetch(`https://api.jikan.moe/v4/anime/${anime.malId}/full`);
                if (!res.ok) {
                    if (res.status === 429) {
                        // Hit rate limit, wait longer and retry once
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        const retry = await fetch(`https://api.jikan.moe/v4/anime/${anime.malId}/full`);
                        if (!retry.ok) throw new Error("Failed after retry");
                        const data = await retry.json();
                        await processUpdate(anime, data.data);
                    } else {
                        throw new Error(`API Error ${res.status}`);
                    }
                } else {
                    const data = await res.json();
                    await processUpdate(anime, data.data);
                }
                successCount++;
            } catch (e) {
                console.error(`Failed to refresh ${anime.title}`, e);
                failCount++;
                setLogs(prev => [...prev.slice(-4), `Failed: ${anime.title}`]);
            }

            setProgress(Math.round(((i + 1) / refreshTotal) * 100));
        }

        if (abortControllerRef.current?.signal.aborted) {
            console.log("Refresh aborted by user");
            return;
        }

        setView("completed");
        setCurrentTitle(`Done! Cleaned ${toDeleteIds.length} duplicates. Updated ${successCount} items.`);
    };



    const handleStop = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setView("initial");
        setIsOpen(false);
    };

    const startManualRepair = () => {
        if (!reportData || reportData.badItems.length === 0) return;
        setManualIndex(0);
        setManualForm({});
        setView("manual_repair");
    };

    const handleManualSave = async () => {
        if (!reportData) return;
        const currentItem = reportData.badItems[manualIndex];

        try {
            await updateAnime.mutateAsync({
                id: currentItem.id,
                ...manualForm
            });

            // Move next
            handleManualNext();
        } catch (e) {
            console.error(e);
        }
    };

    const handleManualNext = () => {
        if (!reportData) return;
        if (manualIndex < reportData.badItems.length - 1) {
            setManualIndex(prev => prev + 1);
            setManualForm({});
        } else {
            // Done
            setView("completed");
            setCurrentTitle("Manual Repair Sequence Complete.");
        }
    };

    const runIntegrityCheck = () => {
        const uniqueItems = Array.from(new Map(animeList.map(item => [item.malId, item])).values());
        const total = animeList.length;
        const unique = uniqueItems.length;
        const duplicates = total - unique;

        let missingCount = 0;
        const issues = { type: 0, episodes: 0, duration: 0, year: 0, titles: 0, communityRating: 0 };
        const badItems: Anime[] = [];

        uniqueItems.forEach(a => {
            let hasIssue = false;
            // Strict checks
            if (!a.type) { issues.type++; hasIssue = true; }
            if (!a.episodes) { issues.episodes++; hasIssue = true; }
            if (!a.duration) { issues.duration++; hasIssue = true; }
            if (!a.releaseYear) { issues.year++; hasIssue = true; }
            if (!a.title) { issues.titles++; hasIssue = true; }
            if (!a.communityRating || a.communityRating === 0) { issues.communityRating++; hasIssue = true; }

            if (hasIssue) {
                missingCount++;
                badItems.push(a);
            }
        });

        setReportData({
            total,
            duplicates,
            unique,
            missingCount,
            issues,
            badItems
        });
        setView("report");
    };

    return (
        <>
            <div className="z-[100]">
                <Button
                    onClick={() => setIsOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="rounded-full gap-2 hover:bg-green-500/10 hover:text-green-400 transition-all text-xs font-medium px-4 text-white"
                >
                    <RefreshCw className="w-3.5 h-3.5 text-green-500" />
                    <span className="hidden sm:inline">Refresh Library</span>
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open && view === "refreshing") {
                    handleStop();
                }
                setIsOpen(open);
            }}>
                <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-2xl overflow-hidden p-0 gap-0">

                    {view === "initial" && (
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-amber-400 mb-2">
                                <AlertTriangle className="w-6 h-6" />
                                <h2 className="text-lg font-bold">Hard Refresh Library?</h2>
                            </div>

                            {(() => {
                                const uniqueCount = new Set(animeList.map(a => a.malId)).size;
                                const duplicates = animeList.length - uniqueCount;
                                return (
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Found <strong>{animeList.length} entries</strong>.
                                        {duplicates > 0 && <span className="text-amber-400"> Detected {duplicates} duplicates that will be removed.</span>}
                                        <br />
                                        This process will consolidate your library to <strong>{uniqueCount} unique items</strong> and fetch fresh data for each.
                                    </p>
                                );
                            })()}
                            <p className="text-sm text-gray-400 font-mono bg-white/5 p-3 rounded-lg border border-white/5">
                                Estimated time: ~{Math.ceil(animeList.length * 0.6)} seconds
                            </p>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button variant="outline" onClick={runIntegrityCheck} className="border-white/10 hover:bg-white/10 text-blue-400 hover:text-blue-300">
                                    <Scan className="w-4 h-4 mr-2" /> Check Missing Data
                                </Button>
                                <Button onClick={() => startRefresh()} className="bg-primary hover:bg-primary/90">
                                    <RefreshCw className="w-4 h-4 mr-2" /> Start Refresh
                                </Button>
                            </div>
                        </div>
                    )}

                    {view === "report" && reportData && (
                        <div className="flex flex-col h-[500px]">
                            <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <FileText className="w-5 h-5" />
                                    <h2 className="font-bold">Library Health Report</h2>
                                </div>
                                <div className="text-xs text-gray-500 font-mono uppercase">
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
                                        <div className="text-2xl font-bold text-white">{reportData.total}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Total Items</div>
                                    </div>
                                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
                                        <div className="text-2xl font-bold text-green-400">{reportData.unique - reportData.missingCount}</div>
                                        <div className="text-[10px] text-green-400/70 uppercase tracking-widest">Healthy</div>
                                    </div>
                                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
                                        <div className="text-2xl font-bold text-red-400">{reportData.missingCount}</div>
                                        <div className="text-[10px] text-red-400/70 uppercase tracking-widest">Issues</div>
                                    </div>
                                </div>

                                {reportData.duplicates > 0 && (
                                    <div className="mb-6 bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                        <p className="text-sm text-gray-300">
                                            <span className="text-amber-400 font-bold">{reportData.duplicates} duplicate items</span> found. These will be automatically merged and cleaned up during the refresh.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">
                                        Issue Breakdown
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {[
                                            { label: "Format/Type", count: reportData.issues.type },
                                            { label: "Episode Count", count: reportData.issues.episodes },
                                            { label: "Duration", count: reportData.issues.duration },
                                            { label: "Release Year", count: reportData.issues.year },
                                            { label: "Community Rating", count: reportData.issues.communityRating },
                                        ].map((stat) => (
                                            <div key={stat.label} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                                                <span className="text-gray-400">{stat.label}</span>
                                                <span className={stat.count > 0 ? "text-red-400 font-bold" : "text-green-400"}>
                                                    {stat.count > 0 ? `${stat.count} Missing` : "OK"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {reportData.badItems.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">
                                            Items Requiring Attention ({reportData.badItems.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {reportData.badItems.slice(0, 50).map(item => (
                                                <div key={item.id} className="flex items-center justify-between text-sm bg-black/40 p-2 rounded border border-white/5">
                                                    <span className="truncate max-w-[200px] text-gray-300">{item.title}</span>
                                                    <div className="flex gap-1">
                                                        {!item.type && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">TYPE</span>}
                                                        {!item.releaseYear && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">YEAR</span>}
                                                        {(!item.communityRating || item.communityRating === 0) && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">COMMUNITY</span>}
                                                        {(!item.episodes || !item.duration) && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">DATA</span>}
                                                    </div>
                                                </div>
                                            ))}
                                            {reportData.badItems.length > 50 && (
                                                <div className="text-center text-xs text-gray-500 py-2">
                                                    + {reportData.badItems.length - 50} more items
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between">
                                <Button variant="ghost" onClick={() => setView("initial")}>
                                    Back
                                </Button>
                                <Button onClick={() => startRefresh(reportData.badItems)} className="bg-primary hover:bg-primary/90">
                                    <RefreshCw className="w-4 h-4 mr-2" /> Start Repair Sequence
                                </Button>
                                <Button variant="secondary" onClick={startManualRepair} className="bg-white/10 hover:bg-white/20">
                                    <FileText className="w-4 h-4 mr-2" /> Repair Manually
                                </Button>
                            </div>
                        </div>
                    )}



                    {view === "manual_repair" && reportData && (
                        <div className="p-6 h-[650px] max-h-[85vh] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Scan className="w-5 h-5 text-blue-400" />
                                    Manual Repair Wizard
                                </h2>
                                <span className="text-xs font-mono text-gray-500">
                                    {manualIndex + 1} / {reportData.badItems.length}
                                </span>
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-6">
                                    {(() => {
                                        const item = reportData.badItems[manualIndex];
                                        return (
                                            <>
                                                <div className="flex gap-4">
                                                    <div className="w-24 h-36 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-white mb-1">{item.title}</h3>
                                                        <a href={`https://myanimelist.net/anime/${item.malId}`} target="_blank" className="text-xs text-blue-400 hover:underline">
                                                            View on MyAnimeList ({item.malId})
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Type (TV, Movie, OVA)</Label>
                                                        <Input
                                                            defaultValue={item.type || ""}
                                                            onChange={(e) => setManualForm(prev => ({ ...prev, type: e.target.value }))}
                                                            className="bg-white/5 border-white/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Episodes</Label>
                                                        <Input
                                                            type="number"
                                                            defaultValue={item.episodes || ""}
                                                            onChange={(e) => setManualForm(prev => ({ ...prev, episodes: parseInt(e.target.value) || 0 }))}
                                                            className="bg-white/5 border-white/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Release Year</Label>
                                                        <Input
                                                            type="number"
                                                            defaultValue={item.releaseYear || ""}
                                                            onChange={(e) => setManualForm(prev => ({ ...prev, releaseYear: parseInt(e.target.value) || 0 }))}
                                                            className="bg-white/5 border-white/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Duration (e.g. "24 min")</Label>
                                                        <Input
                                                            defaultValue={item.duration || ""}
                                                            onChange={(e) => setManualForm(prev => ({ ...prev, duration: e.target.value }))}
                                                            className="bg-white/5 border-white/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Community Rating (0.0 - 10.0)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="10"
                                                            defaultValue={item.communityRating || ""}
                                                            onChange={(e) => setManualForm(prev => ({ ...prev, communityRating: parseFloat(e.target.value) || 0 }))}
                                                            className="bg-white/5 border-white/10"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </ScrollArea>

                            <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
                                <Button variant="ghost" onClick={handleManualNext}>Skip</Button>
                                <Button onClick={handleManualSave} className="bg-blue-500 hover:bg-blue-600">
                                    Save & Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {(view === "refreshing" || view === "completed") && (
                        <div className="relative overflow-hidden h-[360px] flex flex-col items-center justify-center p-6">
                            {/* Dynamic Background */}
                            <AnimatePresence mode="wait">
                                {currentAnime && (
                                    <motion.div
                                        key={currentAnime.id + "-bg"}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.2 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-cover bg-center blur-2xl z-0"
                                        style={{ backgroundImage: `url(${currentAnime.imageUrl})` }}
                                    />
                                )}
                            </AnimatePresence>
                            <div className="absolute inset-0 bg-black/60 z-0" />

                            <div className="relative z-10 flex flex-col items-center w-full max-w-[200px]">
                                <div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-2xl border border-white/20 mb-6 bg-zinc-900">
                                    <AnimatePresence mode="wait">
                                        {currentAnime ? (
                                            <motion.img
                                                key={currentAnime.id}
                                                src={currentAnime.imageUrl}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 1.1 }}
                                                transition={{ duration: 0.3 }}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 animate-pulse" />
                                        )}
                                    </AnimatePresence>

                                    {/* Scanline Effect */}
                                    {view !== "completed" && (
                                        <motion.div
                                            initial={{ top: "-10%" }}
                                            animate={{ top: "110%" }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            className="absolute left-0 right-0 h-[20%] bg-gradient-to-b from-transparent via-green-500/30 to-transparent pointer-events-none"
                                        />
                                    )}
                                </div>

                                <div className="w-full space-y-2 text-center">
                                    <div className="flex items-center justify-between text-xs font-mono text-green-400 uppercase tracking-widest px-1">
                                        <span className={view === "completed" ? "" : "animate-pulse"}>
                                            {view === "completed" ? "System Standby" : "Syncing..."}
                                        </span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className={`h-1.5 ${view === "completed" ? "bg-green-500" : "bg-white/10"}`} />
                                    <h3 className="text-sm font-bold text-white truncate h-auto whitespace-normal mt-2">
                                        {view === "completed" ? currentTitle : (currentAnime?.title || "Evaluating...")}
                                    </h3>
                                </div>

                                {view === "completed" && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setIsOpen(false)}
                                        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Close System
                                    </motion.button>
                                )}

                                {view !== "completed" && (
                                    <button onClick={handleStop} className="mt-8 text-[10px] text-white/30 hover:text-red-400 transition-colors uppercase tracking-widest">
                                        Abort Sequence
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent >
            </Dialog >
        </>
    );
}
