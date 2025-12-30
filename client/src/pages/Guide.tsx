import { motion } from "framer-motion";
import { Link } from "wouter";
import {
    Library, BrainCircuit, Search, Sparkles,
    ArrowLeft, Compass, BarChart3, Database,
    MousePointer2, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GuideSection = ({ title, subtitle, icon: Icon, children, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay }}
        className="mb-32 relative"
    >
        <div className="absolute -left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden md:block" />
        <div className="absolute -left-[54px] top-0 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-600 hidden md:block" />

        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
                <h2 className="text-3xl font-display font-bold text-white">{title}</h2>
                <p className="text-lg text-muted-foreground">{subtitle}</p>
            </div>
        </div>

        <div className="pl-4 border-l-2 border-white/5 md:border-none md:pl-0">
            {children}
        </div>
    </motion.div>
);

const FeatureCard = ({ title, desc, icon: Icon }: any) => (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
        <Icon className="w-6 h-6 text-purple-400 mb-4" />
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
);

export default function Guide() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-primary/30">
            {/* Background Grain & Gradient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                <Link href="/">
                    <Button variant="ghost" className="mb-12 hover:bg-white/5 text-muted-foreground hover:text-white">
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
                        Manual <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Override</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                        Welcome to the Shelf. You've upgraded from a simple list to a comprehensive Anime Intelligence System. Here is how to navigate the complexity.
                    </p>
                </motion.div>

                <div className="relative md:pl-12">

                    {/* Chapter 1: The Core */}
                    <GuideSection
                        title="The Core"
                        subtitle="Your Living Library"
                        icon={Library}
                        delay={0.2}
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg">
                            At its heart, this is still a tracker. But unlike standard lists, the Shelf is designed to be visual and fluid.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FeatureCard
                                title="Status Tracking"
                                desc="Categorize shows into 'Watched' or 'Plan to Watch'. Use the Quick Add button on any card to instantly file it."
                                icon={Database}
                            />
                            <FeatureCard
                                title="Smart Edit"
                                desc="Click any card in your library to open the detailed editor. Add ratings, complex notes, or fix metadata manually."
                                icon={MousePointer2}
                            />
                        </div>
                    </GuideSection>

                    {/* Chapter 2: The Brain */}
                    <GuideSection
                        title="The Brain"
                        subtitle="Library DNA & Analytics"
                        icon={BrainCircuit}
                        delay={0.2}
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg">
                            The "Analytics" button isn't just a chart. It is a biological map of your taste.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FeatureCard
                                title="Organic DNA"
                                desc="Your taste is visualized as living bubbles. Larger bubbles mean you watch that genre more. They drift and interact physically."
                                icon={Sparkles}
                            />
                            <FeatureCard
                                title="Data Breakdown"
                                desc="Hover over any bubble to see exactly how many shows match that genre, split by your watched/planned status."
                                icon={BarChart3}
                            />
                        </div>
                    </GuideSection>

                    {/* Chapter 3: The Engines */}
                    <GuideSection
                        title="The Engines"
                        subtitle="Two Ways to Discover"
                        icon={Compass}
                        delay={0.2}
                    >
                        <p className="text-zinc-300 mb-8 leading-relaxed text-lg">
                            We offer two distinct discovery modes. Knowing the difference is key to finding what you want.
                        </p>
                        <div className="grid md:grid-cols-1 gap-4">
                            <div className="p-6 bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                    <h3 className="text-xl font-bold text-white">Smart Engine</h3>
                                </div>
                                <p className="text-zinc-400 mb-4">
                                    Best for: <span className="text-white italic">"I like X, give me more of X."</span>
                                </p>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    This engine analyzes the specific shows you have 'Liked' in your library and finds mathematically similar anime using Jikan's neural network.
                                </p>
                            </div>

                            <div className="p-6 bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <Search className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-xl font-bold text-white">Niche Search</h3>
                                </div>
                                <p className="text-zinc-400 mb-4">
                                    Best for: <span className="text-white italic">"I want something different."</span>
                                </p>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    A curator-style engine. It intentionally ignores popular shows to find "Hidden Gems", "Cult Classics", and high-quality obscure titles based on mood tags.
                                </p>
                            </div>
                        </div>
                    </GuideSection>

                    {/* Chapter 4: The Void */}
                    <GuideSection
                        title="The Void"
                        subtitle="Infinite Shelf"
                        icon={Layers}
                        delay={0.2}
                    >
                        <p className="text-zinc-300 mb-4 leading-relaxed text-lg">
                            When you just want to browse without aim.
                        </p>
                        <FeatureCard
                            title="Endless Scrolling"
                            desc="A pure, infinite stream of anime sorted by popularity. Good for window shopping visuals without complex filters."
                            icon={Layers}
                        />
                    </GuideSection>

                    <div className="mt-24 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 text-center">
                        <h2 className="text-2xl font-bold mb-4">Ready to Dive In?</h2>
                        <Link href="/">
                            <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
