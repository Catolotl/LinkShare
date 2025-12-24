const { useState, useEffect } = React;

function LinkShareSocial() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPosts, setLikedPosts] = useState({});
  const [activeTab, setActiveTab] = useState('home');

  const urlParams = new URLSearchParams(window.location.search);
  const sharedPostId = urlParams.get('post');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/gun/gun.js';
    script.async = true;
    
    script.onload = () => {
      const gun = window.Gun(['https://gun-manhattan.herokuapp.com/gun']);
      const postsRef = gun.get('linkshare-posts-v2');

      if (sharedPostId) {
        postsRef.get(sharedPostId).once((data) => {
          if (data) {
            setPosts([{ id: sharedPostId, ...data }]);
            setLoading(false);
          }
        });
      } else {
        postsRef.map().on((data, id) => {
          if (data && !data._) {
            setPosts(prev => {
              const exists = prev.find(p => p.id === id);
              if (exists) return prev;
              return [...prev, { id, ...data }].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
            });
          }
        });
        setLoading(false);
      }

      window.gunInstance = gun;
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [sharedPostId]);

  const handlePost = () => {
    if (!newPost.trim() || !username.trim()) return;

    const gun = window.gunInstance;
    if (!gun) return;

    const postId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const postData = {
      content: newPost,
      username: username,
      timestamp: Date.now(),
      likes: 0
    };

    gun.get('linkshare-posts-v2').get(postId).put(postData);

    setPosts(prev => [{ id: postId, ...postData }, ...prev].slice(0, 50));
    setNewPost('');
  };

  const handleLike = (postId) => {
    if (likedPosts[postId]) return;
    
    const gun = window.gunInstance;
    if (!gun) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newLikes = (post.likes || 0) + 1;
    gun.get('linkshare-posts-v2').get(postId).get('likes').put(newLikes);

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
    setLikedPosts(prev => ({ ...prev, [postId]: true }));
  };

  const getShareLink = (postId) => {
    return `${window.location.origin}${window.location.pathname}?post=${postId}`;
  };

  const copyLink = (postId) => {
    const link = getShareLink(postId);
    navigator.clipboard.writeText(link);
    setCopied(postId);
    setTimeout(() => setCopied(null), 2000);
  };

  const recentPosts = [...posts].slice(0, 10);
  const mostLikedPosts = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10);
  const searchedPosts = searchQuery 
    ? posts.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const getDisplayPosts = () => {
    switch(activeTab) {
      case 'recent':
        return recentPosts;
      case 'trending':
        return mostLikedPosts;
      case 'search':
        return searchedPosts;
      default:
        return posts;
    }
  };

  const displayPosts = getDisplayPosts();

  // Simple SVG icons as components
  const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );

  const ClockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  const TrendingIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );

  const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  );

  const MessageIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  const HeartIcon = ({ filled }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );

  const ShareIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-purple-400 text-lg">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar */}
        <div className="w-80 min-h-screen bg-gray-800 border-r border-gray-700 p-6 sticky top-0 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="text-purple-500"><MessageIcon /></div>
            <h1 className="text-2xl font-bold">LinkShare</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="space-y-2 mb-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'home' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <HomeIcon />
              <span className="font-semibold">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('recent')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'recent' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ClockIcon />
              <span className="font-semibold">Recent</span>
            </button>

            <button
              onClick={() => setActiveTab('trending')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'trending' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <TrendingIcon />
              <span className="font-semibold">Trending</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'search' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <SearchIcon />
              <span className="font-semibold">Search</span>
            </button>
          </div>

          {/* Search Input */}
          {activeTab === 'search' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Info Panel */}
          <div className="bg-gray-700 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-2 text-purple-400">About</h3>
            <p className="text-sm text-gray-400">
              Decentralized social media. No accounts, no backend. Share posts via links!
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Post Creation */}
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Create Post</h2>
            
            {sharedPostId && (
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 mb-4">
                <p className="text-purple-300 text-sm">📍 Viewing shared post</p>
                <button
                  onClick={() => window.location.href = window.location.pathname}
                  className="text-purple-400 text-sm underline mt-1 hover:text-purple-300"
                >
                  View all posts
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            <textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-3 h-24 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            <button
              onClick={handlePost}
              disabled={!newPost.trim() || !username.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
            >
              Post
            </button>
          </div>

          {/* Tab Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold">
              {activeTab === 'home' && 'All Posts'}
              {activeTab === 'recent' && 'Recent Posts'}
              {activeTab === 'trending' && 'Trending Posts'}
              {activeTab === 'search' && 'Search Results'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'home' && 'Latest updates from everyone'}
              {activeTab === 'recent' && 'Most recent 10 posts'}
              {activeTab === 'trending' && 'Most liked posts'}
              {activeTab === 'search' && searchQuery ? `Results for "${searchQuery}"` : 'Enter a username to search'}
            </p>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {displayPosts.map((post) => (
              <div key={post.id} className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:border-gray-600 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-purple-400">{post.username}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => copyLink(post.id)}
                    className="flex items-center gap-2 bg-purple-600/20 text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-600/30 transition"
                  >
                    {copied === post.id ? (
                      <>
                        <CheckIcon />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <ShareIcon />
                        <span className="text-sm">Share</span>
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-gray-200 mb-4">{post.content}</p>
                
                <div className="flex items-center gap-4 mb-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={likedPosts[post.id]}
                    className="flex items-center gap-2 text-pink-400 hover:text-pink-300 disabled:text-gray-500 transition"
                  >
                    <HeartIcon filled={likedPosts[post.id]} />
                    <span className="text-sm">{post.likes || 0}</span>
                  </button>
                </div>

                <div className="bg-gray-900 rounded p-2 text-xs text-gray-500 font-mono break-all">
                  {getShareLink(post.id)}
                </div>
              </div>
            ))}

            {displayPosts.length === 0 && (
              <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-700">
                <p className="text-gray-400">
                  {activeTab === 'search' && !searchQuery && 'Enter a username to search'}
                  {activeTab === 'search' && searchQuery && 'No posts found for that user'}
                  {activeTab !== 'search' && 'No posts yet. Be the first to share!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(React.createElement(LinkShareSocial), document.getElementById('root'));
