import { cn } from "@/lib/utils";

interface ShardLoaderProps {
    className?: string;
    variant?: "default" | "small" | "large";
}

export function ShardLoader({ className, variant = "default" }: ShardLoaderProps) {
    const sizeClasses = {
        default: "h-8 w-1.5",
        small: "h-4 w-1",
        large: "h-12 w-2",
    };

    const gapClasses = {
        default: "gap-1.5",
        small: "gap-1",
        large: "gap-2",
    };

    return (
        <div className={cn("flex items-center justify-center", gapClasses[variant], className)}>
            <div className={cn(
                "rounded-full bg-primary animate-[pulse_1s_ease-in-out_infinite]",
                sizeClasses[variant]
            )} style={{ animationDelay: "0ms" }} />
            <div className={cn(
                "rounded-full bg-purple-500 animate-[pulse_1s_ease-in-out_infinite]",
                sizeClasses[variant]
            )} style={{ animationDelay: "200ms" }} />
            <div className={cn(
                "rounded-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite]",
                sizeClasses[variant]
            )} style={{ animationDelay: "400ms" }} />
        </div>
    );
}
