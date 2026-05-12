"use client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCartStore } from "../../../store/cart";
import { useWishlistStore } from "../../../store/wishlist";
import { useProductsStore } from "../../../store/products";
import { useProduct } from "../../../lib/medusa-hooks";
import { ProductVideoSection } from "../../../components/products/ProductVideoSection";
import { Loader2, Play } from "lucide-react";
import { SA_CONTENT } from "../../../lib/constants";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [mounted, setMounted] = useState(false);

  const productId = typeof params.id === 'string' ? params.id : '';

  // Try Medusa API first
  const { data: medusaProduct, isLoading: medusaLoading, error: medusaError } = useProduct(productId);

  // Fall back to local store
  const { getProductById, products: localProducts } = useProductsStore();
  const localProduct = getProductById(productId);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which product to use: Medusa first, then local
  const product = medusaProduct || localProduct;

  // Show loading state
  if (!mounted || (medusaLoading && !localProduct)) {
    return (
      <div className="min-h-screen bg-awake-black text-white pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

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

  // Get related products from local store for "You May Also Like" section
  const allLocalProducts = localProducts;

  const formatPrice = (price: number) => `R${price.toLocaleString()}`;
  const isInWishlist = wishlistItems.some(item => item.id === product.id);

  // Build gallery from product images and videos uploaded in admin
  const defaultImage = product.image || '/images/awake-default.jpg';

  // Use uploaded images - NO VIDEOS in the gallery anymore
  const productImages = ('images' in product && product.images && product.images.length > 0)
    ? product.images.filter(img => img.type === 'image').map(img => ({ url: img.url, type: 'image' as const, id: img.id }))
    : [{ url: defaultImage, type: 'image' as const, id: 'default' }];

  // Gallery is images only
  const productGallery = productImages;

  const toggleWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || '/placeholder-product.jpg',
      });
    }
  };

  return (
    <div className="min-h-screen bg-awake-black text-white pt-24">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
          {/* Left Column - Product Images */}
          <div>
            {/* Product Image Gallery - Images Only */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 mb-4">
              <Image
                src={productGallery[selectedImage]?.url || defaultImage}
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
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {productGallery.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    selectedImage === idx
                      ? 'ring-2 ring-accent-primary'
                      : 'ring-1 ring-white/20 hover:ring-white/40'
                  }`}
                >
                  <Image
                    src={item.url}
                    alt={`View ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

          </div>

          {/* Right Column - Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="text-accent-primary text-sm font-medium">
                {(product as any).categoryTag || (product as any).category || 'Product'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>

            {'skillLevel' in product && product.skillLevel && (
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-accent-primary/10 text-accent-primary text-sm font-medium rounded-full">
                  Skill Level: {product.skillLevel}
                </span>
              </div>
            )}

            {/* Costs */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Costs</div>
              <div className="text-2xl sm:text-4xl font-bold text-accent-primary mb-1">
                {formatPrice(product.price)}
              </div>
              <div className="text-sm text-gray-400">incl. VAT</div>
              {product.priceExVAT && (
                <div className="text-lg text-gray-400 mt-1">
                  {formatPrice(product.priceExVAT)} <span className="text-sm">ex-VAT</span>
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

            {/* Equipment - Package Contents */}
            {'whatsIncluded' in product && product.whatsIncluded && product.whatsIncluded.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 rounded-2xl border border-accent-primary/20">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Equipment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.whatsIncluded.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg">
                      <span className="text-accent-primary text-lg">✓</span>
                      <span className="text-gray-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Actions */}
            <div className="mt-auto pt-8 space-y-3">
              {/* Top row: Add to Cart + Wishlist */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image || '/placeholder-product.jpg',
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
                  className={`px-5 py-4 rounded-lg font-bold transition-colors ${
                    isInWishlist
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ♥
                </button>
              </div>

              {/* Contact Sales — equal prominence */}
              <a
                href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%2C%20I%27m%20interested%20in%20the%20${encodeURIComponent(product.name)}%20(${formatPrice(product.price)}).%20Can%20you%20help%20me%3F`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-lg font-bold border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-awake-black transition-all text-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contact Sales via WhatsApp
              </a>

              {/* Secondary: Book a Demo */}
              <a
                href="/demo"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                📅 Book a Demo Ride
              </a>
            </div>

            {/* Trust line */}
            <p className="mt-4 text-center text-xs text-gray-500">
              High-value purchase? Our team is available on WhatsApp to answer questions, arrange test rides, and assist with financing.
            </p>

            {/* Compare boards link */}
            <div className="mt-6 text-center">
              <a href="/compare" className="text-xs text-gray-500 hover:text-accent-primary transition-colors underline underline-offset-2">
                Compare all boards side by side →
              </a>
            </div>
          </div>
        </div>

        {/* See It In Action - Video Section */}
        {'video_sections' in product && product.video_sections && (
          <ProductVideoSection videoSections={product.video_sections} />
        )}

        {/* Related Products */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {allLocalProducts
              .filter(p => p.id !== product.id && ((p as any).categoryTag === (product as any).categoryTag || p.category === (product as any).category))
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
