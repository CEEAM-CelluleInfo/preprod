import React from 'react';
import { SubjectItem } from '@/services/classroomService';

interface Props {
  subjects: SubjectItem[];
  selected: SubjectItem | null;
  onSelect: (s: SubjectItem) => void;
}

const SubjectSelector: React.FC<Props> = ({ subjects, selected, onSelect }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Matière</label>
      <select
        value={selected?.id || ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          const s = subjects.find((x) => x.id === id);
          if (s) onSelect(s);
        }}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>
    </div>
  );
};

export default SubjectSelector;
