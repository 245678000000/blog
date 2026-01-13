import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  description?: string;
  className?: string;
}

export function ShareButtons({ title, description, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  // 复制链接
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  // 分享到 Twitter/X
  const shareToTwitter = () => {
    const text = encodeURIComponent(`${title}${description ? ` - ${description}` : ""}`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  // 分享到微博
  const shareToWeibo = () => {
    const text = encodeURIComponent(`${title}${description ? ` - ${description}` : ""}`);
    const shareUrl = `https://service.weibo.com/share/share.php?title=${text}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  // 使用原生分享 API (如果支持)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // 用户取消分享，不需要处理
      }
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground mr-2">分享：</span>

      {/* 复制链接 */}
      <button
        onClick={copyLink}
        className="p-2 rounded-full hover:bg-secondary transition-colors group"
        title="复制链接"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>

      {/* Twitter/X */}
      <button
        onClick={shareToTwitter}
        className="p-2 rounded-full hover:bg-secondary transition-colors group"
        title="分享到 Twitter/X"
      >
        <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      {/* 微博 */}
      <button
        onClick={shareToWeibo}
        className="p-2 rounded-full hover:bg-secondary transition-colors group"
        title="分享到微博"
      >
        <svg
          className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M10.098 20c-4.612 0-9.098-2.118-9.098-5.737 0-1.877 1.026-3.939 2.789-5.812 2.363-2.503 5.106-3.64 6.135-2.54.427.457.479 1.22.165 2.155-.123.368.322.164.322.164 1.44-.658 2.831-.815 3.515-.246.36.3.489.729.389 1.248-.051.273.124.29.253.26.44-.099.946-.165 1.501-.165 3.05 0 5.521 1.677 5.521 3.746 0 3.886-5.102 6.927-11.492 6.927zm-4.814-9.181c-2.398 1.251-3.883 3.203-3.32 4.362.563 1.159 2.823 1.149 5.054-.228 2.231-1.377 3.537-3.414 2.916-4.547-.621-1.133-2.253-.838-4.65.413zm4.407 4.972c-.169.302-.582.395-.919.207-.332-.188-.44-.573-.27-.865.17-.29.571-.382.907-.193.337.189.45.56.282.851zm1.133-1.418c-.466.56-1.181.755-1.602.436-.416-.319-.409-1.007.017-1.537.421-.529 1.091-.723 1.507-.433.42.289.492.964.078 1.534zm5.56-11.399c-.262-.055-.215-.39.054-.411 2.404-.186 4.509.872 4.981 2.59.054.196-.131.365-.326.31-2.29-.638-4.14-.588-4.709-2.489zm.669 1.996c-.222-.054-.18-.33.05-.352 1.62-.151 3.04.625 3.386 1.871.042.152-.092.288-.235.249-1.717-.474-2.74-.472-3.201-1.768zm-5.466 12.024c-4.03 0-7.3-2.196-7.3-4.903 0-2.707 3.27-4.903 7.3-4.903 4.03 0 7.3 2.196 7.3 4.903 0 2.707-3.27 4.903-7.3 4.903z" />
        </svg>
      </button>

      {/* 原生分享 (移动端) */}
      {hasNativeShare && (
        <button
          onClick={nativeShare}
          className="p-2 rounded-full hover:bg-secondary transition-colors group"
          title="更多分享选项"
        >
          <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      )}
    </div>
  );
}
