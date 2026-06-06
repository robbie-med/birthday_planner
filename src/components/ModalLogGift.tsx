/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Person, GiftHistoryEntry } from '../types';
import { X } from 'lucide-react';

interface ModalLogGiftProps {
  person: Person;
  onSave: (entry: GiftHistoryEntry) => void;
  onClose: () => void;
}

export default function ModalLogGift({ person, onSave, onClose }: ModalLogGiftProps) {
  const [year, setYear] = useState<string>(String(new Date('2026-06-06').getFullYear()));
  const [occasion, setOccasion] = useState('birthday');
  const [gaveItem, setGaveItem] = useState('');
  const [gaveAmount, setGaveAmount] = useState('');
  const [receivedItem, setReceivedItem] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
      setError('Error: Year must be a valid year integer between 1900 and 2100.');
      return;
    }

    let parsedGaveAmount: number | null = null;
    if (gaveAmount.trim()) {
      const gAmt = parseInt(gaveAmount, 10);
      if (isNaN(gAmt) || gAmt < 0) {
        setError('Error: Gave amount must be a non-negative integer.');
        return;
      }
      parsedGaveAmount = gAmt;
    }

    let parsedReceivedAmount: number | null = null;
    if (receivedAmount.trim()) {
      const rAmt = parseInt(receivedAmount, 10);
      if (isNaN(rAmt) || rAmt < 0) {
        setError('Error: Received amount must be a non-negative integer.');
        return;
      }
      parsedReceivedAmount = rAmt;
    }

    onSave({
      year: parsedYear,
      occasion: occasion.trim() || 'birthday',
      gave_item: gaveItem.trim() || null,
      gave_amount: parsedGaveAmount,
      received_item: receivedItem.trim() || null,
      received_amount: parsedReceivedAmount
    });
  };

  // Esc keyboard triggers back
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
        className="w-full max-w-lg bg-[#0c0f12] border-2 border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.3)] text-gray-200"
        id="modal-log-gift-container"
      >
        {/* Modal Window Header */}
        <div className="bg-[#fbbf24] text-black px-3 py-1 flex items-center justify-between font-bold">
          <span>┌── LOG GIFT: {person.name.toUpperCase()} ──┐</span>
          <button 
            onClick={onClose} 
            className="hover:bg-red-500 hover:text-white px-2 py-0.5 rounded transition-colors text-xs"
            title="Close (Esc)"
            id="close-gift-modal-btn"
          >
            <X size={14} className="inline mr-1" />
            [ESC]
          </button>
        </div>

        {/* Modal Window Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-950/50 border border-red-700 text-red-400 p-2 text-xs" id="gift-modal-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs uppercase text-gray-400 font-bold">
                Year <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#fbbf24] focus:outline-hidden text-[#fbbf24] px-3 py-1.5 text-sm"
                required
                id="input-gift-year"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs uppercase text-gray-400 font-bold">
                Occasion <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="birthday"
                className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#fbbf24] focus:outline-hidden text-[#fbbf24] px-3 py-1.5 text-sm"
                required
                id="input-gift-occasion"
              />
            </div>
          </div>

          <div className="border-t border-dashed border-gray-800 my-2 pt-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-2">🎁 Gift Gave Ledger</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] uppercase text-gray-400">Gave Item Name</label>
                <input
                  type="text"
                  value={gaveItem}
                  onChange={(e) => setGaveItem(e.target.value)}
                  placeholder="e.g. Wool Scarf"
                  className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#fbbf24] focus:outline-hidden text-amber-400 px-3 py-1.5 text-sm"
                  id="input-gave-item"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-gray-400">Value ($)</label>
                <input
                  type="number"
                  value={gaveAmount}
                  onChange={(e) => setGaveAmount(e.target.value)}
                  placeholder="50"
                  className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#fbbf24] focus:outline-hidden text-amber-400 px-3 py-1.5 text-sm"
                  id="input-gave-amount"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-800 my-2 pt-2">
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest block mb-2">📥 Gift Received Ledger</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] uppercase text-gray-400">Received Item Name</label>
                <input
                  type="text"
                  value={receivedItem}
                  onChange={(e) => setReceivedItem(e.target.value)}
                  placeholder="e.g. Coffee Beans"
                  className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#fbbf24] focus:outline-hidden text-emerald-400 px-3 py-1.5 text-sm"
                  id="input-received-item"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-gray-400">Value ($)</label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="20"
                  className="w-full bg-black border border-gray-700 hover:border-gray-500 focus:border-[#fbbf24] focus:outline-hidden text-emerald-400 px-3 py-1.5 text-sm"
                  id="input-received-amount"
                />
              </div>
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="pt-2 flex justify-end gap-3 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-700 text-gray-400 hover:bg-gray-900 transition-colors"
              id="btn-cancel-gift"
            >
              [C]ANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#fbbf24] text-black font-bold hover:bg-amber-300 transition-colors"
              id="btn-save-gift"
            >
              [S]AVE TRANSACTION
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
