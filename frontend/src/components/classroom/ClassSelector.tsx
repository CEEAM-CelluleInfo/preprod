import React from 'react';
import { ClassroomItem } from '@/services/classroomService';

interface Props {
  classrooms: ClassroomItem[];
  selected: ClassroomItem | null;
  onSelect: (c: ClassroomItem) => void;
}

const ClassSelector: React.FC<Props> = ({ classrooms, selected, onSelect }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Classe</label>
      <select
        value={selected?.id || ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          const c = classrooms.find((x) => x.id === id);
          if (c) onSelect(c);
        }}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      >
        {classrooms.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
};

export default ClassSelector;
