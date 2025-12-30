import { motion } from "framer-motion";
import { Link } from "wouter";
import {
    Library, BrainCircuit, Search, Sparkles,
    ArrowLeft, Compass, BarChart3, Database,
    MousePointer2, Layers, RefreshCw, Zap, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Color Themes System ---
const themeStyles: any = {
    indigo: {
        line: "bg-indigo-500",
        dot: "bg-indigo-500 border-indigo-400",
        iconBox: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        title: "text-indigo-100",
        cardHover: "hover:border-indigo-500/30 hover:bg-indigo-500/5 group-hover:text-indigo-400"
    },
    emerald: {
        line: "bg-emerald-500",
        dot: "bg-emerald-500 border-emerald-400",
        iconBox: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        title: "text-emerald-100",
        cardHover: "hover:border-emerald-500/30 hover:bg-emerald-500/5 group-hover:text-emerald-400"
    },
    violet: {
        line: "bg-violet-500",
        dot: "bg-violet-500 border-violet-400",
        iconBox: "bg-violet-500/10 border-violet-500/20 text-violet-400",
        title: "text-violet-100",
        cardHover: "hover:border-violet-500/30 hover:bg-violet-500/5 group-hover:text-violet-400"
    },
    amber: {
        line: "bg-amber-500",
        dot: "bg-amber-500 border-amber-400",
        iconBox: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        title: "text-amber-100",
        cardHover: "hover:border-amber-500/30 hover:bg-amber-500/5 group-hover:text-amber-400"
    },
    rose: {
        line: "bg-rose-500",
        dot: "bg-rose-500 border-rose-400",
        iconBox: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        title: "text-rose-100",
        cardHover: "hover:border-rose-500/30 hover:bg-rose-500/5 group-hover:text-rose-400"
    }
};

const GuideSection = ({ title, subtitle, icon: Icon, children, delay, theme = "indigo", image }: any) => {
    const styles = themeStyles[theme];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay }}
            className="mb-32 relative"
        >
            {/* Colored Timeline Connector */}
            <div className={`absolute -left-12 top-0 bottom-0 w-px ${styles.line} opacity-20 hidden md:block`} />
            <div className={`absolute -left-[54px] top-0 w-3 h-3 rounded-full ${styles.dot} shadow-[0_0_10px_currentColor] hidden md:block`} />

            <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-xl border shadow-sm ${styles.iconBox}`}>
                    <Icon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className={`text-3xl font-display font-bold tracking-tight ${styles.title}`}>{title}</h2>
                    <p className="text-lg text-muted-foreground font-light">{subtitle}</p>
                </div>
            </div>

            <div className="pl-4 border-l-2 border-white/5 md:border-none md:pl-0">
                {/* Feature Screenshot */}
                {image && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                        <div className={`absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10`} />
                        <img
                            src={image}
                            alt={`${title} Preview`}
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 desaturate-[0.2] group-hover:desaturate-0"
                        />
                    </div>
                )}
                {children}
            </div>
        </motion.div>
    );
};

const FeatureCard = ({ title, desc, icon: Icon, badge, theme = "indigo" }: any) => {
    const styles = themeStyles[theme];
    return (
        <div className={`p-6 bg-white/5 border border-white/10 rounded-2xl transition-all h-full group ${styles.cardHover}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                    <Icon className={`w-5 h-5 text-zinc-400 transition-colors ${styles.cardHover.split(" ").pop()}`} />
                </div>
                {badge && (
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-white/40 bg-white/5 px-2 py-1 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white/90">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">{desc}</p>
        </div>
    );
};

