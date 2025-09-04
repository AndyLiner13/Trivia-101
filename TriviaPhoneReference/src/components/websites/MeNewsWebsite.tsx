import React from 'react';

interface Article {
  id: string;
  title: string;
  preview: string;
  publishedTime: string;
  category: string;
  borderColor: string;
  hoverColor: string;
  content: string;
}

const articles: Article[] = [
  {
    id: 'sock-market',
    title: 'Sock Market Hits Record High - Investors Go Toe-to-Toe!',
    preview: 'Major sock indices close at all-time highs amid positive wool data...',
    publishedTime: '4 hours ago',
    category: 'Business',
    borderColor: 'border-green-600',
    hoverColor: 'hover:bg-green-50',
    content: `
      <h1>Sock Market Hits Record High - Investors Go Toe-to-Toe!</h1>
      <p><strong>Published 4 hours ago | Business</strong></p>
      
      <p>Sock Street celebrated today as major sock indices closed at all-time highs, driven by better-than-expected cotton data and strong hosiery earnings reports.</p>
      
      <h2>Market Performance</h2>
      <ul>
        <li>S&P Socks: Up 2.3% to 5,847 pairs</li>
        <li>Toe Jones: Up 1.8% to 39,562 pairs</li>
        <li>NASDAC (National Association of Sock Dealers): Up 3.1% to 18,439 pairs</li>
      </ul>
      
      <p>The rally was led by athletic sock stocks, with moisture-wicking companies showing particularly strong gains. Nike Dri-FIT surged 8% following positive quarterly heel results, while Bombas gained 4% on strong toe-grip sales data.</p>
      
      <h2>Economic Indicators</h2>
      <p>Today's surge was fueled by several positive sock indicators released this morning:</p>
      <ul>
        <li>Hole rate dropped to 3.2%</li>
        <li>Yarn growth exceeded expectations at 3.8%</li>
        <li>Consumer comfort index reached 115.8</li>
      </ul>
      
      <p>Chief Market Strategist Jennifer Walsh commented: "We're seeing a perfect storm of positive factors aligning. Strong sock fundamentals, robust cotton earnings, and optimistic heel outlook are driving this historic rally. The market is really putting its best foot forward!"</p>
    `
  }
];

interface MeNewsWebsiteProps {
  currentPage?: string;
  onNavigate?: (url: string) => void;
}

export function MeNewsWebsite({ currentPage = 'menews.com', onNavigate }: MeNewsWebsiteProps) {
  
  // Check if we're viewing an article
  if (currentPage.startsWith('article-')) {
    const articleId = currentPage.replace('article-', '');
    const article = articles.find(a => a.id === articleId);
    
    if (!article) {
      return (
        <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
          <div className="bg-white border-2 border-red-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h1 className="text-red-800" style={{ fontWeight: "600" }}>Article Not Found</h1>
            <p className="text-gray-700">The requested article could not be found.</p>

          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {/* Article Header */}
        <div className="bg-blue-600 text-white border-2 border-blue-800 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>📰 MeNews</h1>
          <p className="text-blue-100">Breaking News & Current Events</p>
        </div>

        {/* Article Content */}
        <div className="bg-white border-2 border-gray-300" style={{ padding: "clamp(1.5rem, 8cqw, 2rem)" }}>
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
            style={{ lineHeight: "1.6" }}
          />
        </div>
      </div>
    );
  }

  // Main news page
  return (
    <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
      {/* Header */}
      <div className="bg-blue-600 text-white border-2 border-blue-800 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>📰 MeNews</h1>
        <p className="text-blue-100">Breaking News & Current Events</p>
      </div>


      
      <div className="space-y-4">
        {articles.map((article) => (
          <div 
            key={article.id}
            className={`bg-white border-2 ${article.borderColor} ${article.hoverColor} cursor-pointer`} 
            style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}
            onClick={() => onNavigate?.(`article-${article.id}`)}
          >
            <h3 className={`text-${article.borderColor.split('-')[1]}-800`} style={{ fontSize: "clamp(1rem, 6cqw, 1.25rem)", fontWeight: "600" }}>
              {article.title}
            </h3>
            <p className="text-gray-700">{article.preview}</p>
            <p className="text-gray-500 mt-2">Published {article.publishedTime}</p>
          </div>
        ))}
      </div>
    </div>
  );
}