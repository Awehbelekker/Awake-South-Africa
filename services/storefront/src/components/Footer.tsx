import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { AWAKE_IMAGES, SA_CONTENT } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-awake-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative w-10 h-10">
                <Image src={AWAKE_IMAGES.logo} alt="Awake SA" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">AWAKE</span>
                <span className="text-[10px] text-accent-primary font-medium tracking-widest">SOUTH AFRICA</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              Official Awake Boards distributor for South Africa. Experience the future of watersports.
            </p>
            <div className="space-y-3 text-sm">
              <a href={`mailto:${SA_CONTENT.contact.email}`} className="flex items-center gap-3 text-gray-400 hover:text-accent-primary">
                <Mail className="w-4 h-4" /><span>{SA_CONTENT.contact.email}</span>
              </a>
              <a href={`tel:${SA_CONTENT.contact.phone}`} className="flex items-center gap-3 text-gray-400 hover:text-accent-primary">
                <Phone className="w-4 h-4" /><span>{SA_CONTENT.contact.phone}</span>
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4" /><span>{SA_CONTENT.address.city}, {SA_CONTENT.address.country}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <a href={SA_CONTENT.social.instagram} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-accent-primary hover:bg-accent-primary/10">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={SA_CONTENT.social.facebook} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-accent-primary hover:bg-accent-primary/10">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={SA_CONTENT.social.youtube} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-accent-primary hover:bg-accent-primary/10">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white font-semibold mb-4">Products</h4>
            <ul className="space-y-3">
              <li><Link href="/products?category=jetboards" className="text-sm text-gray-400 hover:text-accent-primary">RÄVIK Jetboards</Link></li>
              <li><Link href="/products?category=efoils" className="text-sm text-gray-400 hover:text-accent-primary">VINGA eFoils</Link></li>
              <li><Link href="/products?category=accessories" className="text-sm text-gray-400 hover:text-accent-primary">Accessories</Link></li>
              <li><Link href="/compare" className="text-sm text-gray-400 hover:text-accent-primary">Compare Models</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-accent-primary">About Us</Link></li>
              <li><Link href="/demo" className="text-sm text-gray-400 hover:text-accent-primary">Demo Rides</Link></li>
              <li><Link href="/blog" className="text-sm text-gray-400 hover:text-accent-primary">Blog</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-accent-primary">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/support" className="text-sm text-gray-400 hover:text-accent-primary">Help Center</Link></li>
              <li><Link href="/warranty" className="text-sm text-gray-400 hover:text-accent-primary">Warranty</Link></li>
              <li><Link href="/shipping" className="text-sm text-gray-400 hover:text-accent-primary">Shipping</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-accent-primary">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Awake Boards South Africa. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Prices include 15% VAT</span><span>•</span><span>Currency: ZAR (R)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
