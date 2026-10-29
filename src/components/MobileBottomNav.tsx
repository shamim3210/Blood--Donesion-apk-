import React from 'react';
import { ActiveTab, Language } from '../types';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';

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
  unreadSosCount = 0,
  unreadChatCount = 0,
  onOpenSOSModal,
}) => {
  return (
    <nav
      aria-label="Primary Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-[#091120]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-6px_24px_rgba(11,34,57,0.08)] pb-safe transition-colors"
    >
      <div className="max-w-lg mx-auto h-16 px-2 grid grid-cols-5 items-center gap-1">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'home'
              ? 'text-[#dc2626] dark:text-rose-400 bg-rose-50/95 dark:bg-rose-950/40 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#0b2239] dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
          <span className="text-[11px] leading-tight">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* 2. Search Donors */}
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'search' || activeTab === 'onboarding'
              ? 'text-[#dc2626] dark:text-rose-400 bg-rose-50/95 dark:bg-rose-950/40 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-[#0b2239] dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Search
            className={`w-5 h-5 ${
              activeTab === 'search' || activeTab === 'onboarding'
                ? 'stroke-[2.4]'
                : 'stroke-[1.9]'
            }`}
          />
          <span className="text-[11px] leading-tight">
            {lang === 'bn' ? 'ডোনার খুঁজুন' : 'Donors'}
          </span>
        </button>

        {/* 3. Primary Emergency SOS Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenSOSModal}
            aria-label={lang === 'bn' ? 'জরুরি রক্তের আবেদন করুন' : 'Post Emergency Blood Request'}
            className="relative min-h-[48px] px-3.5 rounded-2xl btn-crimson flex flex-col items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-5 h-5 stroke-[2.3]" />
            <span className="text-[10px] font-black tracking-tight leading-none">
              {lang === 'bn' ? 'জরুরি SOS' : 'SOS'}
            </span>
            {unreadSosCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0b2239] dark:bg-amber-400 text-white dark:text-slate-950 text-[10px] font-bold tabular-nums flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadSosCount > 9 ? '9+' : unreadSosCount}
              </span>
            )}
          </button>
        </div>

        {/* 4. Live Chat */}
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`relative min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'chat'
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/30 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <MessageCircle
              className={`w-5 h-5 ${activeTab === 'chat' ? 'stroke-[2.4]' : 'stroke-[1.9]'}`}
            />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold tabular-nums flex items-center justify-center">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">
            {lang === 'bn' ? 'চ্যাট' : 'Chat'}
          </span>
        </button>

        {/* 5. Profile / Smart ID */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/30 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <User
            className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.4]' : 'stroke-[1.9]'}`}
          />
          <span className="text-[11px] leading-tight">
            {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};
