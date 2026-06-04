"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingCart, Heart, User, ChevronDown, Settings } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useWishlistStore } from "@/store/wishlist";
import { AWAKE_IMAGES, SA_CONTENT } from "@/lib/constants";

const navigation = [
  { name: "Home", href: "/" },
  {
    name: "Products",
    href: "/products",
    submenu: [
      { name: "All Products", href: "/products" },
      { name: "RÄVIK Jetboards", href: "/products?category=jetboards" },
      { name: "VINGA eFoils", href: "/products?category=efoils" },
      { name: "Accessories", href: "/products?category=accessories" },
      { name: "Compare Models", href: "/compare" },
    ],
  },
  { name: "Demo Rides", href: "/demo" },
  { name: "Blog", href: "/blog" },
  { name: "Get a Quote", href: "/quote" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  const { items: cartItems } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Hide header on admin pages
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/master-admin');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isAdminPage) {
    return null; // Don't render header on admin pages
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-awake-black/95 backdrop-blur-md shadow-lg border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-full border border-white/30 p-0.5 overflow-hidden">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-awake-black">
                <Image src={AWAKE_IMAGES.logo} alt="Awake SA" width={48} height={48} className="object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight">AWAKE</span>
              <span className="text-[10px] text-accent-primary font-medium tracking-widest">
                SOUTH AFRICA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    activeDropdown === item.name
                      ? "text-accent-primary"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.name}
                  {item.submenu && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        activeDropdown === item.name ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </Link>
                {item.submenu && activeDropdown === item.name && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className="bg-awake-charcoal rounded-lg border border-white/10 shadow-xl overflow-hidden min-w-[200px]">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/account/wishlist"
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary text-awake-black text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary text-awake-black text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link
                href="/account"
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white"
              >
                <User className="w-5 h-5" />
                <span>{user?.name || "Account"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex px-4 py-2 text-sm font-medium text-awake-black bg-accent-primary rounded-lg hover:bg-accent-primary/90"
              >
                Sign In
              </Link>
            )}
            {/* Admin Quick Access */}
            <Link
              href="/admin"
              className="hidden md:flex p-2 text-gray-500 hover:text-accent-primary transition-colors"
              title="Admin Panel"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-20 bg-awake-black/98 backdrop-blur-lg z-50 overflow-y-auto">
            <div className="px-4 py-6 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3.5 text-lg font-medium text-white hover:text-accent-primary border-b border-white/5"
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="pl-4 py-1 space-y-0.5 bg-white/3">
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2.5 text-sm text-gray-400 hover:text-accent-primary"
                        >
                          → {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-6 border-t border-white/10 space-y-3">
                <a
                  href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I\'d like to know more about Awake electric boards.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-semibold"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
                <Link
                  href="/demo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full py-3 text-center font-semibold text-white border border-white/20 rounded-xl hover:bg-white/10"
                >
                  Book a Demo Ride
                </Link>
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-gray-300"
                  >
                    <User className="w-5 h-5" />
                    <span>My Account</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full py-3 text-center font-medium text-awake-black bg-accent-primary rounded-xl"
                  >
                    Sign In
                  </Link>
                )}
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 text-gray-500 hover:text-accent-primary"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Admin Panel</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
