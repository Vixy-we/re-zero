import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import InfiniteShelf from "@/pages/InfiniteShelf";
import Suggestions from "@/pages/Suggestions";
import SmartSuggestions from "@/pages/SmartSuggestions";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/infinite-shelf/:slug" component={InfiniteShelf} />
      <Route path="/infinite-shelf" component={InfiniteShelf} />
      <Route path="/suggestions" component={Suggestions} />
      <Route path="/smart-suggestions" component={SmartSuggestions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
