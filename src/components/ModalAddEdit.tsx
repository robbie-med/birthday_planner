/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Person, PersonType } from '../types';
import { X } from 'lucide-react';

interface ModalAddEditProps {
  person: Person | null; // null means we are adding a new person
  onSave: (data: Omit<Person, 'id' | 'gift_history'> & { id?: string }) => void;
  onClose: () => void;
}

const PERSON_TYPES: PersonType[] = [
  'spouse',
  'parent',
  'sibling',
  'in-law',
  'close-friend',
  'colleague',
  'other'
];

export default function ModalAddEdit({ person, onSave, onClose }: ModalAddEditProps) {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [type, setType] = useState<PersonType>('spouse');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (person) {
      setName(person.name);
      setBirthday(person.birthday);
      setBirthYear(person.birth_year ? String(person.birth_year) : '');
      setType(person.type);
      setNotes(person.notes || '');
    } else {
      setName('');
      setBirthday('');
      setBirthYear('');
      setType('spouse');
      setNotes('');
    }
    setError('');
  }, [person]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      setError('Error: Name is required.');
      return;
    }

    // Birthday validation MM-DD
    const bdayRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!bdayRegex.test(birthday)) {
      setError('Error: Birthday must be formatted as MM-DD (e.g., 06-15).');
      return;
    }

    // Verify valid calendar date (e.g. not Feb 30)
    const [mStr, dStr] = birthday.split('-');
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    const dummyYear = 2024; // leap year to allow Feb 29
    const testDate = new Date(dummyYear, m - 1, d);
    if (testDate.getMonth() !== m - 1 || testDate.getDate() !== d) {
      setError('Error: Birthday is not a valid date on the calendar.');
      return;
    }

    let parsedBirthYear: number | null = null;
    if (birthYear.trim()) {
      const yr = parseInt(birthYear, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yr) || yr < 1800 || yr > currentYear) {
        setError(`Error: Birth Year must be an integer between 1800 and ${currentYear}.`);
        return;
      }
      parsedBirthYear = yr;
    }

    onSave({
      name: name.trim(),
      birthday,
      birth_year: parsedBirthYear,
      type,
      notes: notes.trim()
    });
  };

  // Keyboard support inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
      <div 
        className="w-full max-w-lg bg-[#0c0f12] border-2 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.3)] text-gray-200"
        id="modal-add-edit-container"
      >
        {/* Modal Window Header */}
        <div className="bg-[#38bdf8] text-black px-3 py-1 flex items-center justify-between font-bold">
          <span>{person ? '┌── EDIT PERSON ──┐' : '┌── ADD PERSON ──┐'}</span>
          <button 
            onClick={onClose} 
            className="hover:bg-red-500 hover:text-white px-2 py-0.5 rounded transition-colors text-xs"
            title="Close (Esc)"
            id="close-modal-btn"
          >
            <X size={14} className="inline mr-1" />
            [ESC]
          </button>
        </div>

        {/* Modal Window Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-950/50 border border-red-700 text-red-400 p-2 text-xs" id="modal-error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs uppercase text-gray-400 font-bold">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#38bdf8] focus:outline-hidden text-[#38bdf8] px-3 py-1.5 text-sm"
              autoFocus
              required
              id="input-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs uppercase text-gray-400 font-bold">
                Birthday <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="MM-DD (e.g. 06-15)"
                className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#38bdf8] focus:outline-hidden text-[#38bdf8] px-3 py-1.5 text-sm"
                required
                id="input-birthday"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs uppercase text-gray-400 font-bold">
                Birth Year <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="YYYY (e.g. 1993)"
                className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#38bdf8] focus:outline-hidden text-[#38bdf8] px-3 py-1.5 text-sm"
                id="input-birth-year"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase text-gray-400 font-bold">
              Relationship Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PersonType)}
              className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#38bdf8] focus:outline-hidden text-[#38bdf8] px-3 py-1.5 text-sm"
              id="select-relationship-type"
            >
              {PERSON_TYPES.map((t) => (
                <option key={t} value={t} className="bg-black">
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase text-gray-400 font-bold">
              Notes <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Faux TUI Note records..."
              rows={3}
              className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#38bdf8] focus:outline-hidden text-[#38bdf8] px-3 py-1.5 text-sm resize-none"
              id="textarea-notes"
            />
          </div>

          {/* Modal Buttons */}
          <div className="pt-2 flex justify-end gap-3 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-700 text-gray-400 hover:bg-gray-900 transition-colors"
              id="btn-cancel-person"
            >
              [C]ANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#38bdf8] text-black font-bold hover:bg-[#7dd3fc] transition-colors"
              id="btn-save-person"
            >
              [S]AVE RECORD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
