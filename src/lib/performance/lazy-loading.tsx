/**
 * Lazy Loading Utilities
 * Implement lazy loading for images and components
 */

"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Hook for lazy loading with Intersection Observer
 */
export function useLazyLoad<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.01,
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isVisible };
}

/**
 * Lazy load component wrapper
 */
interface LazyLoadProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: React.ReactNode;
  height?: number | string;
}

export function LazyLoad({
  children,
  className = "",
  placeholder,
  height = "auto",
}: LazyLoadProps) {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: height }}
    >
      {isVisible ? children : placeholder}
    </div>
  );
}

/**
 * Preload critical resources
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Prefetch resources
 */
export function prefetchResources(urls: string[]) {
  if (typeof window === "undefined") return;

  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  });
}
