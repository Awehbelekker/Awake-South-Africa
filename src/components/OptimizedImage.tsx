/**
 * Optimized Image Component
 * Implements lazy loading, blur placeholders, and responsive images
 */

"use client";
import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = "",
  sizes,
  quality = 85,
  objectFit = "cover",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Default fallback image
  const fallbackImage = "/images/placeholder.png";

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  const imageProps = {
    src: error ? fallbackImage : src,
    alt,
    quality,
    onLoad: handleLoadingComplete,
    onError: handleError,
    className: `${className} ${isLoading ? "blur-sm" : "blur-0"} transition-all duration-300`,
    priority,
    ...(fill
      ? { fill: true, style: { objectFit } }
      : { width, height, style: { objectFit } }),
    ...(sizes && { sizes }),
  };

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {isLoading && !priority && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 z-10">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      )}
      <Image {...imageProps} />
    </div>
  );
}
