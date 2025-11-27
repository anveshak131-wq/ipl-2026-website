import Link from 'next/link';
import SportsUP18LogoWithText from '../branding/SportsUP18LogoWithText';

export default function Footer() {
  return (
    <footer className="glass-effect border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <SportsUP18LogoWithText 
                size="sm" 
                animated 
                showText 
                textPosition="right"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              SportsUP18 is your IPL 2026 experience platform. Experience the excitement of the world's premier T20 cricket league.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/matches" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Match Schedule
                </Link>
              </li>
              <li>
                <Link href="/teams" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Teams
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-gray-300 hover:text-white text-sm transition-colors">
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal & Info</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/legal" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Legal Information
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              &copy; {new Date().getFullYear()} SportsUP18. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
