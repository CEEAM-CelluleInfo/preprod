import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const LAST_UPDATED = '8 septembre 2026';

export const ConditionsUtilisation: React.FC = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#f5f7fb]">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#172d45' }}>
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {LAST_UPDATED}</p>

            <div className="prose prose-sm md:prose-base max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>1. Objet</h2>
                <p>
                  Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et
                  l'utilisation de la plateforme numérique CEEAM (Club des Étudiants et Élèves en
                  Afrique et au Monde), accessible à l'adresse ceaam.org (ci-après « la Plateforme »),
                  éditée par l'association CEEAM, association à but non lucratif basée à Meknès, Maroc.
                </p>
                <p>
                  En créant un compte ou en utilisant la Plateforme, vous acceptez sans réserve les
                  présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la
                  Plateforme.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>2. Objet de la Plateforme</h2>
                <p>La Plateforme a pour vocation de :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Faciliter la mise en relation entre étudiants, membres du Bureau, lauréats et anciens membres de la communauté CEEAM ;</li>
                  <li>Diffuser des informations relatives aux activités, événements et actualités de l'association ;</li>
                  <li>Permettre la gestion des adhésions, candidatures aux instances du Bureau, et votes internes ;</li>
                  <li>Offrir un espace de ressources pédagogiques (Classroom) et un annuaire des lauréats.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>3. Accès à la Plateforme et création de compte</h2>
                <p>
                  L'accès à certaines fonctionnalités nécessite la création d'un compte utilisateur.
                  L'inscription est réservée aux étudiants, élèves, membres et anciens membres de la
                  communauté CEEAM.
                </p>
                <p>
                  Lors de l'inscription, vous vous engagez à fournir des informations exactes,
                  complètes et à jour, et à les maintenir à jour. Vous êtes seul responsable de la
                  confidentialité de vos identifiants de connexion et de toute activité effectuée
                  depuis votre compte.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>4. Rôles et permissions</h2>
                <p>
                  La Plateforme distingue plusieurs types de comptes (étudiant, membre du Bureau,
                  administrateur, administrateur de promotion, lauréat), chacun disposant de
                  fonctionnalités et permissions spécifiques définies par l'association.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>5. Règles d'utilisation</h2>
                <p>En utilisant la Plateforme, vous vous engagez à ne pas :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Publier de contenu illicite, diffamatoire, injurieux, discriminatoire ou portant atteinte aux droits de tiers ;</li>
                  <li>Usurper l'identité d'une autre personne ou entité ;</li>
                  <li>Perturber le fonctionnement technique de la Plateforme (tentative d'intrusion, surcharge délibérée, etc.) ;</li>
                  <li>Utiliser la Plateforme à des fins commerciales non autorisées par l'association ;</li>
                  <li>Collecter ou exploiter les données d'autres utilisateurs à des fins étrangères à l'objet de la Plateforme.</li>
                </ul>
                <p>
                  Le non-respect de ces règles peut entraîner la suspension ou la suppression du
                  compte concerné, sans préavis, à la discrétion du Bureau de l'association.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>6. Contenu publié par les utilisateurs</h2>
                <p>
                  Vous restez propriétaire des contenus que vous publiez sur la Plateforme (photo de
                  profil, biographie, publications, etc.). En les publiant, vous accordez à CEEAM une
                  licence non exclusive d'utilisation, de reproduction et d'affichage de ces contenus,
                  dans la mesure nécessaire au fonctionnement de la Plateforme.
                </p>
                <p>
                  Vous garantissez disposer de tous les droits nécessaires sur les contenus publiés
                  (notamment les photographies) et vous engagez à ne pas porter atteinte aux droits de
                  tiers.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>7. Propriété intellectuelle</h2>
                <p>
                  La structure générale de la Plateforme, ainsi que les textes, graphismes, logos et
                  éléments qui la composent (hors contenus publiés par les utilisateurs), sont la
                  propriété de CEEAM ou de ses partenaires, et sont protégés par les lois relatives à
                  la propriété intellectuelle en vigueur au Maroc.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>8. Données personnelles</h2>
                <p>
                  Le traitement de vos données personnelles est décrit dans notre{' '}
                  <a href="/politique-de-confidentialite" className="font-semibold underline" style={{ color: '#172d45' }}>
                    Politique de Confidentialité
                  </a>
                  , qui fait partie intégrante des présentes CGU.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>9. Responsabilité</h2>
                <p>
                  CEEAM met tout en œuvre pour assurer la disponibilité et la sécurité de la
                  Plateforme, sans garantie de résultat. CEEAM ne saurait être tenue responsable :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Des interruptions temporaires de service liées à la maintenance ou à des causes techniques indépendantes de sa volonté ;</li>
                  <li>Des contenus publiés par les utilisateurs ;</li>
                  <li>Des dommages indirects résultant de l'utilisation de la Plateforme.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>10. Suspension et suppression de compte</h2>
                <p>
                  CEEAM se réserve le droit de suspendre ou supprimer tout compte en cas de
                  non-respect des présentes CGU, sans préavis ni indemnité. Tout utilisateur peut
                  également demander la suppression de son compte à tout moment (voir la Politique de
                  Confidentialité).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>11. Modification des CGU</h2>
                <p>
                  CEEAM se réserve le droit de modifier les présentes CGU à tout moment. Les
                  utilisateurs seront informés de toute modification substantielle. La poursuite de
                  l'utilisation de la Plateforme après modification vaut acceptation des nouvelles CGU.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>12. Droit applicable et juridiction</h2>
                <p>
                  Les présentes CGU sont soumises au droit marocain. Tout litige relatif à leur
                  interprétation ou leur exécution relève de la compétence exclusive des tribunaux
                  compétents de Meknès, Maroc, sauf disposition légale impérative contraire.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>13. Contact</h2>
                <p>
                  Pour toute question relative aux présentes CGU, vous pouvez nous contacter à
                  l'adresse :{' '}
                  <a href="mailto:ceeam.meknes@gmail.com" className="font-semibold underline" style={{ color: '#172d45' }}>
                    ceeam.meknes@gmail.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ConditionsUtilisation;
