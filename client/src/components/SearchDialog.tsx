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
import { useLocation } from "wouter";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 一篇文章的全部可搜索文本。
// 同时用于两处，必须一致：
//   1. 我们自己的过滤（决定渲染哪些 CommandItem）
//   2. CommandItem 的 value —— cmdk 会拿它再过滤一遍
// 只在 1 里加字段而不给 2 的话，新字段命中的结果会被 cmdk 二次过滤掉。
function searchableText(article: Article): string {
  return [
    article.title,
    article.description,
    article.category,
    ...(article.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    getPublishedArticles().then(setArticles);
  }, []);

  // 过滤文章
  const filteredArticles = articles.filter(article =>
    searchableText(article).includes(search.toLowerCase())
  );

  // 获取所有分类
  const categories = Array.from(new Set(articles.map(a => a.category)));

  // 跳转必须写在 onSelect 里，不能靠把 CommandItem 包在 <Link> 中让点击冒泡：
  // cmdk 的回车只调用 onSelect，不会合成 click，那样键盘用户按下回车只会关掉
  // 弹窗、停在原地。回归测试见 tests/f13_search.test.tsx。
  const openArticle = (slug: string) => {
    onOpenChange(false);
    setSearch("");
    setLocation(`/article/${slug}`);
  };

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
            {categories.map(category => (
              <CommandItem
                key={category}
                className="flex items-center gap-2"
                onSelect={() => {
                  setSearch(category);
                }}
              >
                <span className="flex-1">{category}</span>
                <span className="text-xs text-muted-foreground">
                  {articles.filter(a => a.category === category).length} 篇文章
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* 文章结果 */}
        <CommandGroup heading={search === "" ? "文章" : "搜索结果"}>
          {filteredArticles.map(article => (
            <CommandItem
              key={article.slug}
              value={`${article.slug} ${searchableText(article)}`}
              className="flex flex-col items-start gap-1 py-3"
              onSelect={() => openArticle(article.slug)}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium flex-1">{article.title}</span>
                <span className="text-xs text-muted-foreground">
                  {article.category}
                </span>
              </div>
              {article.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {article.description}
                </p>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// 搜索按钮组件。
// 不自带弹窗：Layout 在桌面导航和移动菜单里各放了一个按钮，
// 若每个按钮都挂一份 SearchDialog，移动菜单展开时就会存在两套
// Cmd+K 监听和两份独立状态，按一下快捷键会同时弹出两个对话框。
// 弹窗与快捷键统一由 Layout 持有。
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors border border-border/50"
    >
      <Search className="w-4 h-4" />
      <span>搜索...</span>
      <kbd className="ml-auto text-xs bg-background border border-border/50 rounded px-1.5 py-0.5">
        ⌘K
      </kbd>
    </button>
  );
}
