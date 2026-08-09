// shadcn 的默认实现从 next-themes 取主题，但本项目用的是自己的 ThemeContext，
// 根本没挂 next-themes 的 Provider——那样 theme 恒为 undefined、回退成 "system"，
// toast 会跟随操作系统而不是站点的主题开关（系统亮色 + 站点深色时 toast 是亮的）。
import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
