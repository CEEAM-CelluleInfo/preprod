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

  // Protection route: only authenticated users
  const currentUser = AuthService.getCurrentUser();
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
            </div>

            <div className="col-span-full md:col-span-3">
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
