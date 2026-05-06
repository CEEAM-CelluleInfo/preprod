import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Accueil", href: "/" },
    { name: "École", href: "/ecole" },
    { name: "Activités", href: "/activites" },
    { name: "Lauréats", href: "/laureats" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <img
              src="/log.jpeg"
              alt="CEEAM"
              className="h-11 w-auto object-contain"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={
                  location.pathname === link.href
                    ? "nav-link-active text-primary font-bold"
                    : "nav-link"
                }
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a href="/connexion">
              <button className="btn-primary">Connexion</button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`py-2 ${
                    location.pathname === link.href
                      ? "text-primary font-semibold"
                      : "text-foreground/80"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="/connexion"
                className="btn-primary mt-2 block w-full text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
