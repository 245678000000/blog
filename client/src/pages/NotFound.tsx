import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-lg">
        {/* 404 大字 */}
        <div className="relative">
          <h1 className="text-[12rem] md:text-[16rem] font-serif font-bold leading-none text-primary/10">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-4xl">🔍</span>
              </div>
            </div>
          </div>
        </div>

        {/* 文字说明 */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            页面未找到
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            抱歉，您访问的页面不存在或已被移动。
            <br />
            您可以返回首页或使用搜索功能查找内容。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="rounded-full gap-2">
              <Home className="w-4 h-4" />
              返回首页
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            返回上页
          </Button>
        </div>

        {/* 搜索提示 */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            按 <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-secondary rounded text-xs">K</kbd> 打开搜索
          </p>
        </div>
      </div>
    </div>
  );
}
