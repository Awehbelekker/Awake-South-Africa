"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingCart, Heart, User, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useWishlistStore } from "@/store/wishlist";
import { AWAKE_IMAGES } from "@/lib/constants";

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
    ],
  },
  { name: "Demo Rides", href: "/demo" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const { items: cartItems } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <div className="relative w-10 h-10 rounded-full border border-white/30 p-1">
              <Image src={AWAKE_IMAGES.logo} alt="Awake SA" fill className="object-contain" />
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
          <div className="lg:hidden fixed inset-0 top-20 bg-awake-black/98 backdrop-blur-lg z-50">
            <div className="px-4 py-8 space-y-4">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 text-lg font-medium text-white hover:text-accent-primary"
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
              <div className="pt-8 border-t border-white/10">
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-white"
                  >
                    <User className="w-5 h-5" />
                    <span>My Account</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full py-3 text-center font-medium text-awake-black bg-accent-primary rounded-lg"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
