import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const LAST_UPDATED = '8 septembre 2026';

export const PolitiqueConfidentialite: React.FC = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#f5f7fb]">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#172d45' }}>
              Politique de Confidentialité
            </h1>
            <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {LAST_UPDATED}</p>

            <div className="prose prose-sm md:prose-base max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>1. Responsable du traitement</h2>
                <p>
                  La présente Politique de Confidentialité décrit comment l'association CEEAM (Club
                  des Étudiants et Élèves en Afrique et au Monde), association basée à Meknès, Maroc,
                  collecte, utilise et protège les données personnelles des utilisateurs de la
                  plateforme ceaam.org (« la Plateforme »).
                </p>
                <p>
                  Pour toute question relative à vos données personnelles, vous pouvez nous contacter
                  à :{' '}
                  <a href="mailto:ceeam.meknes@gmail.com" className="font-semibold underline" style={{ color: '#172d45' }}>
                    ceeam.meknes@gmail.com
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>2. Données que nous collectons</h2>
                <p>Selon votre utilisation de la Plateforme, nous collectons :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Données d'identification et de compte :</strong> nom, prénom, adresse email, mot de passe (stocké sous forme chiffrée), rôle sur la plateforme.</li>
                  <li><strong>Données de profil :</strong> téléphone, WhatsApp, pays d'origine, promotion, spécialité, campus, photo de profil, biographie, lien LinkedIn, centres d'intérêt, langue préférée.</li>
                  <li><strong>Données liées à votre activité :</strong> inscriptions et participations aux activités et événements, votes exprimés lors des élections internes, candidatures aux instances du Bureau, demandes d'adhésion au statut de lauréat, notifications.</li>
                  <li><strong>Données techniques :</strong> adresse IP (conservée dans un journal d'audit pour les actions sensibles), date et heure de connexion, informations de session (cookies d'authentification).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>3. Pourquoi nous utilisons vos données</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Créer et gérer votre compte utilisateur ;</li>
                  <li>Vous permettre de participer aux activités, votes et candidatures de l'association ;</li>
                  <li>Afficher votre profil dans l'annuaire des membres/lauréats (selon votre rôle) ;</li>
                  <li>Vous envoyer des emails liés à votre compte (vérification d'email, réinitialisation de mot de passe, notifications importantes) ;</li>
                  <li>Assurer la sécurité de la Plateforme (journal d'audit, prévention des abus) ;</li>
                  <li>Améliorer le fonctionnement de la Plateforme.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>4. Base légale du traitement</h2>
                <p>
                  Le traitement de vos données repose sur l'exécution du contrat qui vous lie à CEEAM
                  en tant que membre inscrit sur la Plateforme (votre consentement lors de
                  l'inscription), ainsi que sur l'intérêt légitime de l'association à assurer le bon
                  fonctionnement, la sécurité et l'animation de sa communauté.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>5. Avec qui nous partageons vos données</h2>
                <p>
                  Nous ne vendons ni ne louons vos données personnelles. Elles peuvent être partagées
                  avec :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Les membres du Bureau de CEEAM, dans le cadre de la gestion de l'association ;</li>
                  <li>D'autres utilisateurs de la Plateforme, pour les informations que vous rendez visibles sur votre profil (annuaire, activités) ;</li>
                  <li>Nos prestataires techniques, strictement dans le cadre de l'hébergement et du fonctionnement de la Plateforme : hébergement du serveur (DigitalOcean), réseau de diffusion de contenu et protection (Cloudflare), envoi des emails transactionnels (Resend). Ces prestataires n'utilisent vos données que pour exécuter les services demandés par CEEAM.</li>
                </ul>
                <p>
                  Certains de ces prestataires peuvent traiter des données sur des serveurs situés hors
                  du Maroc (notamment en Europe). Dans ce cas, nous veillons à ce que ce traitement
                  reste limité au strict nécessaire au fonctionnement du service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>6. Durée de conservation</h2>
                <p>
                  Vos données sont conservées tant que votre compte est actif. En cas de suppression de
                  compte, vos données personnelles sont supprimées ou anonymisées dans un délai
                  raisonnable, sous réserve des données que nous devons conserver plus longtemps pour
                  des raisons légales, de sécurité (journal d'audit) ou de résolution de litiges.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>7. Sécurité de vos données</h2>
                <p>
                  Nous mettons en œuvre des mesures techniques raisonnables pour protéger vos données :
                  connexion chiffrée (HTTPS), mots de passe stockés de façon chiffrée, cookies
                  d'authentification protégés (HttpOnly, sécurisés), accès restreint aux données
                  administratives. Aucun système n'étant totalement infaillible, nous vous invitons à
                  utiliser un mot de passe fort et à ne pas le partager.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>8. Cookies</h2>
                <p>
                  La Plateforme utilise des cookies strictement nécessaires à l'authentification
                  (maintien de votre session de connexion) ainsi qu'un identifiant technique
                  anti-falsification de requête (CSRF). Nous n'utilisons pas de cookies publicitaires
                  ou de traçage à des fins commerciales.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>9. Vos droits</h2>
                <p>Conformément à la législation marocaine relative à la protection des données à caractère personnel, vous disposez des droits suivants sur vos données :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Droit d'accès :</strong> obtenir une copie des données que nous détenons sur vous ;</li>
                  <li><strong>Droit de rectification :</strong> corriger des données inexactes (directement modifiable depuis votre profil pour la plupart des champs) ;</li>
                  <li><strong>Droit de suppression :</strong> demander la suppression de votre compte et de vos données ;</li>
                  <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements pour des motifs légitimes.</li>
                </ul>
                <p>
                  Pour exercer ces droits, contactez-nous à{' '}
                  <a href="mailto:ceeam.meknes@gmail.com" className="font-semibold underline" style={{ color: '#172d45' }}>
                    ceeam.meknes@gmail.com
                  </a>
                  . Nous répondrons dans un délai raisonnable.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>10. Mineurs</h2>
                <p>
                  La Plateforme est destinée aux étudiants et élèves membres de la communauté CEEAM.
                  Si vous êtes mineur, l'inscription doit se faire avec l'accord d'un parent ou tuteur
                  légal.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>11. Modification de cette politique</h2>
                <p>
                  Nous pouvons mettre à jour cette Politique de Confidentialité. Toute modification
                  substantielle vous sera communiquée. La date de dernière mise à jour figure en haut
                  de cette page.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold" style={{ color: '#172d45' }}>12. Contact</h2>
                <p>
                  Pour toute question relative à cette Politique de Confidentialité ou à vos données
                  personnelles :{' '}
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

export default PolitiqueConfidentialite;
