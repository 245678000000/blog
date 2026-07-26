import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const endpoint = import.meta.env.VITE_NEWSLETTER_ENDPOINT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    setIsSubmitting(true);

    try {
      if (endpoint) {
        // 调用配置的 Newsletter API (ButtonDown/Mailchimp)
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("订阅失败");
      } else {
        // Fallback: 打开邮件客户端
        window.location.href = `mailto:xingpeng278@aliyun.com?subject=${encodeURIComponent("订阅博客更新")}&body=${encodeURIComponent(`请将以下邮箱加入订阅列表：${email}`)}`;
      }
      setIsSubscribed(true);
      toast.success("订阅成功！感谢你的关注。");
      setEmail("");
    } catch {
      toast.error("订阅失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-primary">
        <Check className="h-5 w-5" />
        <span className="font-medium">已订阅，感谢关注！</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-secondary/30 border border-border/50 p-8 text-center">
      <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="text-xl font-serif font-bold mb-2">订阅更新</h3>
      <p className="text-sm text-muted-foreground mb-6">
        新文章发布时第一时间通知你，不会发送垃圾邮件。
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      >
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-full flex-1"
          required
        />
        <Button
          type="submit"
          className="rounded-full px-6"
          disabled={isSubmitting}
        >
          {isSubmitting ? "订阅中..." : "订阅"}
        </Button>
      </form>
    </div>
  );
}
