"""Script pour ajouter tous les pays africains à la base de données."""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from api.models import Country

# Liste des 55 pays africains avec codes ISO et emojis
pays_africains = [
    ("Afrique du Sud", "ZAF", "🇿🇦"),
    ("Algérie", "DZA", "🇩🇿"),
    ("Angola", "AGO", "🇦🇴"),
    ("Bénin", "BEN", "🇧🇯"),
    ("Botswana", "BWA", "🇧🇼"),
    ("Burkina Faso", "BFA", "🇧🇫"),
    ("Burundi", "BDI", "🇧🇮"),
    ("Cameroun", "CMR", "🇨🇲"),
    ("Cap-Vert", "CPV", "🇨🇻"),
    ("Centrafrique", "CAF", "🇨🇫"),
    ("Comores", "COM", "🇰🇲"),
    ("Congo", "COG", "🇨🇬"),
    ("RD Congo", "COD", "🇨🇩"),
    ("Côte d'Ivoire", "CIV", "🇨🇮"),
    ("Djibouti", "DJI", "🇩🇯"),
    ("Égypte", "EGY", "🇪🇬"),
    ("Érythrée", "ERI", "🇪🇷"),
    ("Eswatini", "SWZ", "🇸🇿"),
    ("Éthiopie", "ETH", "🇪🇹"),
    ("Gabon", "GAB", "🇬🇦"),
    ("Gambie", "GMB", "🇬🇲"),
    ("Ghana", "GHA", "🇬🇭"),
    ("Guinée", "GIN", "🇬🇳"),
    ("Guinée-Bissau", "GNB", "🇬🇼"),
    ("Guinée équatoriale", "GNQ", "🇬🇶"),
    ("Kenya", "KEN", "🇰🇪"),
    ("Lesotho", "LSO", "🇱🇸"),
    ("Liberia", "LBR", "🇱🇷"),
    ("Libye", "LBY", "🇱🇾"),
    ("Madagascar", "MDG", "🇲🇬"),
    ("Malawi", "MWI", "🇲🇼"),
    ("Mali", "MLI", "🇲🇱"),
    ("Maroc", "MAR", "🇲🇦"),
    ("Maurice", "MUS", "🇲🇺"),
    ("Mauritanie", "MRT", "🇲🇷"),
    ("Mozambique", "MOZ", "🇲🇿"),
    ("Namibie", "NAM", "🇳🇦"),
    ("Niger", "NER", "🇳🇪"),
    ("Nigeria", "NGA", "🇳🇬"),
    ("Ouganda", "UGA", "🇺🇬"),
    ("Rwanda", "RWA", "🇷🇼"),
    ("Sao Tomé-et-Principe", "STP", "🇸🇹"),
    ("Sénégal", "SEN", "🇸🇳"),
    ("Seychelles", "SYC", "🇸🇨"),
    ("Sierra Leone", "SLE", "🇸🇱"),
    ("Somalie", "SOM", "🇸🇴"),
    ("Soudan", "SDN", "🇸🇩"),
    ("Soudan du Sud", "SSD", "🇸🇸"),
    ("Tanzanie", "TZA", "🇹🇿"),
    ("Tchad", "TCD", "🇹🇩"),
    ("Togo", "TGO", "🇹🇬"),
    ("Tunisie", "TUN", "🇹🇳"),
    ("Zambie", "ZMB", "🇿🇲"),
    ("Zimbabwe", "ZWE", "🇿🇼"),
]

def main():
    created = 0
    updated = 0
    
    for name, code, flag in pays_africains:
        obj, is_new = Country.objects.update_or_create(
            code_iso=code,
            defaults={
                'name': name,
                'flag_emoji': flag,
                'continent': 'Afrique',
                'is_active': True
            }
        )
        if is_new:
            created += 1
            print(f"  ✓ Créé: {name} ({code})")
        else:
            updated += 1
            print(f"  ~ Mis à jour: {name} ({code})")
    
    print(f"\n{'='*50}")
    print(f"Pays créés: {created}")
    print(f"Pays mis à jour: {updated}")
    print(f"Total pays en base: {Country.objects.count()}")

if __name__ == "__main__":
    main()
