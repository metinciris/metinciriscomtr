import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface CustomNoteManagerProps {
  notes: string[];
  onChange: (notes: string[]) => void;
}

export const CustomNoteManager: React.FC<CustomNoteManagerProps> = ({
  notes,
  onChange,
}) => {
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (newNote.trim()) {
      onChange([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  const removeNote = (index: number) => {
    const updatedNotes = [...notes];
    updatedNotes.splice(index, 1);
    onChange(updatedNotes);
  };

  const moveNoteUp = (index: number) => {
    if (index > 0) {
      const updatedNotes = [...notes];
      const temp = updatedNotes[index];
      updatedNotes[index] = updatedNotes[index - 1];
      updatedNotes[index - 1] = temp;
      onChange(updatedNotes);
    }
  };

  const moveNoteDown = (index: number) => {
    if (index < notes.length - 1) {
      const updatedNotes = [...notes];
      const temp = updatedNotes[index];
      updatedNotes[index] = updatedNotes[index + 1];
      updatedNotes[index + 1] = temp;
      onChange(updatedNotes);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNote();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Yeni not ekle..."
          className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          onClick={addNote}
          className="inline-flex items-center justify-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-700 hover:bg-gray-100"
        >
          <Plus size={18} />
        </button>
      </div>

      {notes.length > 0 && (
        <ul className="bg-gray-50 rounded-md border border-gray-200 divide-y divide-gray-200">
          {notes.map((note, index) => (
            <li key={index} className="p-2 flex items-center justify-between group">
              <span className="text-sm text-gray-700">{note}</span>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveNoteUp(index)}
                  disabled={index === 0}
                  className={`text-gray-500 hover:text-gray-700 ${
                    index === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveNoteDown(index)}
                  disabled={index === notes.length - 1}
                  className={`text-gray-500 hover:text-gray-700 ${
                    index === notes.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => removeNote(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};