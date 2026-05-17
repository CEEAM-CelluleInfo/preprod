import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { UserService, PublicUser } from '@/services/userService';

const getInitials = (firstName: string | undefined, lastName: string | undefined): string => {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getSubtitle = (user: PublicUser) => {
  const parts = [];
  if (user.promotion) parts.push(user.promotion);
  if (user.specialite_intitule) parts.push(user.specialite_intitule);
  if (user.campus) parts.push(user.campus);
  return parts.join(' · ');
};

const Utilisateurs = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await UserService.getPublicUsers(debouncedSearch || undefined);
        setUsers(response.data || []);
      } catch (err) {
        console.error('Erreur chargement des utilisateurs publics:', err);
        setError('Impossible de charger la liste des utilisateurs pour le moment.');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();
  }, [debouncedSearch]);

  const resultsLabel = useMemo(() => {
    if (isLoading) return 'Chargement des utilisateurs...';
    if (error) return error;
    return `${users.length} utilisateur${users.length > 1 ? 's' : ''} trouvé${users.length > 1 ? 's' : ''}`;
  }, [isLoading, error, users.length]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <section className="bg-[#10263d] text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
                  <Users className="h-4 w-4 text-[#f59f24]" />
                  Communauté d'utilisateurs
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                    Tous les utilisateurs inscrits sur la plateforme
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-white/80">
                    Retrouvez les profils publics des membres, avec photo, promotion, spécialité et campus. Aucun détail privé n'est exposé.
                  </p>
                </div>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-200">Annuaire public</p>
                <div className="mt-4 text-3xl font-bold text-white">{resultsLabel}</div>
                <p className="mt-3 text-sm text-slate-200">
                  Cette liste est accessible à tous les visiteurs, sans connexion.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Liste des utilisateurs</h2>
              <p className="mt-2 text-sm text-slate-600">
                Parcourez tous les profils en quelques secondes. Utilisez la recherche pour filtrer par nom, promotion, spécialité ou campus.
              </p>
            </div>
            <div className="relative max-w-md w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Recherche des utilisateurs"
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1e40af] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {isLoading && (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-600 shadow-sm">
                Chargement des utilisateurs...
              </div>
            )}

            {error && !isLoading && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-center text-rose-700 shadow-sm">
                {error}
              </div>
            )}

            {!isLoading && !error && users.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-600 shadow-sm">
                Aucun utilisateur trouvé. Essayez une autre recherche.
              </div>
            )}

            {!isLoading && !error && users.map((user) => (
              <article key={user.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || `${user.first_name} ${user.last_name}`}
                      className="h-20 w-20 rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-2xl font-semibold text-slate-700">
                      {getInitials(user.first_name, user.last_name)}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{user.full_name || `${user.first_name} ${user.last_name}`}</p>
                      <p className="text-sm text-slate-500">{user.role === 'laureat' ? 'Lauréat' : user.role === 'bureau' ? 'Bureau' : user.role === 'admin' ? 'Admin' : 'Étudiant'}</p>
                    </div>
                    <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                      {user.country_flag} {user.country_name}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {user.promotion && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Promo : {user.promotion}
                      </div>
                    )}
                    {user.specialite_intitule && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Spécialité : {user.specialite_intitule}
                      </div>
                    )}
                    {user.campus && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        Campus : {user.campus}
                      </div>
                    )}
                  </div>

                  {user.biographie && (
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                      {user.biographie.length > 140 ? `${user.biographie.slice(0, 140)}...` : user.biographie}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Utilisateurs;
