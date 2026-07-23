import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import { FiArrowLeft, FiClock, FiCalendar, FiUser, FiShare2, FiCheck, FiMail, FiMessageSquare } from "react-icons/fi";
import { FINLIGEN_BLOG_DATA } from "./FinliGenBlog";
import BlogSEO from "../seo/BlogSEO";

export default function BlogPostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Scroll to top instantly on load
    window.scrollTo(0, 0);

    const fetchPost = async () => {
      setLoading(true);
      try {
        // Try fetching from API
        const res = await fetch(`https://caster-backend.onrender.com/api/blog?organization=finligen`);
        if (res.ok) {
          const data = await res.json();
          const found = data.find((b) => b.url_handle === slug || b._id === slug);
          if (found) {
            setPost(found);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch from API, falling back to local data:", err);
      }

      // Fallback to local data
      const localFound = FINLIGEN_BLOG_DATA.find((b) => b.url_handle === slug || b._id === slug);
      setPost(localFound || null);
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#06363c]/10 border-t-[#06363c] animate-spin" />
        <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
          Loading Article...
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-4">
        <h2 className="text-3xl font-display font-bold text-gray-900">Article Not Found</h2>
        <p className="mt-2 text-gray-600 text-sm text-center max-w-md">
          The article you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06363c] text-white text-xs font-bold transition-all hover:bg-[#0d4b52]"
        >
          <FiArrowLeft size={14} /> Back to Blog
        </Link>
      </div>
    );
  }

  // Calculate read time
  const readTime = Math.ceil((post.word_count || 1500) / 200);

  // Generate fake related posts (other posts in the dataset)
  const relatedPosts = FINLIGEN_BLOG_DATA.filter((b) => b.url_handle !== post.url_handle).slice(0, 3);

  // Render content paragraphs properly
  const paragraphs = post.content 
    ? post.content.split("\n\n") 
    : [
        "Keeping your books closed on time and your U.S. tax compliance in order is essential for survival in today's cross-border business ecosystem. Without an efficient, systemized process, foreign founders often fall into economic tax nexus traps that cost tens of thousands of dollars in retrofitted penalties.",
        "A proper compliance checklist consists of state-level registration, filing forms 1120 and 5472, and maintaining accurate monthly ledgers. At FinliGen, our CA-led teams verify every transaction to make sure your business is 100% compliant with IRS guidelines.",
        "If you are managing high-growth startups or outsourcing for accounting firms, having direct access to specialized U.S. tax expertise changes the game entirely. Learn more by booking a discovery call with our partners today."
      ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-900 overflow-x-hidden">
      <BlogSEO title={`${post.title} — FinliGen Blog`} description={post.excerpt} />

      {/* Reading progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#06363c] z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Article Header Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#06363c] uppercase tracking-wider hover:translate-x-[-4px] transition-transform mb-8"
        >
          <FiArrowLeft size={14} /> Back to All Articles
        </Link>

        {/* Categories / Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(post.tags || ["Tax", "Compliance"]).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold text-[#06363c] bg-[#06363c]/5 uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-[#06363c]/10"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5.5xl font-display font-black leading-[1.1] tracking-tight text-gray-900 mb-6">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center justify-between border-y border-gray-200 py-5 mb-10 gap-4">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <FiUser className="text-[#06363c]" size={14} />
              <span>By {post.author || "CA Amit Kumar"}</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <FiCalendar className="text-[#06363c]" size={14} />
              <span>{post.created_at || "Jan 15, 2024"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <FiClock className="text-[#06363c]" size={14} />
              <span>{readTime} Min Read</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-xs font-bold text-[#06363c] bg-white border border-gray-200 px-3.5 py-1.5 rounded-lg hover:border-[#06363c]/30 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {copied ? (
                <>
                  <FiCheck className="text-emerald-600" size={14} />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <FiShare2 size={14} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative rounded-3xl overflow-hidden aspect-[16/9] mb-12 shadow-md">
          <img
            src={post.image_url || "https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=1600&q=80"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Paragraphs */}
        <div className="prose prose-lg max-w-none text-gray-750 font-body leading-relaxed space-y-7">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
              {p}
            </p>
          ))}
        </div>

        {/* CTA Block */}
        <div className="mt-16 bg-[#06363c] rounded-3xl p-8 sm:p-12 relative overflow-hidden text-white shadow-xl">
          <div className="absolute top-0 right-0 w-60 h-60 bg-[#7ecfc0]/10 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-display font-bold leading-tight">
              Don't guess your compliance.
            </h3>
            <p className="mt-3 text-white/70 text-xs sm:text-sm leading-relaxed">
              U.S. tax regulations are strict, and notices carry heavy retrofitted penalties. Connect directly with our CA-led team to audit your sales tax nexus, file correct returns, and structure clean offshore bookkeeping.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto bg-[#dff5b7] hover:bg-[#cef0a0] text-[#06363c] text-xs font-bold px-7 py-3.5 rounded-xl text-center shadow-lg transition-all duration-200"
              >
                Book Free CPA Consultation
              </Link>
              <a
                href="https://wa.me/918287512393"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold px-7 py-3.5 rounded-xl text-center transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FiMessageSquare size={14} /> Message WhatsApp
              </a>
            </div>
          </div>
        </div>

      </article>

      {/* Related Posts Section */}
      <section className="bg-gray-100/50 border-t border-gray-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Keep Reading
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mt-2">
                Related Articles
              </h2>
            </div>
            <Link
              to="/blog"
              className="text-xs font-bold text-[#06363c] hover:underline uppercase tracking-wider"
            >
              See All Articles
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rPost, idx) => {
              const rReadTime = Math.ceil((rPost.word_count || 1500) / 200);
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
                >
                  <div>
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={rPost.image_url}
                        alt={rPost.title}
                        className="w-full h-full object-cover hover:scale-105 transition-all duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-[9px] font-bold text-[#06363c] bg-[#06363c]/5 uppercase tracking-widest px-2.5 py-1 rounded-md">
                        {rPost.tags?.[0] || "Compliance"}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 mt-3 line-clamp-2 leading-snug">
                        {rPost.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {rPost.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-gray-100 flex items-center justify-between mt-4">
                    <span className="text-[10px] font-semibold text-gray-400">
                      {rPost.created_at}
                    </span>
                    <Link
                      to={`/blog/${rPost.url_handle}`}
                      className="text-xs font-bold text-[#06363c] hover:underline"
                    >
                      Read Post →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
