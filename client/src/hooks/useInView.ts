import { useEffect, useRef, useState, useCallback } from "react";

/**
 * 轻量 IntersectionObserver hook
 * 元素进入视口后返回 true（只触发一次）
 * 支持条件渲染：元素出现后才开始观察
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      // 清理旧的 observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || isVisible) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.disconnect();
          }
        },
        { threshold: 0.1, ...options }
      );

      observerRef.current.observe(node);
    },
    [isVisible]
  );

  // 组件卸载时清理
  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return [ref, isVisible] as const;
}
