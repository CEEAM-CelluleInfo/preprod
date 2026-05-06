import { useState, useEffect } from 'react';
import { ContentService } from '@/services/contentService';
import { ContentSection } from '@/types/content';

export const useContent = (sectionId?: string) => {
  const [content, setContent] = useState<ContentSection | null>(null);
  const [allContent, setAllContent] = useState<Record<string, ContentSection>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      if (sectionId) {
        const data = await ContentService.getSection(sectionId);
        setContent(data);
      } else {
        const data = await ContentService.getAllSections();
        setAllContent(data);
      }
    } catch (err) {
      setError('Erreur lors du chargement du contenu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [sectionId]);

  return {
    content,
    allContent,
    loading,
    error,
    refresh: fetchContent
  };
};