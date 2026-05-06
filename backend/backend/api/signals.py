from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, LaureatProfile, Activity, Announcement
from .notifications import notify_new_activity_published, notify_new_announcement

@receiver(post_save, sender=User)
def create_laureat_profile(sender, instance, created, **kwargs):
    # Si l'utilisateur est nouveau ou si son rôle change vers "laureat"
    if instance.role == "laureat":
        LaureatProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=Activity)
def notify_on_new_activity(sender, instance, created, **kwargs):
    if created and instance.is_published:
        notify_new_activity_published(instance)


@receiver(post_save, sender=Announcement)
def notify_on_new_announcement(sender, instance, created, **kwargs):
    if created and instance.is_published:
        notify_new_announcement(instance)
