"use client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { PRODUCTS } from "@/lib/constants";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Find the product from all categories
  const allProducts = [
    ...PRODUCTS.jetboards,
    ...PRODUCTS.limitedEdition,
    ...PRODUCTS.efoils,
    ...PRODUCTS.batteries,
    ...PRODUCTS.boardsOnly,
    ...PRODUCTS.wings,
    ...PRODUCTS.bags,
    ...PRODUCTS.safetyStorage,
    ...PRODUCTS.electronics,
    ...PRODUCTS.parts,
    ...PRODUCTS.apparel,
  ];

  const product = allProducts.find(p => p.id === params.id);

  if (!product) {
    return (
      <div className="min-h-screen bg-awake-black text-white pt-32 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <button
            onClick={() => router.push("/products")}
            className="px-6 py-3 bg-accent-primary text-awake-black rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => `R${price.toLocaleString()}`;
  const isInWishlist = wishlistItems.some(item => item.id === product.id);

  // Image gallery from Awake website
  const productGallery = [
    product.image,
    "https://awakeboards.com/cdn/shop/files/Ravik_ADVENTURE-22_1_1.png?v=1752232151",
    "https://awakeboards.com/cdn/shop/files/accessory-ladies_4.png?v=1752224160",
    "https://awakeboards.com/cdn/shop/files/BRABUSx3.png?v=1754380085",
  ];

  // Product videos
  const productVideos = [
    {
      id: 'demo',
      title: 'Product Demo',
      thumbnail: product.image,
      embedId: 'dQw4w9WgXcQ',
      duration: '2:30'
    },
    {
      id: 'features',
      title: 'Features Walkthrough',
      thumbnail: product.image,
      embedId: 'dQw4w9WgXcQ',
      duration: '3:15'
    },
    {
      id: 'review',
      title: 'Customer Review',
      thumbnail: product.image,
      embedId: 'dQw4w9WgXcQ',
      duration: '4:50'
    },
  ];

  // Ride profile stats
  const rideProfile = {
    topSpeed: '58 km/h',
    range: '40 km',
    rideTime: '45 min',
    weight: '35 kg',
    chargingTime: '80 min'
  };

  const toggleWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
    }
  };

  return (
    <div className="min-h-screen bg-awake-black text-white pt-24">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => router.push("/products")}
          className="text-accent-primary hover:text-accent-secondary transition-colors flex items-center gap-2"
        >
          ← Back to Products
        </button>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image Gallery */}
          <div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 mb-4">
              <Image
                src={productGallery[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {'badge' in product && product.badge && (
                <div className="absolute top-6 left-6 bg-accent-primary text-awake-black px-4 py-2 rounded-full text-sm font-bold">
                  {product.badge}
                </div>
              )}
            </div>
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3">
              {productGallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    selectedImage === idx
                      ? 'ring-2 ring-accent-primary'
                      : 'ring-1 ring-white/20 hover:ring-white/40'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`View ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="text-accent-primary text-sm font-medium">
                {(product as any).categoryTag || (product as any).category || 'Product'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>

            {'skillLevel' in product && product.skillLevel && (
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-accent-primary/10 text-accent-primary text-sm font-medium rounded-full">
                  Skill Level: {product.skillLevel}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="text-4xl font-bold text-accent-primary mb-2">
                {formatPrice(product.price)}
              </div>
              {product.priceExVAT && (
                <div className="text-lg text-gray-400">
                  {formatPrice(product.priceExVAT)} ex-VAT
                </div>
              )}
            </div>

            {/* Battery Info */}
            {'battery' in product && product.battery && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-sm text-gray-400 mb-1">Battery</div>
                <div className="text-lg font-medium">🔋 {product.battery}</div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">{product.description}</p>
            )}

            {/* Specs */}
            {'specs' in product && product.specs && product.specs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Specifications</h3>
                <ul className="space-y-3">
                  {product.specs.map((spec, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-accent-primary">✓</span>
                      <span className="text-gray-300">{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Features */}
            {'features' in product && product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Key Features</h3>
                <ul className="space-y-3">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-accent-primary">★</span>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-auto pt-8">
              <button
                onClick={() => {
                  addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1,
                  });
                  router.push("/cart");
                }}
                className="flex-1 bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors text-lg"
              >
                Add to Cart
              </button>
              <button
                onClick={toggleWishlist}
                className={`px-6 py-4 rounded-lg font-bold transition-colors ${
                  isInWishlist
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                ♥
              </button>
            </div>

            {/* Contact Sales CTA */}
            <div className="mt-6 p-4 bg-accent-primary/10 rounded-lg border border-accent-primary/20">
              <p className="text-sm text-gray-300 mb-2">
                Need help or want to schedule a demo?
              </p>
              <a
                href="/demo"
                className="text-accent-primary hover:text-accent-secondary font-medium"
              >
                Book a Demo →
              </a>
            </div>
          </div>
        </div>

        {/* Ride Profile Section */}
        <div className="mt-24 py-16 bg-awake-gray rounded-2xl">
          <div className="px-8">
            <h2 className="text-3xl font-bold mb-12 text-center">Ride Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">🏁</div>
                <div className="text-3xl font-bold mb-1">{rideProfile.topSpeed}</div>
                <div className="text-sm text-gray-400">Top Speed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">📏</div>
                <div className="text-3xl font-bold mb-1">{rideProfile.range}</div>
                <div className="text-sm text-gray-400">Range</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">⏱️</div>
                <div className="text-3xl font-bold mb-1">{rideProfile.rideTime}</div>
                <div className="text-sm text-gray-400">Ride Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">⚖️</div>
                <div className="text-3xl font-bold mb-1">{rideProfile.weight}</div>
                <div className="text-sm text-gray-400">Weight</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-primary mb-2">⚡</div>
                <div className="text-3xl font-bold mb-1">{rideProfile.chargingTime}</div>
                <div className="text-sm text-gray-400">Charging</div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold mb-8">See It In Action</h2>
          
          {playingVideo ? (
            <div>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 mb-6">
                <iframe
                  src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`}
                  title="Product Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-accent-primary hover:text-accent-secondary flex items-center gap-2"
              >
                ← Back to videos
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {productVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setPlayingVideo(video.embedId)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-3">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/30 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-accent-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-awake-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {/* Duration */}
                    <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-accent-primary transition-colors">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {allProducts
              .filter(p => p.id !== product.id && ((p as any).categoryTag === (product as any).categoryTag || p.category === product.category))
              .slice(0, 3)
              .map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  onClick={() => router.push(`/products/${relatedProduct.id}`)}
                  className="bg-awake-gray rounded-xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-accent-primary transition-all"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={relatedProduct.image || '/images/awake-default.jpg'}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{relatedProduct.name}</h3>
                    <div className="text-accent-primary font-bold">
                      {formatPrice(relatedProduct.price)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
