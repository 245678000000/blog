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

  // 调用方通常直接传对象字面量，把 options 放进 useCallback 依赖会让 ref
  // 每次渲染都换新身份，导致 React 反复解绑/重绑并重建 observer。
  // 存进 ref 既能保持回调稳定，又能读到最新的 options。
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
        { threshold: 0.1, ...optionsRef.current }
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
