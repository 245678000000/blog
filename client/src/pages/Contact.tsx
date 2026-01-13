import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  Github,
  MessageSquare,
  Send,
  MapPin,
  Clock,
} from "lucide-react";

// 社交链接
const socialLinks = [
  {
    name: "Email",
    icon: Mail,
    href: "mailto:xingpeng278@aliyun.com",
    label: "xingpeng278@aliyun.com",
    description: "最佳联系方式",
  },
  {
    name: "GitHub",
    icon: Github,
    href: "https://github.com",
    label: "GitHub",
    description: "查看我的开源项目",
  },
  {
    name: "Linux.do",
    icon: MessageSquare,
    href: "https://linux.do",
    label: "Linux.do 3级",
    description: "技术社区交流",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("请填写所有必填字段");
      return;
    }

    setIsSubmitting(true);

    // 模拟提交（实际项目中可以对接邮件服务）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 使用 mailto 链接作为备用方案
    const mailtoLink = `mailto:xingpeng278@aliyun.com?subject=${encodeURIComponent(
      formData.subject || "来自网站的消息"
    )}&body=${encodeURIComponent(
      `姓名: ${formData.name}\n邮箱: ${formData.email}\n\n${formData.message}`
    )}`;

    // 打开邮件客户端
    window.open(mailtoLink, "_blank");

    toast.success("正在打开邮件客户端...");
    setIsSubmitting(false);

    // 清空表单
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      <SEO
        title="联系我"
        description="有问题或想法？随时联系我！"
      />

      <div className="container max-w-4xl py-12 animate-in fade-in duration-700">
        {/* 页面标题 */}
        <div className="flex flex-col gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="text-sm font-mono tracking-widest uppercase text-primary">Contact</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold">联系我</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            有问题、建议或合作意向？欢迎随时联系我。我会尽快回复你的消息。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 联系表单 */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                发送消息
              </CardTitle>
              <CardDescription>
                填写下方表单，我会尽快回复你
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名 *</Label>
                    <Input
                      id="name"
                      placeholder="你的姓名"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱 *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">主题</Label>
                  <Input
                    id="subject"
                    placeholder="消息主题（可选）"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">消息内容 *</Label>
                  <Textarea
                    id="message"
                    placeholder="写下你想说的..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "发送中..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      发送消息
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <div className="space-y-6">
            {/* 其他联系方式 */}
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">其他联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target={link.href.startsWith("mailto") ? undefined : "_blank"}
                    rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {link.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{link.label}</div>
                      <div className="text-xs text-muted-foreground/70">{link.description}</div>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* 额外信息 */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">位置</div>
                    <div className="text-sm text-muted-foreground">中国</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">回复时间</div>
                    <div className="text-sm text-muted-foreground">通常在 24-48 小时内回复</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
