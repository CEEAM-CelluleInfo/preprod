import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ActivityService } from "@/services/activityService";
import { AuthService } from "@/services/authService";
import { Activity, Conference, RegistrationPayload } from "@/types/activity";
import { getRegistrationClosureReason } from "@/lib/registrationGuard";

interface FormData {
  nomComplet: string;
  email: string;
  telephone: string;
  niveauEtude: string;
}

const niveaux = [
  "Bac",
  "Bac+2",
  "Bac+3 (Licence)",
  "Bac+5 (Master)",
  "Doctorat",
  "Autre",
];

const Inscriptionactivite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = Number(searchParams.get("eventId") || "0");

  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<FormData>({
    nomComplet: "",
    email: "",
    telephone: "",
    niveauEtude: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingActivity(true);
      try {
        let resolvedEventId = eventId;
        if (!resolvedEventId || Number.isNaN(resolvedEventId)) {
          const upcoming = await ActivityService.getUpcomingEvents(1);
          resolvedEventId = upcoming[0]?.id || 0;
        }

        if (!resolvedEventId) {
          setActivity(null);
          return;
        }

        const data = await ActivityService.getActivityById(resolvedEventId);
        setActivity(data);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    bootstrap();
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;

    const hydrateUserForm = async () => {
      let currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        currentUser = await AuthService.fetchCurrentUser();
      }
      if (!currentUser || !isMounted) {
        return;
      }

      const fullName = `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim();
      setForm((prev) => ({
        ...prev,
        nomComplet: prev.nomComplet || fullName,
        email: prev.email || currentUser.email || "",
        telephone: prev.telephone || currentUser.phone || "",
      }));
    };

    void hydrateUserForm();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.nomComplet.trim()) newErrors.nomComplet = "Le nom est requis";
    if (!form.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email invalide";
    }
    if (!form.telephone.trim()) newErrors.telephone = "Le téléphone est requis";
    if (!form.niveauEtude) newErrors.niveauEtude = "Sélectionnez un niveau";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const conferences: Conference[] = useMemo(() => {
    if (activity?.conferences && activity.conferences.length > 0) {
      return activity.conferences;
    }

    if (activity?.image) {
      return [
        {
          id: 1,
          title: activity.title,
          subtitle: "Événement majeur de la tech",
          images: [activity.image],
          href: `/conference/${activity.id}-1`,
        },
      ];
    }

    return [];
  }, [activity]);

  const registrationClosureReason = useMemo(
    () => getRegistrationClosureReason(activity),
    [activity],
  );
  const isRegistrationClosed = Boolean(registrationClosureReason);

  const handleSubmit = async () => {
    if (isRegistrationClosed) {
      setSubmitMessage("");
      setSubmitError(registrationClosureReason || "Les inscriptions sont fermées pour cette activité.");
      return;
    }

    if (!validate()) {
      return;
    }

    if (!activity) {
      setSubmitError("Activité introuvable.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    try {
      const payload: RegistrationPayload = {
        nomComplet: form.nomComplet,
        email: form.email,
        telephone: form.telephone,
        niveauEtude: form.niveauEtude as RegistrationPayload["niveauEtude"],
      };

      const response = await ActivityService.registerToActivity(activity.id, payload);
      setSubmitMessage(response.message || "Inscription confirmée");
    } catch (error: any) {
      if (error?.status === 409) {
        setSubmitError("Vous êtes déjà inscrit à cette activité.");
      } else if (error?.status === 410) {
        setSubmitError("Plus de places disponibles pour cette activité.");
      } else if (error?.status === 422) {
        const backendMessage = error?.data?.message || error?.detail;
        setSubmitError(backendMessage || "Les inscriptions sont fermées pour cette activité.");
      } else if (error?.status === 400) {
        setSubmitError("Veuillez vérifier les champs du formulaire.");
      } else {
        setSubmitError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-secondary py-6">
        <h1 className="text-center text-2xl md:text-3xl font-bold text-secondary-foreground tracking-widest">
          • • {(activity?.title || "TECH CONF 2026").toUpperCase()} • •
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isLoadingActivity && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-600">
            Chargement de l'activité...
          </div>
        )}

        {!isLoadingActivity && !activity ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center space-y-4">
            <p className="text-red-600">
              Aucune activité trouvée. Revenez à la page précédente pour sélectionner un événement.
            </p>
            <button
              type="button"
              onClick={() => navigate('/activites')}
              className="px-5 py-2.5 rounded-lg border border-input bg-card text-card-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Retour aux activités
            </button>
          </div>
        ) : (
          <>
            {/* Titre */}
            <div className="bg-secondary py-6 rounded-xl">
              <h2 className="text-center text-xl md:text-2xl font-bold text-white">
                Inscription à l'activité
              </h2>
            </div>

            {/* Conférences Card */}
            {conferences.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm overflow-hidden">
                {conferences.map((conference, index) => (
                  <a
                    key={conference.id}
                    href={conference.href}
                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      index < conferences.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-md bg-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-card-foreground text-sm">{conference.title}</p>
                      <p className="text-muted-foreground text-xs">{conference.subtitle}</p>
                    </div>
                    {conference.images && conference.images.length === 1 && (
                      <img
                        src={conference.images[0]}
                        alt={conference.title}
                        className="w-28 h-20 md:w-36 md:h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    {conference.images && conference.images.length >= 2 && (
                      <div className="flex gap-2 flex-shrink-0">
                        <img
                          src={conference.images[0]}
                          alt={conference.title}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                        />
                        <img
                          src={conference.images[1]}
                          alt={conference.title}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Badge */}
            <div>
              <span className="inline-block bg-accent text-accent-foreground font-semibold text-sm px-5 py-2 rounded-full">
                {isRegistrationClosed
                  ? 'Inscriptions fermées'
                  : activity?.urgency === 'urgent'
                    ? 'Dernières places disponibles'
                    : 'Places disponibles'}
              </span>
            </div>

            {/* Description */}
            <div className="bg-orange-50 rounded-xl shadow-sm p-5">
              <p className="text-gray-700 text-sm leading-relaxed text-justify">
                {activity?.longDescription || activity?.description || "Description non disponible."}
              </p>
            </div>

            {/* Formulaire */}
            <div className="bg-card rounded-xl shadow-sm p-5 space-y-5">
              <h3 className="text-center text-lg md:text-xl font-bold text-card-foreground">
                S'inscrire rapidement ici
              </h3>

              <Field
                label="Nom complet"
                value={form.nomComplet}
                onChange={(v) => handleChange("nomComplet", v)}
                placeholder="Votre nom complet s'il vous plaît..."
                error={errors.nomComplet}
              />

              <Field
                label="Votre email"
                type="email"
                value={form.email}
                onChange={(v) => handleChange("email", v)}
                placeholder="Votre@gmail.com s'il vous plaît..."
                error={errors.email}
              />

              <Field
                label="Votre Téléphone"
                type="tel"
                value={form.telephone}
                onChange={(v) => handleChange("telephone", v)}
                placeholder="Votre Téléphone s'il vous plaît..."
                error={errors.telephone}
              />

              {/* Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Votre Niveau d'Etude
                </label>
                <select
                  value={form.niveauEtude}
                  onChange={(e) => handleChange("niveauEtude", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 [&>option:not(:first-child)]:text-gray-700"
                >
                  <option value="">Choisissez votre niveau d'étude</option>
                  {niveaux.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {errors.niveauEtude && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.niveauEtude}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-5 py-2.5 rounded-lg border border-input bg-card text-card-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Page précédente
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !activity || isRegistrationClosed}
                  className="px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Inscription..."
                    : isRegistrationClosed
                      ? 'Inscriptions fermées'
                      : "Confirmez l'inscription"}
                </button>
              </div>

              {isRegistrationClosed && registrationClosureReason && (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm">
                  {registrationClosureReason}
                </p>
              )}

              {submitMessage && (
                <p className="text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
                  {submitMessage}
                </p>
              )}

              {submitError && (
                <p className="text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm">
                  {submitError}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* Reusable field */
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: FieldProps) => (
  <div>
    <label className="block text-sm font-medium text-card-foreground mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
    {error && <p className="text-destructive text-xs mt-1">{error}</p>}
  </div>
);

export default Inscriptionactivite;
