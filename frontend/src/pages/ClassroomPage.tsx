import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/HeaderConnected';
import Footer from '@/components/layout/Footer';
import { ClassroomService, ClassroomItem, SubjectItem, ResourceItem } from '@/services/classroomService';
import ClassSelector from '@/components/classroom/ClassSelector';
import SubjectSelector from '@/components/classroom/SubjectSelector';
import ResourcesTable from '@/components/classroom/ResourcesTable';
import ResourcePreviewModal from '@/components/classroom/ResourcePreviewModal';
import { AuthService } from '@/services/authService';
import { Navigate } from 'react-router-dom';

const ClassroomPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassroomItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Current user (route protection & management checks)
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ClassroomService.getClassrooms();
        setClassrooms(data);
        if (data.length > 0) setSelectedClass(data[0]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const loadSubjects = async () => {
      const s = await ClassroomService.getSubjects(selectedClass.id);
      setSubjects(s);
      setSelectedSubject(s[0] || null);
    };
    loadSubjects();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;
    const loadResources = async () => {
      const r = await ClassroomService.getResources(selectedClass.id, selectedSubject.id);
      setResources(r);
    };
    loadResources();
  }, [selectedClass, selectedSubject]);

  const openPreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  // Creation states
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');

  const canManage = !!(currentUser && (currentUser.is_staff || currentUser.is_superuser || ['admin', 'bureau'].includes(currentUser.role)));

  const handleCreateSubject = async () => {
    if (!selectedClass || !newSubjectName) return;
    try {
      await ClassroomService.createSubject(selectedClass.id, { name: newSubjectName, description: newSubjectDescription });
      const s = await ClassroomService.getSubjects(selectedClass.id);
      setSubjects(s);
      setNewSubjectName('');
      setNewSubjectDescription('');
    } catch (err) {
      console.error('Erreur création matière', err);
    }
  };

  const handleCreateResource = async () => {
    if (!selectedClass || !selectedSubject || !newResourceTitle || !newResourceUrl) return;
    try {
      await ClassroomService.createResource(selectedClass.id, selectedSubject.id, {
        title: newResourceTitle,
        url: newResourceUrl,
        description: newResourceDescription,
      });
      const r = await ClassroomService.getResources(selectedClass.id, selectedSubject.id);
      setResources(r);
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceDescription('');
      setShowResourceForm(false);
    } catch (err) {
      console.error('Erreur création ressource', err);
    }
  };

  // Protection route: only authenticated users
  if (!currentUser) return <Navigate to="/connexion" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="bg-white rounded-lg p-6 shadow">
          <h1 className="text-2xl font-bold mb-4">Classroom</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <ClassSelector
                classrooms={classrooms}
                selected={selectedClass}
                onSelect={(c) => setSelectedClass(c)}
              />
            </div>

            <div>
              <SubjectSelector
                subjects={subjects}
                selected={selectedSubject}
                onSelect={(s) => setSelectedSubject(s)}
              />
              {canManage && selectedClass && (
                <div className="mt-4 bg-gray-50 p-3 rounded">
                  <h3 className="font-semibold">Ajouter une matière</h3>
                  <input
                    className="w-full mt-2 p-2 border rounded"
                    placeholder="Nom de la matière"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                  <input
                    className="w-full mt-2 p-2 border rounded"
                    placeholder="Description (optionnelle)"
                    value={newSubjectDescription}
                    onChange={(e) => setNewSubjectDescription(e.target.value)}
                  />
                  <button
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={handleCreateSubject}
                  >
                    Créer
                  </button>
                </div>
              )}
            </div>

            <div className="col-span-full md:col-span-3">
              {canManage && selectedClass && selectedSubject && (
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded mr-2"
                      onClick={() => setShowResourceForm(!showResourceForm)}
                    >
                      {showResourceForm ? 'Annuler' : 'Ajouter une ressource'}
                    </button>
                  </div>
                </div>
              )}

              {showResourceForm && selectedClass && selectedSubject && (
                <div className="mb-4 bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Nouvelle ressource pour {selectedSubject.name}</h3>
                  <input
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="Titre"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                  />
                  <input
                    className="w-full mt-2 p-2 border rounded"
                    placeholder="URL (Drive, Docs, Dropbox...)"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                  />
                  <input
                    className="w-full mt-2 p-2 border rounded"
                    placeholder="Description (optionnelle)"
                    value={newResourceDescription}
                    onChange={(e) => setNewResourceDescription(e.target.value)}
                  />
                  <div className="mt-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCreateResource}>
                      Créer la ressource
                    </button>
                  </div>
                </div>
              )}
              <ResourcesTable
                resources={resources}
                onPreview={openPreview}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ResourcePreviewModal
        isOpen={isPreviewOpen}
        url={previewUrl}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};

export default ClassroomPage;
