import React from 'react';
import { useNavigate } from "react-router-dom";
import { 
  Home,
  Search,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from 'lucide-react';

const NotFound = () => {
   const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            {/* Animation 404 */}
            <div className="relative inline-block mb-8">
              <div className="text-[180px] md:text-[250px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 leading-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertCircle className="w-32 h-32 text-orange-500 animate-pulse" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Page introuvable
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Oups ! La page que vous recherchez semble s'être perdue dans les méandres du campus.
            </p>
            <p className="text-lg text-gray-500 mb-12">
              Elle a peut-être déménagé, été supprimée ou n'a jamais existé.
            </p>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
               onClick={() => navigate('/')}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Home className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </a>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-bold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Page précédente
              </button>
            </div>
          </div>

          {/* Suggestions de navigation */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-12">
            <div className="flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                Que cherchez-vous ?
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Accueil', desc: 'Retour à la page principale', icon: Home, link: '/' },
                { title: 'École', desc: 'Informations pratiques', icon: MapPin, link: '/ecole' },
                { title: 'Activités', desc: 'Nos événements', icon: AlertCircle, link: '/activites' },
                { title: 'Lauréats', desc: 'Annuaire des anciens', icon: Search, link: '/laureats' },
                { title: 'À propos', desc: 'Notre mission', icon: Mail, link: '/a-propos' },
                { title: 'Contact', desc: 'Nous écrire', icon: Phone, link: '/contact' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <a
                    key={index}
                    href={item.link}
                    className="flex items-start p-4 rounded-lg border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group"
                  >
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Aide supplémentaire */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Vous avez toujours besoin d'aide ?
            </p>
            <a
              href="mailto:ceeam.meknes@gmail.com"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contactez-nous à ceeam.meknes@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;