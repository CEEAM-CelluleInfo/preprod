const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-white">
            CEEAM:
            <span className="underline decoration-primary decoration-2 underline-offset-4 text-white">
              Communauté des Étudiants Étrangers Arts & Métiers
            </span>
            .
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Liens Rapides */}
          <div>
            <h4 className="font-semibold text-white mb-4">Liens Rapides</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-white hover:underline">Accueil</a>
              </li>
              <li>
                <a href="/ecole" className="text-white hover:text-primary transition-colors">École</a>
              </li>
              <li>
                <a href="/activites" className="text-white hover:text-primary transition-colors">Activités</a>
              </li>
              <li>
                <a href="/laureats" className="text-white hover:text-primary transition-colors">Lauréats</a>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contacts</h4>
            <ul className="space-y-2 text-white">
              <li>Localisation:</li>
              <li>Adresse</li>
              <li className="pt-2">
                <a href="#contact" className="text-white underline hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border py-4">
        <p className="text-center text-sm text-white">
          © 2026 CEEAM – ENSAM. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
