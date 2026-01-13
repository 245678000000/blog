import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Analytics } from "./components/Analytics";
import Home from "./pages/Home";
import Article from "./pages/Article";
import Archive from "./pages/Archive";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Layout from "./components/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/writings"} component={Home} />
        {/* 独立页面 */}
        <Route path={"/archive"} component={Archive} />
        <Route path={"/about"} component={About} />
        <Route path={"/contact"} component={Contact} />
        {/* 动态文章路由 - 支持 /article/:slug */}
        <Route path={"/article/:slug"} component={Article} />
        {/* 兼容旧路由 */}
        <Route path={"/advent-of-claude-2025"} component={Article} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
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
