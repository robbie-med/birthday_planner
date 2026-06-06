/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Person } from '../types';
import { Trash2, X } from 'lucide-react';

interface ModalDeleteProps {
  person: Person;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ModalDelete({ person, onConfirm, onClose }: ModalDeleteProps) {
  // Key bindings inside deletion modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') {
        onConfirm();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono">
      <div 
        className="w-full max-w-md bg-[#0c0f12] border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-gray-200"
        id="modal-delete-container"
      >
        {/* Header */}
        <div className="bg-red-600 text-white px-3 py-1 flex items-center justify-between font-bold">
          <span className="flex items-center gap-1.5 uppercase">
            <Trash2 size={14} />
            ┌── DELETE RECORD ──┐
          </span>
          <button 
            onClick={onClose} 
            className="hover:bg-black/30 hover:text-white px-2 py-0.5 rounded transition-colors text-xs"
            title="Cancel (Esc or N)"
            id="close-delete-modal-btn"
          >
            [N]
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-center space-y-4">
          <p className="text-sm leading-relaxed">
            Delete <span className="text-red-400 font-bold underline">{person.name}</span>?
            <br />
            This action <span className="text-gray-400 font-semibold italic">cannot be undone</span> and will purge all tracked birthday and gift history records.
          </p>

          <div className="bg-red-950/20 py-2 border border-red-900 text-xs text-red-300">
            Press <strong className="bg-red-900/40 px-1 py-0.5 border border-red-800 rounded">Y</strong> to confirm, or 
            <strong className="ml-1 bg-gray-800 px-1 py-0.5 border border-gray-700 rounded">N</strong> to cancel.
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-700 text-gray-400 hover:bg-gray-900 hover:text-white transition-colors"
              id="btn-cancel-delete"
            >
              [N]O, ABORT
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
              id="btn-confirm-delete"
            >
              [Y]ES, DELETE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
