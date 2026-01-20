import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-sans font-bold text-foreground mb-4">Manga Studio</h3>
            <p className="text-sm text-muted-foreground">
              Create stunning manga with AI technology.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/studio" className="text-muted-foreground hover:text-foreground transition-colors">Create</Link></li>
              <li><Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Manga Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
