'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, X } from 'lucide-react';

interface VideoSections {
  product_intro?: {
    enabled: boolean;
    url?: string;
    title?: string;
    description?: string;
  };
  action_videos?: {
    enabled: boolean;
    videos?: Array<{
      url: string;
      title: string;
      thumbnail?: string;
      customThumbnail?: string;
    }>;
  };
}

interface Props {
  videoSections: VideoSections;
}

export function ProductVideoSection({ videoSections }: Props) {
  const [playing, setPlaying] = useState<string | null>(null);

  const getEmbedUrl = (url: string): string => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`;
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    
    return url;
  };

  const hasAnyVideos = 
    (videoSections.product_intro?.enabled && videoSections.product_intro?.url) ||
    (videoSections.action_videos?.enabled && (videoSections.action_videos?.videos?.length ?? 0) > 0);

  if (!hasAnyVideos) return null;

  return (
    <div className="mt-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Watch real riders experience the thrill. See the performance, handling, and pure excitement in action.
        </p>
      </div>

      {/* Product Introduction Video */}
      {videoSections.product_intro?.enabled && videoSections.product_intro?.url && (
        <div className="mb-16">
          <div className="max-w-5xl mx-auto">
            {videoSections.product_intro.title && (
              <h3 className="text-2xl font-semibold mb-2 text-center">{videoSections.product_intro.title}</h3>
            )}
            {videoSections.product_intro.description && (
              <p className="text-gray-400 mb-6 text-center max-w-2xl mx-auto">{videoSections.product_intro.description}</p>
            )}
            
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
              <iframe
                src={getEmbedUrl(videoSections.product_intro.url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={videoSections.product_intro.title || 'Product Introduction'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Videos Grid */}
      {videoSections.action_videos?.enabled && videoSections.action_videos?.videos && videoSections.action_videos.videos.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold text-center mb-8">Action Videos</h3>
          
          {!playing ? (
            <div className={`grid gap-6 ${
              videoSections.action_videos.videos.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
              videoSections.action_videos.videos.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
              'md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {videoSections.action_videos.videos.map((video, index) => (
                <div 
                  key={index} 
                  className="group cursor-pointer"
                  onClick={() => setPlaying(video.url)}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-3 shadow-lg">
                    <Image
                      src={video.customThumbnail || video.thumbnail || '/images/awake-default.jpg'}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/awake-default.jpg';
                      }}
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/30 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-accent-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Play className="w-6 h-6 text-awake-black ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold group-hover:text-accent-primary transition-colors">
                    {video.title}
                  </h4>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-900 mb-6 max-w-5xl mx-auto">
                <iframe
                  src={getEmbedUrl(playing!)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Action Video"
                />
              </div>
              <button
                onClick={() => setPlaying(null)}
                className="text-accent-primary hover:text-accent-secondary flex items-center gap-2 mx-auto"
              >
                ← Back to videos
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full Screen Overlay (Alternative view) */}
      {playing && false && ( // Disabled in favor of inline player above
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={() => setPlaying(null)}
        >
          <div className="relative w-full max-w-6xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPlaying(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2 z-10"
            >
              <X className="w-8 h-8" />
              <span>Close</span>
            </button>
            <iframe
              src={getEmbedUrl(playing!)}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Player"
            />
          </div>
        </div>
      )}
    </div>
  );
}
