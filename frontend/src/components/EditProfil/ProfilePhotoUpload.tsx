import { Camera, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ProfileService } from "@/services/profileService";
import { AuthService } from "@/services/authService";
import { getAbsoluteMediaUrl } from "@/lib/utils";

const ProfilePhotoUpload = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la photo existante au montage
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser?.avatar_url) {
      setPhoto(getAbsoluteMediaUrl(currentUser.avatar_url));
    }
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation côté client
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Format non supporté. Utilisez JPG ou PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux. Max 5 MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload vers l'API
      const result = await ProfileService.uploadProfilePhoto(file);
      setPhoto(result.photoUrl);
      
      // Mettre à jour le cache utilisateur
      AuthService.updateStoredUser({ avatar_url: result.photoUrl });
    } catch (err: any) {
      console.error('Erreur upload photo:', err);
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!photo) return;
    
    setIsUploading(true);
    setError(null);

    try {
      await ProfileService.deleteProfilePhoto();
      setPhoto(null);
      
      // Mettre à jour le cache utilisateur
      AuthService.updateStoredUser({ avatar_url: '' });
    } catch (err: any) {
      console.error('Erreur suppression photo:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Changer la photo</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Photo preview */}
        <div className="relative">
          <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            ) : photo ? (
              <img src={photo} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-12 w-12 text-gray-400" />
            )}
          </div>
          {photo && !isUploading && (
            <button
              type="button"
              onClick={handleDeletePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Upload area */}
        <div className="flex-1">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="photo-upload"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={isUploading}
              />
              <label htmlFor="photo-upload" className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {isUploading ? 'Upload en cours...' : 'Cliquez pour télécharger ou glissez-déposez'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Format recommandé : JPG, PNG (max 5MB)
                </p>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUpload;