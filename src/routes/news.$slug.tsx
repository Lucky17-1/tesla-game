import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getArticle, getRelated } from "@/data/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSlot";
import { ShareLinks } from "@/components/ShareLinks";
import { formatDate } from "@/lib/format";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/news/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const article = loaderData?.article;
    if (!article) {
      return { meta: [{ title: "Article unavailable" }] };
    }
    return {
      meta: [
        { title: `${article.title} | ${SITE.name}` },
        { name: "description", content: article.excerpt },
        { property: "og:title", content: article.title },
        { property: "og:description", content: article.excerpt },
        { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
        { property: "article:published_time", content: article.date },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            datePublished: article.date,
            description: article.excerpt,
            author: { "@type": "Organization", name: SITE.name },
            publisher: { "@type": "Organization", name: SITE.name },
          }),
        },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const related = getRelated(article.slug);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/news" className="hover:text-primary transition-colors">
          News
        </Link>
        {" / "}
        <span>{article.category}</span>
      </nav>

      <article>
        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
              {article.category}
            </span>
            <time dateTime={article.date} className="text-muted-foreground">
              Published {formatDate(article.date)}
            </time>
            <span className="text-muted-foreground">· {article.readingMinutes} min read</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>
          <div className="mt-5">
            <ShareLinks title={article.title} />
          </div>
        </header>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <img
            src={article.image}
            alt={article.imageAlt}
            width={1600}
            height={912}
            className="w-full object-cover"
          />
        </div>

        <div className="prose-ev mt-8">
          {article.body.map((block, i) => {
            switch (block.type) {
              case "p":
                return <p key={i}>{block.text}</p>;
              case "h2":
                return <h2 key={i}>{block.text}</h2>;
              case "ul":
                return (
                  <ul key={i}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              case "note":
                return (
                  <aside
                    key={i}
                    className="my-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground not-prose"
                  >
                    {block.text}
                  </aside>
                );
            }
          })}
        </div>

        {/* Ad slot — renders nothing until a publisher ID is configured.
            Placed after the article body, away from navigation and controls. */}
        <AdSlot slotId="article-inline" className="my-10 min-h-0" />

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Sources</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {article.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary-glow"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Article text is original {SITE.name} content. Linked sources are third
            parties we consulted; they do not endorse this site.
          </p>
        </section>
      </article>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">Related articles</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
