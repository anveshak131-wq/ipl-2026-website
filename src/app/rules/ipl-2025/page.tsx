'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function IPL2025RulesPage() {
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/docs/IPL_2025_RULES_AND_REGULATIONS.md');
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        } else {
          setContent('# IPL 2025 Rules and Regulations\n\nContent loading...');
        }
      } catch (error) {
        console.error('Error loading content:', error);
        setContent('# IPL 2025 Rules and Regulations\n\nUnable to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-ipl-dark">
      <Navbar />

      <main className="relative flex-1 overflow-hidden">
        <AuroraBackground />
        
        {/* Animated background orbs */}
        <motion.div 
          className="fixed top-20 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ 
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.1), transparent)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Rules</span>
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                  IPL 2025 Rules
                </h1>
                <p className="text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Complete guide to all rules and regulations for the 2025 season
                </p>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 md:p-12 shadow-2xl"
          >
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <p className="text-gray-400 mt-4">Loading content...</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => {
                      const text = typeof children === 'string' ? children : 
                        (Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('') : '');
                      const id = generateId(text);
                      return (
                        <h1 id={id} className="text-3xl font-black text-white mb-6 mt-8 first:mt-0 scroll-mt-20">
                          {children}
                        </h1>
                      );
                    },
                    h2: ({ children }) => {
                      const text = typeof children === 'string' ? children : 
                        (Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('') : '');
                      const id = generateId(text);
                      return (
                        <h2 id={id} className="text-2xl font-bold text-white mb-4 mt-8 scroll-mt-20">
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children }) => {
                      const text = typeof children === 'string' ? children : 
                        (Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('') : '');
                      const id = generateId(text);
                      return (
                        <h3 id={id} className="text-xl font-semibold text-white mb-3 mt-6 scroll-mt-20">
                          {children}
                        </h3>
                      );
                    },
                    p: ({ children }) => (
                      <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-300">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-white font-semibold">{children}</strong>
                    ),
                    code: ({ children }) => (
                      <code className="bg-black/40 px-2 py-1 rounded text-blue-400 font-mono text-sm">{children}</code>
                    ),
                    a: ({ href, children }) => {
                      const isAnchor = href?.startsWith('#');
                      const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                        if (isAnchor) {
                          e.preventDefault();
                          const targetId = href?.substring(1);
                          const element = document.getElementById(targetId);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            // Update URL without reload
                            window.history.pushState(null, '', `#${targetId}`);
                          }
                        }
                      };
                      return (
                        <a 
                          href={href} 
                          onClick={handleClick}
                          className={`${isAnchor ? 'cursor-pointer' : ''} text-blue-400 hover:text-blue-300 underline`}
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

