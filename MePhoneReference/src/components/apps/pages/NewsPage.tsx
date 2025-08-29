import React from 'react';

export function NewsPage() {
  return (
    <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
      {/* Header */}
      <div className="bg-blue-600 text-white border-2 border-blue-800 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>MeNews</h1>
        <p className="text-blue-100">Breaking News and Current Events</p>
      </div>

      {/* Breaking News */}
      <div className="border-2 border-red-600 bg-red-100 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <p className="text-red-800" style={{ fontWeight: "600" }}>BREAKING:</p>
        <h2 className="text-red-900" style={{ fontSize: "clamp(1rem, 6cqw, 1.25rem)", fontWeight: "600" }}>
          Tech Giant Announces Revolutionary AI Breakthrough
        </h2>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {[
          {
            title: "Global Climate Summit Reaches Historic Agreement",
            summary: "World leaders unite on ambitious carbon reduction targets for 2030.",
            time: "2 hours ago"
          },
          {
            title: "Major Breakthrough in Quantum Computing Research",
            summary: "Scientists achieve new milestone in quantum error correction.",
            time: "4 hours ago"
          },
          {
            title: "Global Markets Rally on Economic Recovery Signs",
            summary: "Stock markets worldwide show strong performance amid positive indicators.",
            time: "6 hours ago"
          },
          {
            title: "Space Mission Discovers Water on Distant Planet",
            summary: "NASA announces significant finding that could change our understanding.",
            time: "8 hours ago"
          },
          {
            title: "Renewable Energy Reaches New Milestone",
            summary: "Solar and wind power now account for 40% of global energy production.",
            time: "12 hours ago"
          },
          {
            title: "New Medical Treatment Shows Promise in Clinical Trials",
            summary: "Researchers report significant progress in treating rare genetic disorders.",
            time: "1 day ago"
          },
          {
            title: "International Trade Agreement Signed",
            summary: "Multiple countries agree to reduce tariffs on green technology imports.",
            time: "1 day ago"
          },
          {
            title: "Archaeological Discovery Reveals Ancient Civilization",
            summary: "Excavation team uncovers 3,000-year-old artifacts in remote location.",
            time: "2 days ago"
          }
        ].map((article, index) => (
          <div key={index} className="bg-white border-2 border-blue-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h3 className="text-blue-800 mb-2" style={{ fontSize: "clamp(1rem, 6cqw, 1.125rem)", fontWeight: "600" }}>{article.title}</h3>
            <p className="text-gray-700 mb-2">{article.summary}</p>
            <p className="text-blue-600" style={{ fontSize: "clamp(0.875rem, 5cqw, 1rem)" }}>{article.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}