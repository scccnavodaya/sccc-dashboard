import React from "react";

export interface FeedItem {
  id: number;
  title: string;
  content: string;
}

interface FeedListProps {
  items: FeedItem[];
  limit?: number;
}

export default function FeedList({ items, limit = 5 }: FeedListProps) {
  const visible = items.slice(0, limit);

  if (!visible.length) {
    return (
      <p className="text-gray-500 text-sm">
        Feeds will appear here once added by admin.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((item) => (
        <div
          key={item.id}
          className="p-3 border border-emerald-100 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 transition"
        >
          <h3 className="text-emerald-700 font-medium text-sm mb-1">
            {item.title || "Untitled Feed"}
          </h3>
          <p className="text-gray-700 text-xs leading-relaxed">
            {item.content || "No description provided."}
          </p>
        </div>
      ))}
    </div>
  );
}
