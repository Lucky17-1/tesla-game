import { Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-5 w-1.5 rounded-full bg-primary" />
            <span className="font-display text-base font-bold tracking-widest uppercase">
              {SITE.name}
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            An independent, unofficial site about electric performance cars.
            We are not affiliated with any automaker.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link to="/cars" className="hover:text-primary transition-colors">Cars</Link></li>
            <li><Link to="/news" className="hover:text-primary transition-colors">News</Link></li>
            <li><Link to="/owner/login" className="hover:text-primary transition-colors">Owner</Link></li>
            <li><Link to="/game" className="hover:text-primary transition-colors">Racing game</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary transition-colors">About us</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of use</Link></li>
            <li><Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE.name}. Original content and concept design.
        Not affiliated with, endorsed by, or connected to any vehicle manufacturer.
      </div>
    </footer>
  );
}
