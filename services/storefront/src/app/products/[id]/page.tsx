"use client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { PRODUCTS } from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

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
          {/* Product Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900">
            <Image
              src={product.image}
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

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="text-accent-primary text-sm font-medium">
                {'categoryTag' in product ? product.categoryTag : product.category}
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
      </div>
    </div>
  );
}
