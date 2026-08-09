import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Redirect, Route, Switch } from "wouter";
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
          {/* 旧地址，仍可能有外链。内容与 / 完全一致，canonical 由 Home
              统一钉在 /（见 Home 传给 SEO 的 canonicalPath），
              所以这里保留渲染而不是跳转，不打断已有链接。 */}
          <Route path={"/writings"} component={Home} />
          <Route path={"/archive"} component={Archive} />
          <Route path={"/about"} component={About} />
          <Route path={"/contact"} component={Contact} />
          <Route path={"/article/:slug"} component={Article} />
          {/* 旧的单篇文章短地址。这一篇有自己的 /article/<slug>，两个地址
              并存就是重复内容，且它此前是靠 Article 里 `params.slug || "advent-..."`
              那个隐式默认值撑着的——任何 slug 缺失的场景都会静默落到这篇。
              改成跳转，短地址继续可用，但全站只剩一个可索引地址。 */}
          <Route path={"/advent-of-claude-2025"}>
            <Redirect to="/article/advent-of-claude-2025" replace />
          </Route>
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
      <ThemeProvider defaultTheme="dark">
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
