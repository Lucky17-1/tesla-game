import { Link } from "@tanstack/react-router";
import type { Article } from "@/data/articles";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to="/news/$slug"
      params={{ slug: article.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:glow-card"
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={article.image}
          alt={article.imageAlt}
          loading="lazy"
          width={1600}
          height={900}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
            {article.category}
          </span>
          <time dateTime={article.date} className="text-muted-foreground">
            {formatDate(article.date)}
          </time>
          <span className="text-muted-foreground">· {article.readingMinutes} min</span>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
        <span className="mt-auto pt-4 text-sm font-medium text-primary">
          Read article →
        </span>
      </div>
    </Link>
  );
}
