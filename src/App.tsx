/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Person, TuiScreen, GiftHistoryEntry, PersonType } from './types';
import {
  INITIAL_PEOPLE,
  TODAY_DATE_STR,
  getDaysUntilBirthday,
  getAge,
  formatBirthday,
  getLastGave,
  getLastReceived,
  getTotalGave,
  getTotalReceived,
  SYSTEMD_TIMER_CONTENT,
  SYSTEMD_SERVICE_CONTENT,
  SH_REMINDER_CONTENT,
  PYTHON_REMINDER_CONTENT
} from './data';
import ModalAddEdit from './components/ModalAddEdit';
import ModalLogGift from './components/ModalLogGift';
import ModalDelete from './components/ModalDelete';
import { 
  Calendar, 
  Users, 
  Gift, 
  FileText, 
  Settings, 
  Database,
  Download,
  Upload,
  Clock,
  Terminal,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCode,
  Copy,
  Check
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'birthday_planner_people';

export default function App() {
  // State variables
  const [people, setPeople] = useState<Person[]>([]);
  const [currentScreen, setCurrentScreen] = useState<TuiScreen>('upcoming');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  
  // Sort State for All People screen (name vs birthday-month)
  const [allPeopleSortBy, setAllPeopleSortBy] = useState<'name' | 'month'>('name');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isLogGiftModalOpen, setIsLogGiftModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Terminal active quit state
  const [isQuit, setIsQuit] = useState(false);

  // Copy feedbacks
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  // active helper tabs in systemd setup view
  const [systemdActiveTab, setSystemdActiveTab] = useState<'timer' | 'service' | 'bash' | 'python'>('timer');

  // Load database on start
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setPeople(JSON.parse(stored));
      } else {
        setPeople(INITIAL_PEOPLE);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PEOPLE));
      }
    } catch (e) {
      console.error("Failed to load people database:", e);
      setPeople(INITIAL_PEOPLE);
    }
  }, []);

  // Sync database helper
  const savePeopleToStorage = (updatedPeople: Person[]) => {
    setPeople(updatedPeople);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPeople));
    } catch (e) {
      console.error("Failed to save people database:", e);
    }
  };

  // Memoized lists based on active rules
  // 1. Upcoming list: sorted by days until birthday ascending (showing all in next 365 days)
  const upcomingPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      const daysA = getDaysUntilBirthday(a.birthday, TODAY_DATE_STR);
      const daysB = getDaysUntilBirthday(b.birthday, TODAY_DATE_STR);
      return daysA - daysB;
    });
  }, [people]);

  // 2. All people list: sortable by name or birthday month
  const sortedAllPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      if (allPeopleSortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by MM-DD month part
        const monthA = parseInt(a.birthday.split('-')[0], 10);
        const monthB = parseInt(b.birthday.split('-')[0], 10);
        if (monthA !== monthB) return monthA - monthB;
        // fallback to day
        const dayA = parseInt(a.birthday.split('-')[1], 10);
        const dayB = parseInt(b.birthday.split('-')[1], 10);
        return dayA - dayB;
      }
    });
  }, [people, allPeopleSortBy]);

  // Retrieve selected profile objects
  const selectedPerson = useMemo(() => {
    if (!selectedPersonId) return null;
    return people.find(p => p.id === selectedPersonId) || null;
  }, [people, selectedPersonId]);

  // Current list representation in viewport to determine arrow keys selection limits
  const activeList = useMemo(() => {
    if (currentScreen === 'upcoming') return upcomingPeople;
    if (currentScreen === 'all-people') return sortedAllPeople;
    return [];
  }, [currentScreen, upcomingPeople, sortedAllPeople]);

  // Adjust row selection clamping if activeList changes
  useEffect(() => {
    if (activeList.length === 0) {
      setSelectedRowIndex(0);
      return;
    }
    if (selectedRowIndex >= activeList.length) {
      setSelectedRowIndex(Math.max(0, activeList.length - 1));
    }
  }, [activeList, selectedRowIndex]);

  // Sync selectedPersonId dynamically when arrow row selection changes
  useEffect(() => {
    if (activeList.length > 0 && selectedRowIndex >= 0 && selectedRowIndex < activeList.length) {
      setSelectedPersonId(activeList[selectedRowIndex].id);
    }
  }, [selectedRowIndex, activeList]);

  // Help detect standard focus context to prevent global raw keyboard collisions
  const isInputActive = (): boolean => {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  };

  // Setup Global Keyboard Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore normal shortcut key triggers if user is actively filling form fields or modal is open
      if (isInputActive() || isAddEditModalOpen || isLogGiftModalOpen || isDeleteModalOpen || isQuit) {
        return;
      }

      const key = e.key.toLowerCase();

      // Navigation screen toggles
      if (key === 'p') {
        e.preventDefault();
        setCurrentScreen('all-people');
        setSelectedRowIndex(0);
      } else if (key === 'u') {
        e.preventDefault();
        setCurrentScreen('upcoming');
        setSelectedRowIndex(0);
      } else if (key === 'q') {
        e.preventDefault();
        setIsQuit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (currentScreen === 'detail') {
          setCurrentScreen('upcoming');
        }
      }

      // Selection grid navigate
      if (currentScreen !== 'detail') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedRowIndex(prev => Math.min(prev + 1, activeList.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedRowIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedPersonId) {
            setCurrentScreen('detail');
          }
        }
      }

      // Command modals
      if (key === 'a') {
        e.preventDefault();
        setModalMode('add');
        setIsAddEditModalOpen(true);
      } else if (key === 'e') {
        e.preventDefault();
        if (selectedPerson) {
          setModalMode('edit');
          setIsAddEditModalOpen(true);
        }
      } else if (key === 'l') {
        e.preventDefault();
        if (selectedPerson) {
          setIsLogGiftModalOpen(true);
        }
      } else if (key === 'd') {
        e.preventDefault();
        if (currentScreen === 'all-people' && selectedPerson) {
          setIsDeleteModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    currentScreen,
    activeList,
    selectedPersonId,
    selectedRowIndex,
    selectedPerson,
    isAddEditModalOpen,
    isLogGiftModalOpen,
    isDeleteModalOpen,
    isQuit
  ]);

  // Operations handlers
  const handleSavePerson = (fields: Omit<Person, 'id' | 'gift_history'>) => {
    if (modalMode === 'add') {
      const newPerson: Person = {
        ...fields,
        id: `person-${Date.now()}`,
        gift_history: []
      };
      const updated = [...people, newPerson];
      savePeopleToStorage(updated);
    } else {
      const updated = people.map(p => {
        if (p.id === selectedPersonId) {
          return { ...p, ...fields };
        }
        return p;
      });
      savePeopleToStorage(updated);
    }
    setIsAddEditModalOpen(false);
  };

  const handleSaveGift = (entry: GiftHistoryEntry) => {
    if (!selectedPersonId) return;
    const updated = people.map(p => {
      if (p.id === selectedPersonId) {
        return {
          ...p,
          gift_history: [...p.gift_history, entry]
        };
      }
      return p;
    });
    savePeopleToStorage(updated);
    setIsLogGiftModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!selectedPersonId) return;
    const updated = people.filter(p => p.id !== selectedPersonId);
    savePeopleToStorage(updated);
    setIsDeleteModalOpen(false);
    setSelectedRowIndex(0);
  };

  // Export database is as people.json formatted files
  const downloadDatabase = () => {
    const dataStr = JSON.stringify(people, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'people.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // File import helper for people.json integration
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Basic validation
            const isValid = parsed.every(item => item.name && item.birthday);
            if (isValid) {
              const enriched = parsed.map((item, index) => ({
                id: item.id || `person-imported-${index}-${Date.now()}`,
                name: item.name,
                birthday: item.birthday,
                birth_year: item.birth_year || null,
                type: item.type || 'other',
                notes: item.notes || '',
                gift_history: item.gift_history || []
              }));
              savePeopleToStorage(enriched);
              alert("Data import successful!");
            } else {
              alert("Import failed: Each profile needs a valid 'name' and 'birthday' (MM-DD).");
            }
          } else {
            alert("Import failed: Expected a JSON array of items.");
          }
        } catch (error) {
          alert("Error parsing JSON file. Please verify schema structure.");
        }
      };
    }
  };

  // Copy helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(label);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  if (isQuit) {
    return (
      <div className="min-h-screen bg-black text-[#22c55e] p-6 lg:p-12 flex flex-col items-center justify-center font-mono select-none">
        <div className="max-w-md w-full border border-dashed border-[#22c55e] p-6 space-y-4 shadow-[0_0_20px_rgba(34,197,94,0.15)] text-center">
          <div className="text-xl font-bold uppercase tracking-widest text-[#22c55e]">
            ◈ SESSION SUSPENDED ◈
          </div>
          <p className="text-xs text-gray-400">
            You exited the birthday planner terminal environment (Command [q]). 
            <br />
            To reconnect and launch the dashboard again, tap the key below or press <kbd className="bg-emerald-950 px-1.5 py-0.5 border border-emerald-700 text-emerald-400 rounded">R</kbd>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setIsQuit(false);
                setSelectedRowIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'r' || e.key === 'R') {
                  setIsQuit(false);
                }
              }}
              autoFocus
              className="px-6 py-2 bg-[#22c55e] hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-sm shadow-md transition-all cursor-pointer"
            >
              [R] RECONNECT TERMINAL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090b] text-zinc-100 flex flex-col font-mono p-4 lg:p-6 selection:bg-[#38bdf8] selection:text-black">
      
      {/* Outer Glow TUI Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 border border-zinc-800 bg-[#0b0d0f] shadow-2xl rounded-sm overflow-hidden">
        
        {/* TUI Top Header Bar */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#10b981] animate-pulse"></div>
            <span className="font-bold text-gray-300 tracking-wider uppercase text-xs md:text-sm flex items-center gap-1.5">
              <Terminal size={14} className="text-emerald-400" />
              BIRTHDAY-PLANNER://LOCAL_TUI
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400 text-[11px] md:text-xs">
            <div className="flex items-center gap-1">
              <Database size={13} className="text-zinc-500" />
              <span>loaded: <strong className="text-emerald-400">{people.length}</strong> records</span>
            </div>
            <div className="flex items-center gap-1 hidden sm:flex">
              <Clock size={13} className="text-zinc-500" />
              <span>SYS_REF_TIME: <strong className="text-amber-500">{TODAY_DATE_STR}</strong></span>
            </div>
          </div>
        </header>

        {/* Outer Navigation Ribbon & Global Summary Counts */}
        <div className="p-3 bg-[#0f1115] border-b border-zinc-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
          
          {/* Main Select Mode Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setCurrentScreen('upcoming');
                setSelectedRowIndex(0);
              }}
              className={`px-3 py-1.5 border transition-all text-[11px] flex items-center gap-1.5 font-semibold ${
                currentScreen === 'upcoming'
                  ? 'bg-amber-500/10 border-amber-500/70 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
              id="tab-upcoming-screen"
            >
              <Calendar size={13} />
              1. UPCOMING CELEBRATIONS [U]
            </button>

            <button
              onClick={() => {
                setCurrentScreen('all-people');
                setSelectedRowIndex(0);
              }}
              className={`px-3 py-1.5 border transition-all text-[11px] flex items-center gap-1.5 font-semibold ${
                currentScreen === 'all-people'
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8]/70 text-[#38bdf8] font-bold shadow-[0_0_8px_rgba(56,189,248,0.15)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
              id="tab-all-people-screen"
            >
              <Users size={13} />
              2. ALL PEOPLE DIRECTORY [P]
            </button>
          </div>

          {/* Database management - Quick load defaults or upload/download */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download JSON Button */}
            <button
              onClick={downloadDatabase}
              title="Download people.json copy"
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xs flex items-center gap-1 cursor-pointer hover:text-[#38bdf8] transition-all text-[11px]"
              id="btn-export-database"
            >
              <Download size={12} />
              EXPORT JSON
            </button>

            {/* Import JSON Input wrapper */}
            <label className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xs flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-all text-[11px]">
              <Upload size={12} />
              IMPORT JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportDatabase}
                className="hidden"
                id="input-import-database"
              />
            </label>

            {/* Reset Seed Button */}
            <button
              onClick={() => {
                if (confirm("Reset database to original sample records?")) {
                  savePeopleToStorage(INITIAL_PEOPLE);
                  setSelectedRowIndex(0);
                }
              }}
              className="px-2 py-1 bg-red-950/20 text-red-400 border border-red-950 hover:bg-red-950/50 hover:border-red-600 transition-all text-[10px] rounded-xs"
              id="btn-reload-seed"
            >
              RESET TO SEED
            </button>
          </div>

        </div>

        {/* CORE SCREEN SWITCH BOARD */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col gap-6 overflow-x-hidden min-h-[420px]">
          
          {/* Keyboard tip bar for navigation */}
          <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xs text-[11px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-emerald-400/90 font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Keyboard Mode Active
            </span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-center">
              Navigate: <strong className="text-zinc-300">▲▼ Arrow Keys</strong> • View: <strong className="text-zinc-300">Enter Key</strong> • Escape: <strong className="text-zinc-300">Exit panel</strong>
            </span>
          </div>

          {currentScreen === 'upcoming' && (
            <div className="flex flex-col gap-4 flex-1">
              {/* Header block with ascii representation */}
              <div className="border border-amber-600/30 bg-amber-950/5 p-4 rounded-xs">
                <div className="text-amber-500 font-bold uppercase tracking-widest text-[#fbbf24] text-xs">
                  ┌── ◈ SCREEN 1: UPCOMING BIRTHDAYS (365 DAYS) ──┐
                </div>
                <p className="text-zinc-400 text-xs mt-1">
                  Chronological schedule of birthdays sorted by remainder days. Critical periods (7 days) highlighted in <span className="text-red-400 font-bold bg-red-950/30 px-1">RED ERROR</span>. Imminent periods (14 days) highlighted in <span className="text-amber-400 font-bold bg-amber-950/30 px-1">AMBER WARNING</span>.
                </p>
              </div>

              {upcomingPeople.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-zinc-800 text-center">
                  <AlertTriangle className="text-zinc-600 mb-2" size={32} />
                  <span className="text-sm font-semibold text-zinc-400">Database folder is empty!</span>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">Add your first family or friend profiles to start tracking their details.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-zinc-800 rounded-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                        <th className="py-2.5 px-3">NAME</th>
                        <th className="py-2.5 px-3">RELATIONSHIP TYPE</th>
                        <th className="py-2.5 px-3">BIRTHDATE</th>
                        <th className="py-2.5 px-3 text-right">DAYS REMAINING</th>
                        <th className="py-2.5 px-3 text-center">AGE NEXT</th>
                        <th className="py-2.5 px-3 max-w-[150px] truncate">LAST GAVE GESTURE</th>
                        <th className="py-2.5 px-3 max-w-[150px] truncate">LAST RECEIVED GESTURE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {upcomingPeople.map((person, index) => {
                        const daysLeft = getDaysUntilBirthday(person.birthday, TODAY_DATE_STR);
                        const calculatedAge = getAge(person.birth_year, person.birthday, TODAY_DATE_STR);
                        const targetAge = calculatedAge !== null ? calculatedAge + 1 : '—';
                        
                        // Status alert colors matching rule
                        // Rows within 7 days: highlighted error color (red)
                        // Rows within 14 days: highlighted warning color (amber)
                        let bStateStyle = "hover:bg-zinc-900/60";
                        let bannerText = "";
                        
                        if (daysLeft <= 7) {
                          bStateStyle = "bg-red-950/30 border-l-[3px] border-red-500 font-medium text-red-200 hover:bg-red-950/45";
                          bannerText = " [🚨 IMMINENT]";
                        } else if (daysLeft <= 14) {
                          bStateStyle = "bg-amber-950/30 border-l-[3px] border-amber-500 font-medium text-amber-200 hover:bg-amber-950/45";
                          bannerText = " [🕒 WARNING]";
                        }

                        // Selected indicator styling
                        const isSelected = selectedPersonId === person.id;
                        const rowSelectedClass = isSelected 
                          ? "ring-2 ring-inset ring-amber-500 bg-amber-500/10!" 
                          : "";

                        return (
                          <tr
                            key={person.id}
                            onClick={() => {
                              setSelectedRowIndex(index);
                              setSelectedPersonId(person.id);
                            }}
                            onDoubleClick={() => {
                              setSelectedPersonId(person.id);
                              setCurrentScreen('detail');
                            }}
                            className={`cursor-pointer transition-colors relative ${bStateStyle} ${rowSelectedClass}`}
                            id={`row-upcoming-${person.id}`}
                          >
                            <td className="py-3 px-3 font-semibold">
                              <span className="flex items-center gap-1.5">
                                {isSelected && <span className="text-[#fbbf24] font-bold">▶</span>}
                                {person.name}
                                <span className="text-[9px] font-bold tracking-widest leading-none">{bannerText}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold uppercase">
                                {person.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 tracking-wider text-zinc-300 font-medium">
                              {formatBirthday(person.birthday)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold tracking-wider text-[13px]">
                              <span className={daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-amber-400' : 'text-zinc-300'}>
                                {daysLeft} d
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-zinc-300">
                              {targetAge}
                            </td>
                            <td className="py-3 px-3 max-w-[150px] truncate text-zinc-400" title={getLastGave(person.gift_history)}>
                              {getLastGave(person.gift_history)}
                            </td>
                            <td className="py-3 px-3 max-w-[150px] truncate text-zinc-400" title={getLastReceived(person.gift_history)}>
                              {getLastReceived(person.gift_history)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {currentScreen === 'all-people' && (
            <div className="flex flex-col gap-4 flex-1">
              
              {/* Header and Sorting Controller */}
              <div className="border border-[#38bdf8]/30 bg-[#38bdf8]/5 p-4 rounded-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="text-[#38bdf8] font-bold uppercase tracking-widest text-xs">
                    ┌── ◈ SCREEN 2: ALL PEOPLE DIRECTORY ──┐
                  </div>
                  <p className="text-zinc-400 text-xs mt-1">
                    Complete listing of all contacts in database. Keeps tracking of aggregate spent amount and returned gift statistics.
                  </p>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400 uppercase text-[11px] font-bold">Sort criteria:</span>
                  <div className="inline-flex bg-zinc-950 p-0.5 border border-zinc-800">
                    <button
                      onClick={() => setAllPeopleSortBy('name')}
                      className={`px-2.5 py-1 text-[11px] transition-all font-semibold ${
                        allPeopleSortBy === 'name'
                          ? 'bg-[#38bdf8] text-black font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      id="btn-sort-by-name"
                    >
                      A-Z NAME
                    </button>
                    <button
                      onClick={() => setAllPeopleSortBy('month')}
                      className={`px-2.5 py-1 text-[11px] transition-all font-semibold ${
                        allPeopleSortBy === 'month'
                          ? 'bg-[#38bdf8] text-black font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      id="btn-sort-by-month"
                    >
                      BIRTHDAY MONTH
                    </button>
                  </div>
                </div>
              </div>

              {sortedAllPeople.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-zinc-800 text-center">
                  <Users className="text-zinc-600 mb-2" size={32} />
                  <span className="text-sm font-semibold text-zinc-400">No profile directories found!</span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-zinc-800 rounded-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                        <th className="py-2.5 px-3">NAME</th>
                        <th className="py-2.5 px-3">RELATIONSHIP TYPE</th>
                        <th className="py-2.5 px-3">BIRTHDAY</th>
                        <th className="py-2.5 px-3 text-center">AGE NOW</th>
                        <th className="py-2.5 px-3 text-right">TOTAL GAVE VALUE</th>
                        <th className="py-2.5 px-3 text-right">TOTAL RECEIVED V.</th>
                        <th className="py-2.5 px-3 text-center">LEDGER STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {sortedAllPeople.map((person, index) => {
                        const ageNow = getAge(person.birth_year, person.birthday, TODAY_DATE_STR);
                        const totalGave = getTotalGave(person.gift_history);
                        const totalRec = getTotalReceived(person.gift_history);
                        const ledgerDiff = totalGave - totalRec;

                        // Selected indicator styling
                        const isSelected = selectedPersonId === person.id;
                        const rowSelectedClass = isSelected 
                          ? "ring-2 ring-inset ring-[#38bdf8] bg-[#38bdf8]/10" 
                          : "hover:bg-zinc-900/60";

                        return (
                          <tr
                            key={person.id}
                            onClick={() => {
                              setSelectedRowIndex(index);
                              setSelectedPersonId(person.id);
                            }}
                            onDoubleClick={() => {
                              setSelectedPersonId(person.id);
                              setCurrentScreen('detail');
                            }}
                            className={`cursor-pointer transition-colors ${rowSelectedClass}`}
                            id={`row-all-${person.id}`}
                          >
                            <td className="py-3 px-3 font-semibold">
                              <span className="flex items-center gap-1.5">
                                {isSelected && <span className="text-[#38bdf8] font-bold">▶</span>}
                                {person.name}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-1.5 py-0.5 rounded-xs text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold uppercase">
                                {person.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 tracking-wider text-zinc-300 font-medium">
                              {formatBirthday(person.birthday)} {person.birth_year ? `(${person.birth_year})` : ''}
                            </td>
                            <td className="py-3 px-3 text-center text-zinc-300">
                              {ageNow !== null ? ageNow : '—'}
                            </td>
                            <td className="py-3 px-3 text-right text-amber-400 font-bold tracking-wider">
                              ${totalGave}
                            </td>
                            <td className="py-3 px-3 text-right text-emerald-400 font-bold tracking-wider">
                              ${totalRec}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {ledgerDiff > 0 ? (
                                <span className="text-amber-500 font-bold text-[10px] uppercase bg-amber-500/10 px-1 py-0.5 border border-amber-500/20">
                                  +${Math.abs(ledgerDiff)} GAVE
                                </span>
                              ) : ledgerDiff < 0 ? (
                                <span className="text-emerald-500 font-bold text-[10px] uppercase bg-emerald-500/10 px-1 py-0.5 border border-emerald-500/20">
                                  +${Math.abs(ledgerDiff)} REC.
                                </span>
                              ) : (
                                <span className="text-zinc-500 font-bold text-[10px] uppercase bg-zinc-950 px-1 py-0.5 border border-zinc-800">
                                  BALANCED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {currentScreen === 'detail' && selectedPerson && (
            <div className="flex flex-col gap-6 flex-1">
              
              {/* Profile Detail Header */}
              <div className="border-2 border-dashed border-[#10b981]/50 bg-[#10b981]/5 p-5 rounded-xs relative">
                
                {/* Back button */}
                <button
                  onClick={() => setCurrentScreen('upcoming')}
                  className="absolute top-4 right-4 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-xs transition-colors"
                  id="btn-back-to-upcoming"
                >
                  [ESC] BACK
                </button>

                <div className="text-[#10b981] font-bold uppercase tracking-widest text-xs mb-3">
                  ┌── ◈ SCREEN 3: PERSON DETAIL HIGHLIGHT ──┐
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:items-center">
                  <div className="md:col-span-2 space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                      <span className="p-1.5 bg-[#10b981]/25 border border-[#10b981]/40 rounded-xs text-xs md:text-sm">
                        {selectedPerson.name.charAt(0).toUpperCase()}
                      </span>
                      {selectedPerson.name}
                    </h2>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-sm font-semibold uppercase">
                        {selectedPerson.type}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] bg-zinc-900 border border-zinc-700 rounded-sm text-zinc-400">
                        ID: {selectedPerson.id}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 p-3 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Annual Birthdate</div>
                    <div className="text-sm font-bold text-[#fbbf24] mt-0.5 tracking-wider">
                      {formatBirthday(selectedPerson.birthday)}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      {selectedPerson.birth_year ? `Born Year: ${selectedPerson.birth_year}` : 'Born Year: omitted'}
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 p-3 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Calculated Age</div>
                    <div className="text-sm font-bold text-[#38bdf8] mt-0.5">
                      {getAge(selectedPerson.birth_year, selectedPerson.birthday, TODAY_DATE_STR) !== null
                        ? `${getAge(selectedPerson.birth_year, selectedPerson.birthday, TODAY_DATE_STR)} yrs old`
                        : 'Unknown'}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      Days Left: <span className="font-semibold text-white">{getDaysUntilBirthday(selectedPerson.birthday, TODAY_DATE_STR)} d</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-zinc-800 text-xs">
                  <strong className="text-zinc-400 uppercase tracking-widest block mb-1">📝 Core Notes & Preferences:</strong>
                  <p className="text-zinc-300 italic pl-3 border-l-2 border-emerald-500 leading-relaxed">
                    {selectedPerson.notes || 'No notes loaded for this profile record. Tap [E] to add some guidelines.'}
                  </p>
                </div>
              </div>

              {/* Gift Transactions Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold text-zinc-400 flex items-center gap-1.1">
                    <Gift size={13} className="text-amber-500" />
                    Ledger Transactions History
                  </h3>
                  
                  <button
                    onClick={() => setIsLogGiftModalOpen(true)}
                    className="px-2.5 py-1.2 bg-[#fbbf24] hover:bg-amber-300 text-black font-bold rounded-xs flex items-center gap-1 text-[11px] cursor-pointer"
                    id="btn-log-gift-detail"
                  >
                    [L] LOG GIFT
                  </button>
                </div>

                {selectedPerson.gift_history.length === 0 ? (
                  <div className="border border-zinc-800 p-8 rounded-xs text-center text-zinc-500 text-xs">
                    No gift transactions logged for {selectedPerson.name} yet.
                    <br />
                    Use the <strong>[L] LOG GIFT</strong> command button above to track your first gave or received transaction.
                  </div>
                ) : (
                  <div className="border border-zinc-800 rounded-sm overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900 text-zinc-400 font-bold border-b border-zinc-800">
                          <th className="py-2 px-3">YEAR</th>
                          <th className="py-2 px-3">OCCASION</th>
                          <th className="py-2 px-3 text-amber-400">🎁 GAVE ITEM</th>
                          <th className="py-2 px-3 text-amber-400 text-right">GAVE $</th>
                          <th className="py-2 px-3 text-emerald-400">📥 RECEIVED ITEM</th>
                          <th className="py-2 px-3 text-emerald-400 text-right">RECEIVED $</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {selectedPerson.gift_history.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/40">
                            <td className="py-2.5 px-3 font-semibold text-zinc-300">{entry.year}</td>
                            <td className="py-2.5 px-3 text-zinc-400 italic">
                              {entry.occasion || 'birthday'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-amber-200">
                              {entry.gave_item || <span className="text-zinc-600 font-normal">—</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                              {entry.gave_amount !== null ? `$${entry.gave_amount}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-emerald-200">
                              {entry.received_item || <span className="text-zinc-600 font-normal">—</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                              {entry.received_amount !== null ? `$${entry.received_amount}` : '—'}
                            </td>
                          </tr>
                        ))}

                        {/* Running totals row */}
                        <tr className="bg-zinc-950 font-bold border-t-2 border-zinc-800">
                          <td colSpan={2} className="py-3 px-3 uppercase text-zinc-400 text-[11px]">
                            RUNNING LEDGER TOTALS:
                          </td>
                          <td className="py-3 px-3 text-amber-500 italic text-[11px] text-right" colSpan={2}>
                            Spent GIVING: 
                            <span className="ml-1.5 font-bold text-amber-400 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded-sm">
                              ${getTotalGave(selectedPerson.gift_history)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-emerald-500 italic text-[11px] text-right" colSpan={2}>
                            Value RECEIVED: 
                            <span className="ml-1.5 font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                              ${getTotalReceived(selectedPerson.gift_history)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PERSISTENT SYSTEMD REMINDERS CONFIGURATION EXPLANATION CARDS */}
          <div className="border border-zinc-800 rounded-sm bg-zinc-950/80 p-5 mt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-2 border-b border-zinc-800 pb-2">
              <FileCode className="text-[#38bdf8]" size={16} />
              SYSTEMD TIMER & AUTOMATED REMINDERS SETUP (LOCAL ONLY)
            </h3>
            
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              To trigger the local system alerts described in the user guidelines, create the daily notification daemon script on your SSH terminal machine. Copy these custom configuration profiles below to schedule them on your user systemd scheduler:
            </p>

            {/* Config Sub Tabs */}
            <div className="flex flex-wrap border-b border-zinc-800 text-[11px] mb-3">
              <button
                onClick={() => setSystemdActiveTab('timer')}
                className={`px-3 py-1.5 font-bold tracking-wider transition-colors ${
                  systemdActiveTab === 'timer' ? 'border-b-2 border-[#38bdf8] text-[#38bdf8]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                1. REMINDER.TIMER
              </button>
              <button
                onClick={() => setSystemdActiveTab('service')}
                className={`px-3 py-1.5 font-bold tracking-wider transition-colors ${
                  systemdActiveTab === 'service' ? 'border-b-2 border-[#38bdf8] text-[#38bdf8]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                2. REMINDER.SERVICE
              </button>
              <button
                onClick={() => setSystemdActiveTab('bash')}
                className={`px-3 py-1.5 font-bold tracking-wider transition-colors ${
                  systemdActiveTab === 'bash' ? 'border-b-2 border-[#38bdf8] text-[#38bdf8]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                3. BASH CRON DAEMON (JQ)
              </button>
              <button
                onClick={() => setSystemdActiveTab('python')}
                className={`px-3 py-1.5 font-bold tracking-wider transition-colors ${
                  systemdActiveTab === 'python' ? 'border-b-2 border-[#38bdf8] text-[#38bdf8]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                4. PYTHON ALTERNATIVE (BUILT-IN)
              </button>
            </div>

            {/* active text preview box */}
            <div className="relative">
              {/* Copy action */}
              <button
                onClick={() => {
                  const targetContent = 
                    systemdActiveTab === 'timer' ? SYSTEMD_TIMER_CONTENT :
                    systemdActiveTab === 'service' ? SYSTEMD_SERVICE_CONTENT :
                    systemdActiveTab === 'bash' ? SH_REMINDER_CONTENT : PYTHON_REMINDER_CONTENT;
                  handleCopyText(targetContent, systemdActiveTab);
                }}
                className="absolute top-2 right-2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all rounded-xs text-[10px] flex items-center gap-1"
                id="btn-copy-config"
              >
                {copiedScript === systemdActiveTab ? (
                  <>
                    <Check size={11} className="text-emerald-400" />
                    COPIED!
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    COPY TO CLIPBOARD
                  </>
                )}
              </button>

              <div className="absolute bottom-2 right-2 text-[10px] text-zinc-500 bg-zinc-950/90 px-1 border border-zinc-800 pointer-events-none uppercase">
                {systemdActiveTab === 'timer' ? '~/.config/systemd/user/birthday-reminder.timer' :
                 systemdActiveTab === 'service' ? '~/.config/systemd/user/birthday-reminder.service' :
                 systemdActiveTab === 'bash' ? '~/.config/birthday-planner/reminder.sh' : '~/.config/birthday-planner/reminder.py'}
              </div>

              <pre className="bg-black/90 text-[11px] md:text-xs text-[#22c55e] p-4 pt-10 rounded border border-zinc-800 overflow-x-auto max-h-[220px] font-mono leading-relaxed">
                <code>
                  {systemdActiveTab === 'timer' && SYSTEMD_TIMER_CONTENT}
                  {systemdActiveTab === 'service' && SYSTEMD_SERVICE_CONTENT}
                  {systemdActiveTab === 'bash' && SH_REMINDER_CONTENT}
                  {systemdActiveTab === 'python' && PYTHON_REMINDER_CONTENT}
                </code>
              </pre>
            </div>

            {/* Quick deployment instructions summary */}
            <div className="mt-3.5 bg-zinc-900/60 p-3 rounded border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <strong className="text-zinc-300 block mb-1">🔧 SSH CRON DEPLOYMENT COMMAND LINES:</strong>
              <div>1. Save your people list to file: <code className="bg-black text-[#fbbf24] px-1 py-0.5 rounded text-[10px]">mkdir -p ~/.config/birthday-planner && nano ~/.config/birthday-planner/people.json</code> (Paste exported JSON from browser)</div>
              <div>2. Save script: <code className="bg-black text-[#fbbf24] px-1 py-0.5 rounded text-[10px]">nano ~/.config/birthday-planner/reminder.sh && chmod +x ~/.config/birthday-planner/reminder.sh</code></div>
              <div>3. Build user unit: <code className="bg-black text-[#fbbf24] px-1 py-0.5 rounded text-[10px]">mkdir -p ~/.config/systemd/user && nano ~/.config/systemd/user/birthday-reminder.timer</code></div>
              <div>4. Schedule timer loop: <code className="bg-black text-[#fbbf24] px-1 py-0.5 rounded text-[10px]">systemctl --user daemon-reload && systemctl --user enable --now birthday-reminder.timer</code></div>
            </div>
          </div>

        </main>

        {/* BOTTOM DASHBOARD ACTION RIBBON KEYBIND MAPS */}
        <footer className="bg-zinc-950 border-t border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Key bindings label bar based on active screen */}
          <div className="flex flex-wrap items-center gap-1.5 tracking-wide">
            <span className="text-zinc-500 font-bold uppercase mr-1.5">TUI Commands:</span>
            
            {currentScreen === 'upcoming' && (
              <>
                <button 
                  onClick={() => { setModalMode('add'); setIsAddEditModalOpen(true); }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-add-btn"
                >
                  <strong className="text-amber-500">[a]</strong> Add
                </button>
                <button 
                  onClick={() => { if (selectedPerson) { setModalMode('edit'); setIsAddEditModalOpen(true); } else { alert('Please select a contact first.'); } }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-edit-btn"
                >
                  <strong className="text-amber-500">[e]</strong> Edit
                </button>
                <button 
                  onClick={() => { if (selectedPerson) { setIsLogGiftModalOpen(true); } else { alert('Please select a contact first.'); } }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-log-gift-btn"
                >
                  <strong className="text-amber-500">[l]</strong> Log Gift
                </button>
                <button 
                  onClick={() => { setCurrentScreen('all-people'); setSelectedRowIndex(0); }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-all-people-btn"
                >
                  <strong className="text-amber-500">[p]</strong> All People
                </button>
                <button 
                  onClick={() => setIsQuit(true)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-[11px] font-bold border border-zinc-800 rounded-sm"
                  id="foot-quit-btn-upcoming"
                >
                  <strong className="text-red-400">[q]</strong> Quit
                </button>
              </>
            )}

            {currentScreen === 'all-people' && (
              <>
                <button 
                  onClick={() => { setModalMode('add'); setIsAddEditModalOpen(true); }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-add-btn-all"
                >
                  <strong className="text-amber-500">[a]</strong> Add
                </button>
                <button 
                  onClick={() => { if (selectedPerson) { setModalMode('edit'); setIsAddEditModalOpen(true); } else { alert('Please select a contact first.'); } }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-edit-btn-all"
                >
                  <strong className="text-amber-500">[e]</strong> Edit
                </button>
                <button 
                  onClick={() => { if (selectedPerson) { setIsDeleteModalOpen(true); } else { alert('Please select a contact first.'); } }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-delete-btn-all"
                >
                  <strong className="text-amber-500">[d]</strong> Delete
                </button>
                <button 
                  onClick={() => { setCurrentScreen('upcoming'); setSelectedRowIndex(0); }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-upcoming-btn-all"
                >
                  <strong className="text-amber-500">[u]</strong> Upcoming
                </button>
                <button 
                  onClick={() => setIsQuit(true)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-[11px] font-bold border border-zinc-800 rounded-sm"
                  id="foot-quit-btn-all"
                >
                  <strong className="text-red-400">[q]</strong> Quit
                </button>
              </>
            )}

            {currentScreen === 'detail' && selectedPerson && (
              <>
                <button 
                  onClick={() => setIsLogGiftModalOpen(true)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#10b981] hover:text-black hover:border-[#10b981] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-log-btn-detail"
                >
                  <strong className="text-emerald-400">[l]</strong> Log Gift
                </button>
                <button 
                  onClick={() => { setModalMode('edit'); setIsAddEditModalOpen(true); }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#10b981] hover:text-black hover:border-[#10b981] transition-colors text-[11px] font-medium border border-zinc-800 rounded-sm"
                  id="foot-edit-btn-detail"
                >
                  <strong className="text-emerald-400">[e]</strong> Edit Person
                </button>
                <button 
                  onClick={() => setCurrentScreen('upcoming')}
                  className="px-2 py-1 bg-zinc-900 hover:bg-[#10b981] hover:text-black hover:border-[#10b981] transition-colors text-[11px] font-semibold border border-zinc-800 rounded-sm"
                  id="foot-back-btn"
                >
                  <strong className="text-emerald-400">[esc]</strong> Back
                </button>
              </>
            )}

          </div>

          {/* Prompt input status simulation */}
          <div className="text-zinc-500 font-mono text-[10px] hidden lg:block tracking-widest text-right">
            BIRTHDAY-PLANNER USER DEPLOYMENT • VERSION 0.1.0-DEV
          </div>

        </footer>

      </div>

      {/* MODALS RENDER OVERLAYS */}
      {isAddEditModalOpen && (
        <ModalAddEdit
          person={modalMode === 'edit' ? selectedPerson : null}
          onSave={handleSavePerson}
          onClose={() => setIsAddEditModalOpen(false)}
        />
      )}

      {isLogGiftModalOpen && selectedPerson && (
        <ModalLogGift
          person={selectedPerson}
          onSave={handleSaveGift}
          onClose={() => setIsLogGiftModalOpen(false)}
        />
      )}

      {isDeleteModalOpen && selectedPerson && (
        <ModalDelete
          person={selectedPerson}
          onConfirm={handleDeleteConfirm}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

    </div>
  );
}
