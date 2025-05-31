import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

const Footer = () => {
  return (
    <footer className="bg-aqua-950 text-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Lake Victoria Aquaculture</h3>
            <p className="text-gray-300 mb-4">
              Premium quality fish and chicken products sourced sustainably from Lake Victoria.
            </p>
            <div className="flex space-x-4">
              <Link to="#" className="text-gray-300 hover:text-white">
                <Facebook size={20} />
              </Link>
              <Link to="#" className="text-gray-300 hover:text-white">
                <Instagram size={20} />
              </Link>
              <Link to="#" className="text-gray-300 hover:text-white">
                <Twitter size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-300 hover:text-white">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-300 hover:text-white">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-300 hover:text-white">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <NewsletterForm />
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
              <div className="space-y-3">
                <p className="flex items-center text-gray-300">
                  <Mail size={16} className="mr-2" />
                  info@lakevictoriaaquaculture.com
                </p>
                <p className="flex items-center text-gray-300">
                  <Phone size={16} className="mr-2" />
                  +254 758 953 095
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Lake Victoria Aquaculture. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
