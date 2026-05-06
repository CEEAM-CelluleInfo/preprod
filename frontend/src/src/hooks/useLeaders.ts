import { useState, useEffect } from 'react';
import { LeadersService } from '@/services/leadersService';
import { Leader, LeadersResponse } from '@/types/leader';

export const useLeaders = (initialPage: number = 0, itemsPerPage: number = 6) => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: initialPage,
    total: 0,
    totalPages: 0,
    itemsPerPage
  });

  const fetchLeaders = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await LeadersService.getLeaders(page, itemsPerPage);
      
      setLeaders(data.leaders);
      setPagination({
        page: data.page,
        total: data.total,
        totalPages: data.totalPages,
        itemsPerPage
      });
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changePage = (page: number) => {
    if (page >= 0 && page < pagination.totalPages) {
      fetchLeaders(page);
    }
  };

  useEffect(() => {
    fetchLeaders(initialPage);
  }, [initialPage]);

  return {
    leaders,
    loading,
    error,
    pagination,
    changePage,
    refresh: () => fetchLeaders(pagination.page)
  };
};