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

  // Classroom form
  const [showClassroomForm, setShowClassroomForm] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState<number | null>(null);
  const [classroomForm, setClassroomForm] = useState({ name: '', code: '', description: '', is_active: true });

  const openClassroomForm = (classroom: ClassroomItem | null) => {
    if (classroom) {
      setEditingClassroomId(classroom.id);
      setClassroomForm({ name: classroom.name, code: classroom.code || '', description: classroom.description || '', is_active: classroom.is_active });
    } else {
      setEditingClassroomId(null);
      setClassroomForm({ name: '', code: '', description: '', is_active: true });
    }
    setShowClassroomForm(true);
  };

  const handleSaveClassroom = async () => {
    if (!classroomForm.name.trim()) return;
    try {
      if (editingClassroomId !== null) {
        await ClassroomService.updateClassroom(editingClassroomId, classroomForm);
      } else {
        await ClassroomService.createClassroom(classroomForm);
      }
      const data = await ClassroomService.getClassrooms();
      setClassrooms(data);
      if (editingClassroomId !== null) {
        const updated = data.find((c) => c.id === editingClassroomId);
        if (updated) setSelectedClass(updated);
      } else {
        setSelectedClass(data[data.length - 1] || null);
      }
      setShowClassroomForm(false);
    } catch (err) {
      console.error('Erreur sauvegarde classe', err);
    }
  };

  const handleDeleteClassroom = async (id: number) => {
    if (!confirm('Supprimer cette classe et toutes ses matières / ressources ?')) return;
    try {
      await ClassroomService.deleteClassroom(id);
      const data = await ClassroomService.getClassrooms();
      setClassrooms(data);
      setSelectedClass(data[0] || null);
    } catch (err) {
      console.error('Erreur suppression classe', err);
    }
  };

  // Creation states
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');

  const roleLower = (currentUser?.role || '').toLowerCase();
  const canManage = !!(currentUser && (currentUser.is_staff || currentUser.is_superuser || ['admin', 'bureau', 'adminpromo', 'admin_promo'].includes(roleLower)));

  const handleCreateSubject = async () => {
    if (!selectedClass || !newSubjectName) return;
    try {
      const created = await ClassroomService.createSubject(selectedClass.id, { title: newSubjectName, description: newSubjectDescription });
      const s = await ClassroomService.getSubjects(selectedClass.id);
      setSubjects(s);
      // select the newly created subject if present
      if (created && (created as any).id) {
        const found = s.find((x) => x.id === (created as any).id);
        if (found) setSelectedSubject(found);
      }
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

  const handleDeleteResource = async (resourceId: number) => {
    if (!selectedClass || !selectedSubject) return;
    if (!confirm('Supprimer cette ressource ?')) return;
    try {
      await ClassroomService.deleteResource(selectedClass.id, selectedSubject.id, resourceId);
      const r = await ClassroomService.getResources(selectedClass.id, selectedSubject.id);
      setResources(r);
    } catch (err) {
      console.error('Erreur suppression ressource', err);
    }
  };

  const handleUpdateResource = async (resourceId: number, payload: Partial<ResourceItem>) => {
    if (!selectedClass || !selectedSubject) return;
    try {
      await ClassroomService.updateResource(selectedClass.id, selectedSubject.id, resourceId, payload);
      const r = await ClassroomService.getResources(selectedClass.id, selectedSubject.id);
      setResources(r);
    } catch (err) {
      console.error('Erreur mise à jour ressource', err);
      throw err;
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

              {canManage && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    onClick={() => openClassroomForm(null)}
                  >
                    + Nouvelle classe
                  </button>
                  {selectedClass && (
                    <>
                      <button
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                        onClick={() => openClassroomForm(selectedClass)}
                      >
                        Modifier
                      </button>
                      <button
                        className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                        onClick={() => handleDeleteClassroom(selectedClass.id)}
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              )}

              {showClassroomForm && (
                <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-200">
                  <h3 className="font-semibold text-sm mb-2">
                    {editingClassroomId !== null ? 'Modifier la classe' : 'Nouvelle classe'}
                  </h3>
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Nom de la classe *"
                    value={classroomForm.name}
                    onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                  />
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Code (ex: L3-INFO)"
                    value={classroomForm.code}
                    onChange={(e) => setClassroomForm({ ...classroomForm, code: e.target.value })}
                  />
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Description (optionnelle)"
                    value={classroomForm.description}
                    onChange={(e) => setClassroomForm({ ...classroomForm, description: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm mb-3">
                    <input
                      type="checkbox"
                      checked={classroomForm.is_active}
                      onChange={(e) => setClassroomForm({ ...classroomForm, is_active: e.target.checked })}
                    />
                    Classe active
                  </label>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      onClick={handleSaveClassroom}
                    >
                      Enregistrer
                    </button>
                    <button
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                      onClick={() => setShowClassroomForm(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
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
                onDelete={canManage ? handleDeleteResource : undefined}
                onEditSave={canManage ? handleUpdateResource : undefined}
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
