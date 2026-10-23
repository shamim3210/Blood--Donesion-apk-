import React from 'react';
import { ActiveTab, Language } from '../types';
import {
  Home,
  Search,
  MapPin,
  Plus,
  MessageSquare,
  User,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  unreadSosCount?: number;
  unreadChatCount?: number;
  onOpenSOSModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  lang,
  unreadChatCount = 1,
  onOpenSOSModal,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 w-full bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] transition-colors select-none">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-1 relative">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center h-full py-1 cursor-pointer active:scale-95 transition-all relative ${
            activeTab === 'home'
              ? 'text-rose-600 dark:text-rose-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'scale-110 text-rose-600 dark:text-rose-400' : ''}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
          {activeTab === 'home' && (
            <div className="w-4 h-0.5 rounded-full bg-rose-600 dark:bg-rose-400 mt-0.5" />
          )}
        </button>

        {/* Tab 2: Search Donors */}
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex flex-col items-center justify-center h-full py-1 cursor-pointer active:scale-95 transition-all relative ${
            activeTab === 'search'
              ? 'text-rose-600 dark:text-rose-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <Search className={`w-5 h-5 transition-transform ${activeTab === 'search' ? 'scale-110 text-rose-600 dark:text-rose-400' : ''}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'ডোনার' : 'Donors'}
          </span>
          {activeTab === 'search' && (
            <div className="w-4 h-0.5 rounded-full bg-rose-600 dark:bg-rose-400 mt-0.5" />
          )}
        </button>

        {/* Center Elevated Action Button (Emergency SOS Blood Request FAB) */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-4 relative">
          <button
            type="button"
            onClick={onOpenSOSModal}
            title={lang === 'bn' ? 'জরুরি রক্তের আবেদন করুন' : 'Post Blood Request'}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/35 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-white dark:ring-[#0f172a]"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 mt-0.5 tracking-tight">
            {lang === 'bn' ? 'জরুরি SOS' : 'SOS'}
          </span>
        </div>

        {/* Tab 3: Map Radar */}
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex flex-col items-center justify-center h-full py-1 cursor-pointer active:scale-95 transition-all relative ${
            activeTab === 'map'
              ? 'text-rose-600 dark:text-rose-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <MapPin className={`w-5 h-5 transition-transform ${activeTab === 'map' ? 'scale-110 text-rose-600 dark:text-rose-400' : ''}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'ম্যাপ' : 'Map'}
          </span>
          {activeTab === 'map' && (
            <div className="w-4 h-0.5 rounded-full bg-rose-600 dark:bg-rose-400 mt-0.5" />
          )}
        </button>

        {/* Tab 4: Chat & Messages */}
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex flex-col items-center justify-center h-full py-1 cursor-pointer active:scale-95 transition-all relative ${
            activeTab === 'chat'
              ? 'text-rose-600 dark:text-rose-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 transition-transform ${activeTab === 'chat' ? 'scale-110 text-rose-600 dark:text-rose-400' : ''}`} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'মেসেজ' : 'Chat'}
          </span>
          {activeTab === 'chat' && (
            <div className="w-4 h-0.5 rounded-full bg-rose-600 dark:bg-rose-400 mt-0.5" />
          )}
        </button>

        {/* Tab 5: Profile & Badges */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex flex-col items-center justify-center h-full py-1 cursor-pointer active:scale-95 transition-all relative ${
            activeTab === 'profile'
              ? 'text-rose-600 dark:text-rose-400 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
          }`}
        >
          <User className={`w-5 h-5 transition-transform ${activeTab === 'profile' ? 'scale-110 text-rose-600 dark:text-rose-400' : ''}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">
            {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </span>
          {activeTab === 'profile' && (
            <div className="w-4 h-0.5 rounded-full bg-rose-600 dark:bg-rose-400 mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
