import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getPublishedArticles, type Article } from "@shared/articles";
import { Link } from "wouter";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPublishedArticles().then(setArticles);
  }, []);

  // 键盘快捷键 Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // 过滤文章
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.description.toLowerCase().includes(search.toLowerCase()) ||
      article.category.toLowerCase().includes(search.toLowerCase())
  );

  // 获取所有分类
  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="搜索文章..."
        value={search}
        onValueChange={setSearch}
        className="text-base"
      />
      <CommandList>
        <CommandEmpty>没有找到结果</CommandEmpty>

        {/* 分类结果 */}
        {search === "" && categories.length > 0 && (
          <CommandGroup heading="分类">
            {categories.map((category) => (
              <CommandItem
                key={category}
                className="flex items-center gap-2"
                onSelect={() => {
                  setSearch(category);
                }}
              >
                <span className="flex-1">{category}</span>
                <span className="text-xs text-muted-foreground">
                  {articles.filter((a) => a.category === category).length} 篇文章
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* 文章结果 */}
        <CommandGroup heading={search === "" ? "文章" : "搜索结果"}>
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/article/${article.slug}`}>
              <CommandItem
                className="flex flex-col items-start gap-1 py-3"
                onSelect={() => onOpenChange(false)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium flex-1">{article.title}</span>
                  <span className="text-xs text-muted-foreground">{article.category}</span>
                </div>
                {article.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {article.description}
                  </p>
                )}
              </CommandItem>
            </Link>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// 搜索按钮组件
export function SearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors border border-border/50"
      >
        <Search className="w-4 h-4" />
        <span>搜索...</span>
        <kbd className="ml-auto text-xs bg-background border border-border/50 rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
