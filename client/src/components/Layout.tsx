import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Moon, Sun, Menu, X, Rss } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { SearchButton } from "@/components/SearchDialog";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "首页" },
    { href: "/archive", label: "归档" },
    { href: "/about", label: "关于" },
    { href: "/contact", label: "联系" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          isScrolled ? "bg-background/80 backdrop-blur-md py-4 shadow-sm" : "bg-transparent py-6"
        )}
      >
        <div className="container flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif font-bold tracking-tight hover:text-primary transition-colors">
            xing <span className="text-primary">peng</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              link.href.startsWith("/#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:text-primary link-underline text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    const id = link.href.substring(2);
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary link-underline",
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              )
            ))}
            <SearchButton />
            <a
              href="/rss.xml"
              className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              title="RSS 订阅"
            >
              <Rss className="h-4 w-4" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full hover:bg-primary/10 hover:text-primary"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-4 md:hidden">
             <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full hover:bg-primary/10 hover:text-primary"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
            {navLinks.map((link) => (
              link.href.startsWith("/#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium py-2 px-4 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    const id = link.href.substring(2);
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-lg font-medium py-2 px-4 rounded-md hover:bg-primary/10 hover:text-primary transition-colors",
                    location === link.href ? "text-primary bg-primary/5" : "text-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
            <div className="py-2 px-4">
              <SearchButton />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-24 pb-16">
        {children}
      </main>

      <footer className="py-12 border-t border-border/50 bg-background/50">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-serif font-bold">xing peng</span>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} 邢鹏. All rights reserved.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">首页</Link>
            <Link href="/archive" className="text-sm text-muted-foreground hover:text-primary transition-colors">归档</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">关于</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">联系</Link>
            <a
              href="/rss.xml"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Rss className="h-3 w-3" /> RSS
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
