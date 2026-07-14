import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.matchMedia 解决 jsdom 下不支持 media query 的问题
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // 已废弃，但部分库仍在使用
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver 解决部分排版及动效库报错问题
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock IntersectionObserver 解决 ToC 组件中监听视口标题高亮的问题
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

const IntersectionObserverMock = vi.fn().mockImplementation((callback, options) => {
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    root: null,
    rootMargin: "",
    thresholds: [],
    takeRecords: () => [],
  };
});

window.IntersectionObserver = IntersectionObserverMock as any;

