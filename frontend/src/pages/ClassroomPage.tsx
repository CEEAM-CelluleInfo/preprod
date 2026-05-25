import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/HeaderConnected';
import Footer from '@/components/layout/Footer';
import { ClassroomService, ClassroomItem, SemesterItem, SubjectItem, ResourceItem } from '@/services/classroomService';
import ClassSelector from '@/components/classroom/ClassSelector';
import SubjectSelector from '@/components/classroom/SubjectSelector';
import ResourcesTable from '@/components/classroom/ResourcesTable';
import ResourcePreviewModal from '@/components/classroom/ResourcePreviewModal';
import { AuthService } from '@/services/authService';
import { Navigate } from 'react-router-dom';

const ClassroomPage: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();

  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassroomItem | null>(null);

  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<SemesterItem | null>(null);

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

  const [resources, setResources] = useState<ResourceItem[]>([]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const roleLower = (currentUser?.role || '').toLowerCase();
  const canManage = !!(currentUser && (currentUser.is_staff || ['admin', 'bureau', 'adminpromo', 'admin_promo'].includes(roleLower)));

  // --- Classroom form ---
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
    if (!confirm('Supprimer cette classe et tout son contenu (semestres, matières, ressources) ?')) return;
    try {
      await ClassroomService.deleteClassroom(id);
      const data = await ClassroomService.getClassrooms();
      setClassrooms(data);
      setSelectedClass(data[0] || null);
    } catch (err) {
      console.error('Erreur suppression classe', err);
    }
  };

  // --- Subject form ---
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');

  const handleCreateSubject = async () => {
    if (!selectedClass || !selectedSemester || !newSubjectName) return;
    try {
      const created: any = await ClassroomService.createSubject(selectedClass.id, selectedSemester.id, {
        title: newSubjectName,
        description: newSubjectDescription,
      });
      const s = await ClassroomService.getSubjects(selectedClass.id, selectedSemester.id);
      setSubjects(s);
      if (created?.id) {
        const found = s.find((x) => x.id === created.id);
        if (found) setSelectedSubject(found);
      }
      setNewSubjectName('');
      setNewSubjectDescription('');
    } catch (err) {
      console.error('Erreur création matière', err);
    }
  };

  // --- Resource form ---
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceCategory, setNewResourceCategory] = useState<ResourceItem['category']>('cours');

  const handleCreateResource = async () => {
    if (!selectedClass || !selectedSemester || !selectedSubject || !newResourceTitle || !newResourceUrl) return;
    try {
      await ClassroomService.createResource(selectedClass.id, selectedSemester.id, selectedSubject.id, {
        title: newResourceTitle,
        url: newResourceUrl,
        description: newResourceDescription,
        category: newResourceCategory,
      });
      const r = await ClassroomService.getResources(selectedClass.id, selectedSemester.id, selectedSubject.id);
      setResources(r);
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceDescription('');
      setNewResourceCategory('cours');
      setShowResourceForm(false);
    } catch (err) {
      console.error('Erreur création ressource', err);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!selectedClass || !selectedSemester || !selectedSubject) return;
    if (!confirm('Supprimer cette ressource ?')) return;
    try {
      await ClassroomService.deleteResource(selectedClass.id, selectedSemester.id, selectedSubject.id, resourceId);
      const r = await ClassroomService.getResources(selectedClass.id, selectedSemester.id, selectedSubject.id);
      setResources(r);
    } catch (err) {
      console.error('Erreur suppression ressource', err);
    }
  };

  const handleUpdateResource = async (resourceId: number, payload: Partial<ResourceItem>) => {
    if (!selectedClass || !selectedSemester || !selectedSubject) return;
    try {
      await ClassroomService.updateResource(selectedClass.id, selectedSemester.id, selectedSubject.id, resourceId, payload);
      const r = await ClassroomService.getResources(selectedClass.id, selectedSemester.id, selectedSubject.id);
      setResources(r);
    } catch (err) {
      console.error('Erreur mise à jour ressource', err);
      throw err;
    }
  };

  // --- Data loading chain ---
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
    if (!selectedClass) { setSemesters([]); setSelectedSemester(null); return; }
    ClassroomService.getSemesters(selectedClass.id).then((s) => {
      setSemesters(s);
      setSelectedSemester(s.find((x) => x.number === 1) || s[0] || null);
    });
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedSemester) { setSubjects([]); setSelectedSubject(null); return; }
    ClassroomService.getSubjects(selectedClass.id, selectedSemester.id).then((s) => {
      setSubjects(s);
      setSelectedSubject(s[0] || null);
    });
  }, [selectedClass, selectedSemester]);

  useEffect(() => {
    if (!selectedClass || !selectedSemester || !selectedSubject) { setResources([]); return; }
    ClassroomService.getResources(selectedClass.id, selectedSemester.id, selectedSubject.id).then(setResources);
  }, [selectedClass, selectedSemester, selectedSubject]);

  if (!currentUser) return <Navigate to="/connexion" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="bg-white rounded-lg p-6 shadow">
          <h1 className="text-2xl font-bold mb-6">Classroom</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* === Colonne 1 : Classe + Semestre === */}
            <div>
              <ClassSelector
                classrooms={classrooms}
                selected={selectedClass}
                onSelect={(c) => setSelectedClass(c)}
              />

              {/* Sélection semestre */}
              {selectedClass && semesters.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Semestre</p>
                  <div className="flex gap-2">
                    {semesters.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSemester(s)}
                        className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          selectedSemester?.id === s.id
                            ? 'bg-[#172d45] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        S{s.number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gestion des classes (admins) */}
              {canManage && (
                <div className="mt-4 flex flex-wrap gap-2">
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

            {/* === Colonne 2 : Matières === */}
            <div>
              <SubjectSelector
                subjects={subjects}
                selected={selectedSubject}
                onSelect={(s) => setSelectedSubject(s)}
              />

              {canManage && selectedClass && selectedSemester && (
                <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
                  <h3 className="font-semibold text-sm mb-2">Ajouter une matière</h3>
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Nom de la matière *"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Description (optionnelle)"
                    value={newSubjectDescription}
                    onChange={(e) => setNewSubjectDescription(e.target.value)}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    onClick={handleCreateSubject}
                  >
                    Créer
                  </button>
                </div>
              )}
            </div>

            {/* === Colonne 3 : Ressources === */}
            <div className="md:col-span-1">
              {canManage && selectedClass && selectedSemester && selectedSubject && (
                <div className="mb-3">
                  <button
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    onClick={() => setShowResourceForm(!showResourceForm)}
                  >
                    {showResourceForm ? 'Annuler' : '+ Ajouter une ressource'}
                  </button>
                </div>
              )}

              {showResourceForm && selectedSubject && (
                <div className="mb-4 bg-gray-50 p-4 rounded border border-gray-200">
                  <h3 className="font-semibold text-sm mb-2">Nouvelle ressource — {selectedSubject.title}</h3>
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Titre *"
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="URL (Drive, Docs, Dropbox...) *"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Description (optionnelle)"
                    value={newResourceDescription}
                    onChange={(e) => setNewResourceDescription(e.target.value)}
                  />
                  <select
                    className="w-full p-2 border rounded text-sm mb-3"
                    value={newResourceCategory}
                    onChange={(e) => setNewResourceCategory(e.target.value as ResourceItem['category'])}
                  >
                    <option value="cours">Cours</option>
                    <option value="td">TD</option>
                    <option value="tp">TP</option>
                    <option value="examen">Examen</option>
                  </select>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    onClick={handleCreateResource}
                  >
                    Créer la ressource
                  </button>
                </div>
              )}

              <ResourcesTable
                resources={resources}
                onPreview={(url) => { setPreviewUrl(url); setIsPreviewOpen(true); }}
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
