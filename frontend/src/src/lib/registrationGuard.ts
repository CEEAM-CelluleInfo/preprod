import { Activity } from '@/types/activity';

const toValidDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getRegistrationClosureReason = (activity: Activity | null): string | null => {
  if (!activity) {
    return null;
  }

  const now = new Date();

  const registrationDeadline = toValidDate(
    activity.registration_deadline || activity.registrationDeadline,
  );
  if (registrationDeadline && now > registrationDeadline) {
    return "Date limite d'inscription dépassée.";
  }

  const eventDate = toValidDate(activity.event_date);
  if (eventDate && now > eventDate) {
    return 'La date de cette activité est déjà passée.';
  }

  const maxParticipants = activity.max_participants ?? activity.maxParticipants;
  const currentParticipants =
    activity.registrations_count ?? activity.currentParticipants ?? activity.participants ?? 0;

  if (typeof maxParticipants === 'number' && maxParticipants > 0 && currentParticipants >= maxParticipants) {
    return 'Cette activité est complète.';
  }

  return null;
};
