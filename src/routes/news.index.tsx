import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { articles, ARTICLE_CATEGORIES } from "@/data/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { formatDate } from "@/lib/format";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: `EV News & Guides — ${SITE.name}` },
      {
        name: "description",
        content:
          "Original electric vehicle news, buying guides and explainers from VoltEdge — every article dated, sourced and clearly labeled.",
      },
      { property: "og:title", content: `EV News & Guides — ${SITE.name}` },
      {
        property: "og:description",
        content: "Original electric vehicle news, buying guides and explainers, dated and sourced.",
      },
    ],
  }),
  component: NewsIndex,
});

function NewsIndex() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesCategory = category === "All" || a.category === category;
      const matchesQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">News & guides</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Original reporting and explainers. Every article carries its publication
        date and the sources used — we never invent prices or launch dates.
      </p>

      {/* Search + filters */}
      <div className="mt-8 flex flex-col gap-4">
        <label className="relative block max-w-md">
          <span className="sr-only">Search articles</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {ARTICLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <>
          <p className="mt-8 text-sm text-muted-foreground" role="status">
            {filtered.length} article{filtered.length === 1 ? "" : "s"}
            {category !== "All" ? ` in ${category}` : ""}
            {query.trim() ? ` matching “${query.trim()}”` : ""} · newest first
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-xl border border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-semibold">No articles found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing matches “{query.trim() || category}”. Try a different search
            term or category.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
            className="mt-5 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Archive note */}
      <p className="mt-12 text-xs text-muted-foreground">
        Coverage begins {formatDate("2026-09-10")}; older industry topics are
        summarized in newer articles.
      </p>
    </main>
  );
}
