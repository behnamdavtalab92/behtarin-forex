import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, RefreshCw, Loader2, ArrowDown, Reply } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTelegramMessages, getTelegramChannelInfo } from '../../services/api';

// Single message component
function MessageBubble({ post, onReplyClick, isHighlighted }) {
  const hasReply = post.replyTo && post.replyTo.text;
  
  return (
    <div 
      id={`msg-${post.id}`}
      className={`bg-[#182533] rounded-xl overflow-hidden transition-all duration-500 ${
        hasReply ? 'border-l-4 border-l-blue-500 border border-blue-500/20' : 'border border-white/5'
      } ${isHighlighted ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : ''}`}
    >
      {/* Reply preview (if exists) - Clickable! */}
      {hasReply && (
        <div 
          className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors active:bg-blue-500/30 flex items-start gap-2"
          onClick={() => onReplyClick(post.replyTo.id)}
        >
          <Reply size={14} className="text-blue-400 rotate-180 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0 bg-[#0e1621] rounded px-2 py-1.5 border-l-2 border-blue-400">
            <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed" dir="auto">
              {post.replyTo.text}
            </p>
          </div>
          <span className="text-[10px] text-blue-400 flex-shrink-0 mt-1">↩️</span>
        </div>
      )}
      
      {/* Message content */}
      <div className="p-4">
        <pre 
          className="text-gray-200 text-sm whitespace-pre-wrap font-sans leading-relaxed"
          dir="auto"
        >
          {post.text}
        </pre>
      </div>
      
      {/* Footer with time and views */}
      {(post.time || post.views) && (
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>{post.time}</span>
          {post.views && <span>👁 {post.views}</span>}
        </div>
      )}
    </div>
  );
}

export default function TelegramChannel() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to specific message and highlight it
  const scrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(messageId);
      // Remove highlight after 2 seconds
      setTimeout(() => setHighlightedId(null), 2000);
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const fetchPosts = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const [messages, info] = await Promise.all([
        getTelegramMessages(30),
        getTelegramChannelInfo()
      ]);
      
      if (messages && messages.length > 0) {
        setPosts(messages);
        
        // Only scroll to bottom on FIRST load
        if (isFirstLoad) {
          setTimeout(scrollToBottom, 150);
        }
        // On refresh: do NOTHING with scroll - stay where you are
      }
      
      if (info) {
        setChannelInfo(info);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts(true); // First load - scroll to bottom
    const interval = setInterval(() => fetchPosts(false), 5000); // Refresh - don't touch scroll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0e1621] safe-top relative">
      {/* Header */}
      <div className="bg-[#17212b] text-white p-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="p-1 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft size={22} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Send size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-[15px]">{channelInfo?.title || 'Signal Channel'}</div>
              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>@{channelInfo?.username || 'behtarinforex'}</span>
                {channelInfo?.memberCount > 0 && (
                  <span className="text-blue-400">• {channelInfo.memberCount.toLocaleString()} عضو</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchPosts(false)}
            disabled={refreshing}
            className="p-2 hover:bg-white/10 rounded-full transition disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={18} className="text-gray-400 animate-spin" />
            ) : (
              <RefreshCw size={18} className="text-gray-400" />
            )}
          </button>
          <a 
            href={`https://t.me/${channelInfo?.username || 'behtarinforex'}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full hover:bg-blue-600"
          >
            Join
          </a>
        </div>
      </div>

      {/* Posts */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            هیچ پیامی یافت نشد
          </div>
        ) : (
          <>
            {/* Load more link at top */}
            <div className="text-center py-2">
              <a 
                href={`https://t.me/${channelInfo?.username || 'behtarinforex'}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-400 text-xs hover:underline"
              >
                ← مشاهده پیام‌های قدیمی‌تر در تلگرام
              </a>
            </div>

            {posts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.01 }}
              >
                <MessageBubble 
                  post={post} 
                  onReplyClick={scrollToMessage}
                  isHighlighted={highlightedId === post.id}
                />
              </motion.div>
            ))}

            {/* Bottom anchor */}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 p-3 bg-[#17212b] border border-white/10 rounded-full shadow-lg hover:bg-[#1c2733] transition z-20"
        >
          <ArrowDown size={20} className="text-gray-400" />
        </button>
      )}

      {/* Footer */}
      <div className="bg-[#17212b] border-t border-[#0e1621] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <a 
          href={`https://t.me/${channelInfo?.username || 'behtarinforex'}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl py-3 text-white font-medium"
        >
          <Send size={18} />
          <span>عضویت در کانال</span>
        </a>
      </div>
    </div>
  );
}