export default function Guide() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-purple-500/30">
            {/* Standard App Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                <Link href="/">
                    <Button variant="ghost" className="mb-12 hover:bg-white/5 text-muted-foreground hover:text-white rounded-full px-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Shelf
                    </Button>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-24"
                >
                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-500">Manual</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed font-light">
                        A complete guide to your Anime Intelligence System. Understanding the core engines, maintenance tools, and analytics.
                    </p>
                </motion.div>

                <div className="relative md:pl-12">

                    {/* Chapter 1: The Core */}
                    <GuideSection
                        title="The Core"
                        subtitle="Library Management"
                        icon={Library}
                        delay={0.2}
                        theme="indigo"
                        image="/guide-demos/core.png"
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg font-light">
                            Your library handles the basics of tracking. It supports two main states: "Watched" for completed archives and "Plan to Watch" for future queues.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FeatureCard
                                title="Quick Add"
                                desc="Use the global search bar on the dashboard. Hitting the '+' button instantly files the anime into your 'Plan to Watch' list."
                                icon={Database}
                                theme="indigo"
                            />
                            <FeatureCard
                                title="Smart Edit"
                                desc="Clicking any card opens the Detail Editor. Here you can add personal notes, ratings (1-10), or modify tags manually."
                                icon={MousePointer2}
                                theme="indigo"
                            />
                        </div>
                    </GuideSection>

                    {/* Chapter 2: The Uplink (Maintenance) */}
                    <GuideSection
                        title="The Uplink"
                        subtitle="Maintenance & Data Sync"
                        icon={RefreshCw}
                        delay={0.2}
                        theme="emerald"
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg font-light">
                            A powerful, often overlooked feature. The "Refresh Library" button connects your local library to the global Jikan API to ensure data integrity.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FeatureCard
                                title="Metadata Repair"
                                desc="If a show has missing cover art, titles, or years, the Refresh tool will automatically fetch and repair these fields from the database."
                                icon={Zap}
                                badge="AUTO-FIX"
                                theme="emerald"
                            />
                            <FeatureCard
                                title="Tag Population"
                                desc="Vital for the Smart Engine. Running a refresh automatically downloads widely-accepted genre tags for every show in your library."
                                icon={Tag}
                                badge="CRITICAL"
                                theme="emerald"
                            />
                        </div>
                    </GuideSection>

                    {/* Chapter 3: The Brain */}
                    <GuideSection
                        title="The Intelligence"
                        subtitle="Analytics & DNA"
                        icon={BrainCircuit}
                        delay={0.2}
                        theme="violet"
                        image="/guide-demos/brain.png"
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg font-light">
                            Visualizing your taste profile through organic data simulation.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FeatureCard
                                title="Organic DNA"
                                desc="Your library is visualized as a living ecosystem of bubbles. Size represents frequency—larger bubbles mean you watch that genre more."
                                icon={Sparkles}
                                theme="violet"
                            />
                            <FeatureCard
                                title="Deep Drill-down"
                                desc="Hovering over any genre bubble reveals a precise breakdown: how many you've finished vs. how many are still on your waiting list."
                                icon={BarChart3}
                                theme="violet"
                            />
                        </div>
                    </GuideSection>

                    {/* Chapter 4: The Engines */}
                    <GuideSection
                        title="The Engines"
                        subtitle="Discovery Ecosystem"
                        icon={Compass}
                        delay={0.2}
                        theme="amber"
                        image="/guide-demos/engine.png"
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg font-light">
                            SHELF provides four distinct engines to find your next obsession. Each serves a specific purpose.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">

                            {/* Smart Engine */}
                            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl group hover:border-purple-500/40 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <BrainCircuit className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                                    <h3 className="text-lg font-bold text-white">Smart Engine</h3>
                                </div>
                                <p className="text-xs font-mono text-purple-300/60 mb-3 uppercase tracking-wider">Neural Similarity</p>
                                <p className="text-sm text-zinc-300 leading-relaxed font-light">
                                    Analyzes your "Liked" shows to find mathematically similar anime using neural networks. <br /><span className="text-white/60 italic">"I want more of what I love."</span>
                                </p>
                            </div>

                            {/* Niche Search */}
                            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl group hover:border-blue-500/40 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <Search className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                    <h3 className="text-lg font-bold text-white">Niche Search</h3>
                                </div>
                                <p className="text-xs font-mono text-blue-300/60 mb-3 uppercase tracking-wider">Curator Mode</p>
                                <p className="text-sm text-zinc-300 leading-relaxed font-light">
                                    Filters by mood and prioritizes high-rated "Hidden Gems" over popular hits. <br /><span className="text-white/60 italic">"I want something unique/obscure."</span>
                                </p>
                            </div>

                            {/* Suggestions */}
                            <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl group hover:border-yellow-500/40 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                                    <h3 className="text-lg font-bold text-white">Suggestions</h3>
                                </div>
                                <p className="text-xs font-mono text-yellow-300/60 mb-3 uppercase tracking-wider">Standard Recs</p>
                                <p className="text-sm text-zinc-300 leading-relaxed font-light">
                                    Classic recommendations based on genres and community trends. Good for broad discovery. <br /><span className="text-white/60 italic">"Show me what's popular."</span>
                                </p>
                            </div>

                            {/* Global Explore */}
                            <div className="p-6 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-2xl group hover:border-green-500/40 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <Database className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors" />
                                    <h3 className="text-lg font-bold text-white">Global Explore</h3>
                                </div>
                                <p className="text-xs font-mono text-green-300/60 mb-3 uppercase tracking-wider">The Database</p>
                                <p className="text-sm text-zinc-300 leading-relaxed font-light">
                                    Direct access to the entire anime database (via Home Tab). Filter by season, airing status, or tags. <br /><span className="text-white/60 italic">"I'm browsing the market."</span>
                                </p>
                            </div>

                        </div>
                    </GuideSection>

                    {/* Chapter 5: The Album (Infinite Shelf) */}
                    <GuideSection
                        title="The Album"
                        subtitle="Infinite Shelf"
                        icon={Layers}
                        delay={0.2}
                        theme="rose"
                        image="/guide-demos/album.png"
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg font-light">
                            A premium visual experience for your personal collection.
                        </p>
                        <div className="p-6 bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl group hover:border-rose-500/40 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <Layers className="w-6 h-6 text-rose-400 group-hover:text-rose-300 transition-colors" />
                                <h3 className="text-xl font-bold text-white">Visual Library Mode</h3>
                            </div>
                            <p className="text-zinc-300 leading-relaxed font-light mb-4 text-sm">
                                This is not a search engine. It is a beautiful, "coffee table book" viewer for the anime you have already saved.
                            </p>
                            <ul className="space-y-2 text-sm text-zinc-400 font-mono">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_currentColor]" /> Pure visual focus (no text clutter).</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_currentColor]" /> Sorted by global popularity.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_currentColor]" /> Designed for "Window Shopping" your own list.</li>
                            </ul>
                        </div>
                    </GuideSection>


                    <div className="mt-24 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-20" />
                        <h2 className="text-2xl font-bold mb-4 relative z-10">Everything Operational?</h2>
                        <Link href="/">
                            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 relative z-10 rounded-full px-8">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
