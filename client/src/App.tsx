import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Analytics } from "./components/Analytics";
import Layout from "./components/Layout";

// 路由级代码分割
const Home = lazy(() => import("./pages/Home"));
const Article = lazy(() => import("./pages/Article"));
const Archive = lazy(() => import("./pages/Archive"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageSkeleton() {
  return (
    <div className="container max-w-3xl py-12 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-10 w-2/3 rounded-lg bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-4/6 rounded bg-muted" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/writings"} component={Home} />
          <Route path={"/archive"} component={Archive} />
          <Route path={"/about"} component={About} />
          <Route path={"/contact"} component={Contact} />
          <Route path={"/article/:slug"} component={Article} />
          <Route path={"/advent-of-claude-2025"} component={Article} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Analytics />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
