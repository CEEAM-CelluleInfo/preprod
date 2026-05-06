from django.db import migrations


COUNTRIES = [
    ("Afrique du Sud", "ZAF", "🇿🇦", "Afrique"),
    ("Algérie", "DZA", "🇩🇿", "Afrique"),
    ("Angola", "AGO", "🇦🇴", "Afrique"),
    ("Bénin", "BEN", "🇧🇯", "Afrique"),
    ("Botswana", "BWA", "🇧🇼", "Afrique"),
    ("Burkina Faso", "BFA", "🇧🇫", "Afrique"),
    ("Burundi", "BDI", "🇧🇮", "Afrique"),
    ("Cameroun", "CMR", "🇨🇲", "Afrique"),
    ("Cap-Vert", "CPV", "🇨🇻", "Afrique"),
    ("Centrafrique", "CAF", "🇨🇫", "Afrique"),
    ("Comores", "COM", "🇰🇲", "Afrique"),
    ("Congo", "COG", "🇨🇬", "Afrique"),
    ("RD Congo", "COD", "🇨🇩", "Afrique"),
    ("Côte d'Ivoire", "CIV", "🇨🇮", "Afrique"),
    ("Djibouti", "DJI", "🇩🇯", "Afrique"),
    ("Égypte", "EGY", "🇪🇬", "Afrique"),
    ("Érythrée", "ERI", "🇪🇷", "Afrique"),
    ("Eswatini", "SWZ", "🇸🇿", "Afrique"),
    ("Éthiopie", "ETH", "🇪🇹", "Afrique"),
    ("Gabon", "GAB", "🇬🇦", "Afrique"),
    ("Gambie", "GMB", "🇬🇲", "Afrique"),
    ("Ghana", "GHA", "🇬🇭", "Afrique"),
    ("Guinée", "GIN", "🇬🇳", "Afrique"),
    ("Guinée-Bissau", "GNB", "🇬🇼", "Afrique"),
    ("Guinée équatoriale", "GNQ", "🇬🇶", "Afrique"),
    ("Kenya", "KEN", "🇰🇪", "Afrique"),
    ("Lesotho", "LSO", "🇱🇸", "Afrique"),
    ("Liberia", "LBR", "🇱🇷", "Afrique"),
    ("Libye", "LBY", "🇱🇾", "Afrique"),
    ("Madagascar", "MDG", "🇲🇬", "Afrique"),
    ("Malawi", "MWI", "🇲🇼", "Afrique"),
    ("Mali", "MLI", "🇲🇱", "Afrique"),
    ("Maroc", "MAR", "🇲🇦", "Afrique"),
    ("Maurice", "MUS", "🇲🇺", "Afrique"),
    ("Mauritanie", "MRT", "🇲🇷", "Afrique"),
    ("Mozambique", "MOZ", "🇲🇿", "Afrique"),
    ("Namibie", "NAM", "🇳🇦", "Afrique"),
    ("Niger", "NER", "🇳🇪", "Afrique"),
    ("Nigeria", "NGA", "🇳🇬", "Afrique"),
    ("Ouganda", "UGA", "🇺🇬", "Afrique"),
    ("Rwanda", "RWA", "🇷🇼", "Afrique"),
    ("Sao Tomé-et-Principe", "STP", "🇸🇹", "Afrique"),
    ("Sénégal", "SEN", "🇸🇳", "Afrique"),
    ("Seychelles", "SYC", "🇸🇨", "Afrique"),
    ("Sierra Leone", "SLE", "🇸🇱", "Afrique"),
    ("Somalie", "SOM", "🇸🇴", "Afrique"),
    ("Soudan", "SDN", "🇸🇩", "Afrique"),
    ("Soudan du Sud", "SSD", "🇸🇸", "Afrique"),
    ("Tanzanie", "TZA", "🇹🇿", "Afrique"),
    ("Tchad", "TCD", "🇹🇩", "Afrique"),
    ("Togo", "TGO", "🇹🇬", "Afrique"),
    ("Tunisie", "TUN", "🇹🇳", "Afrique"),
    ("Zambie", "ZMB", "🇿🇲", "Afrique"),
    ("Zimbabwe", "ZWE", "🇿🇼", "Afrique"),
]


def seed_countries(apps, schema_editor):
    Country = apps.get_model("api", "Country")

    for name, code_iso, flag_emoji, continent in COUNTRIES:
        Country.objects.update_or_create(
            code_iso=code_iso,
            defaults={
                "name": name,
                "flag_emoji": flag_emoji,
                "continent": continent,
                "is_active": True,
            },
        )


def unseed_countries(apps, schema_editor):
    Country = apps.get_model("api", "Country")
    iso_codes = [code_iso for _, code_iso, _, _ in COUNTRIES]
    Country.objects.filter(code_iso__in=iso_codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0018_alter_laureatjoinrequest_options"),
    ]

    operations = [
        migrations.RunPython(seed_countries, unseed_countries),
    ]