import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BloodGroup, Donor, Language, UserAccount } from '../../types';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  isUserVerifiedForWrites,
  parseFirebaseAuthError,
  DEFAULT_AVATAR_DATA_URI,
  subscribeCommunityMessages,
  sendCommunityMessageInFirestore,
  deleteCommunityMessageInFirestore,
  subscribeMyDirectChats,
  subscribeDirectChatMessages,
  sendDirectMessageInFirestore,
  buildDirectChatId,
  buildWhatsAppChatUrl,
  sanitizeFirestoreIdPart,
  CommunityMessageItem,
  DirectChatRoomItem,
  DirectMessageItem,
  User as FirebaseUser,
} from '../../firebase';
import {
  Send,
  Phone,
  ArrowLeft,
  CheckCheck,
  Search,
  MessageSquare,
  Users,
  Reply,
  X,
  Trash2,
  ExternalLink,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface DonorChatViewProps {
  lang: Language;
  donors?: Donor[];
  initialDonor?: Donor | null;
  onClearInitialDonor?: () => void;
  onOpenAuthModal?: () => void;
  onOpenRegister?: () => void;
}

interface ActivePeerTarget {
  peerUid: string;
  peerName: string;
  peerGroup: BloodGroup;
  peerAvatar: string;
  peerWhatsapp: string;
  peerFb: string;
  peerSubtitle: string;
  chatId: string;
}

const COMMUNITY_ROOM_ID = '__COMMUNITY_LIVE__';

const QUICK_EMOJIS = ['👍', '❤️', '🙏', '🩸', '🏥', '✅', '🤲', '⚡'];

export const DonorChatView: React.FC<DonorChatViewProps> = ({
  lang,
  donors = [],
  initialDonor,
  onClearInitialDonor,
  onOpenAuthModal,
  onOpenRegister,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Live Auth & Current User Profile
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    const syncProfile = () => {
      try {
        const saved = localStorage.getItem('bloodsearch_current_user');
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch {}
    };
    window.addEventListener('bloodsearch_user_changed', syncProfile);
    return () => {
      unsubAuth();
      window.removeEventListener('bloodsearch_user_changed', syncProfile);
    };
  }, []);

  const myUid = firebaseUser?.uid || '';
  const isVerifiedSignedIn = Boolean(firebaseUser && isUserVerifiedForWrites(firebaseUser));
  const myName =
    currentUser?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    (lang === 'bn' ? 'রক্তযোদ্ধা' : 'Blood Donor');
  const myGroup: BloodGroup = currentUser?.bloodGroup || 'B+';
  const myAvatar = currentUser?.photoUrl || firebaseUser?.photoURL || DEFAULT_AVATAR_DATA_URI;
  const myDistrict = currentUser?.district || 'ঢাকা';
  const myWhatsapp = currentUser?.whatsappPhone || currentUser?.phone || firebaseUser?.phoneNumber || '';
  const myFb = currentUser?.facebookUrl || '';

  // Sidebar Tabs: 'inbox' (Live Community + My Direct Chats) vs 'directory' (All Registered Users/Donors)
  const [sidebarTab, setSidebarTab] = useState<'inbox' | 'directory'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Room Selection: COMMUNITY_ROOM_ID or a Direct Chat Room
  const [selectedRoomId, setSelectedRoomId] = useState<string>(COMMUNITY_ROOM_ID);
  const [activePeer, setActivePeer] = useState<ActivePeerTarget | null>(null);
  const [showMobileRoom, setShowMobileRoom] = useState<boolean>(false);

  // Real-time Firestore Data Streams
  const [communityMessages, setCommunityMessages] = useState<CommunityMessageItem[]>([]);
  const [directRooms, setDirectRooms] = useState<DirectChatRoomItem[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessageItem[]>([]);

  // Composer State (Unlimited text!)
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ name: string; text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [syncWhatsAppOnSend, setSyncWhatsAppOnSend] = useState(false);

  // 1. Subscribe to Global Real-Time Community Messages
  useEffect(() => {
    const unsub = subscribeCommunityMessages((msgs) => {
      setCommunityMessages(msgs);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to My Real-Time 1-to-1 Direct Chat Rooms
  useEffect(() => {
    if (!myUid) {
      setDirectRooms([]);
      return;
    }
    const unsub = subscribeMyDirectChats(myUid, (rooms) => {
      setDirectRooms(rooms);
    });
    return () => unsub();
  }, [myUid]);

  // Keep activePeer.chatId synchronized if user signs in while viewing a 1-to-1 room
  useEffect(() => {
    if (!myUid || !activePeer) return;
    const realChatId = buildDirectChatId(myUid, activePeer.peerUid);
    if (activePeer.chatId !== realChatId) {
      setActivePeer((prev) => (prev ? { ...prev, chatId: realChatId } : null));
      setSelectedRoomId((prev) => (prev === COMMUNITY_ROOM_ID ? prev : realChatId));
    }
  }, [myUid, activePeer?.peerUid, activePeer?.chatId]);

  // 3. Subscribe to Active 1-to-1 Direct Room Messages
  useEffect(() => {
    if (selectedRoomId === COMMUNITY_ROOM_ID || !activePeer || !myUid) {
      setDirectMessages([]);
      return;
    }
    const realChatId = buildDirectChatId(myUid, activePeer.peerUid);
    const matchedRoom = directRooms.find((r) => r.id === realChatId);
    const sorted = [sanitizeFirestoreIdPart(myUid), sanitizeFirestoreIdPart(activePeer.peerUid)].sort();
    const p1Uid = matchedRoom ? matchedRoom.participantOneUid : sorted[0];

    const unsub = subscribeDirectChatMessages(realChatId, myUid, p1Uid, (msgs) => {
      setDirectMessages(msgs);
    });
    return () => unsub();
  }, [selectedRoomId, activePeer?.chatId, activePeer?.peerUid, myUid, directRooms]);

  // Keep activePeer enriched with live WhatsApp/FB if the other user replied in Firestore
  const enrichedPeer = useMemo<ActivePeerTarget | null>(() => {
    if (!activePeer) return null;
    const room = directRooms.find((r) => r.id === activePeer.chatId);
    if (!room) return activePeer;
    const peerIsOne = room.participantOneUid !== myUid;
    return {
      ...activePeer,
      peerName: (peerIsOne ? room.participantOneName : room.participantTwoName) || activePeer.peerName,
      peerGroup: (peerIsOne ? room.participantOneGroup : room.participantTwoGroup) || activePeer.peerGroup,
      peerAvatar: (peerIsOne ? room.participantOneAvatar : room.participantTwoAvatar) || activePeer.peerAvatar,
      peerWhatsapp:
        (peerIsOne ? room.participantOneWhatsapp : room.participantTwoWhatsapp) || activePeer.peerWhatsapp,
      peerFb: (peerIsOne ? room.participantOneFb : room.participantTwoFb) || activePeer.peerFb,
    };
  }, [activePeer, directRooms, myUid]);

  // Open 1-to-1 chat with any Donor / User
  const openDirectChatWithUser = (target: {
    uid: string;
    name: string;
    bloodGroup: BloodGroup;
    avatar?: string;
    whatsapp?: string;
    fb?: string;
    subtitle?: string;
  }) => {
    const cleanPeerUid = sanitizeFirestoreIdPart(target.uid);
    if (myUid && cleanPeerUid === myUid) {
      setChatError(
        lang === 'bn'
          ? 'এটি আপনার নিজের প্রোফাইল! অন্য যেকোনো রক্তদাতা বা ইউজারের সাথে ১-টু-১ চ্যাট করুন।'
          : 'This is your own profile! Pick another user or donor to start a 1-to-1 chat.'
      );
      return;
    }
    setChatError(null);
    const effectiveMyUid = myUid || 'guest';
    const chatId = buildDirectChatId(effectiveMyUid, cleanPeerUid);
    setActivePeer({
      peerUid: cleanPeerUid,
      peerName: target.name,
      peerGroup: target.bloodGroup,
      peerAvatar: target.avatar || DEFAULT_AVATAR_DATA_URI,
      peerWhatsapp: target.whatsapp || '',
      peerFb: target.fb || '',
      peerSubtitle: target.subtitle || (lang === 'bn' ? 'স্বেচ্ছাসেবী রক্তদাতা' : 'Voluntary Donor'),
      chatId,
    });
    setSelectedRoomId(chatId);
    setShowMobileRoom(true);
    setReplyingTo(null);
  };

  // Handle incoming donor from DonorSearch or Map
  useEffect(() => {
    if (initialDonor) {
      openDirectChatWithUser({
        uid: initialDonor.id,
        name: initialDonor.name,
        bloodGroup: initialDonor.bloodGroup,
        avatar: initialDonor.avatar,
        whatsapp: initialDonor.whatsappPhone || initialDonor.phone,
        fb: initialDonor.facebookUrl,
        subtitle: initialDonor.hospitalAffiliation || `${initialDonor.upazila}, ${initialDonor.district}`,
      });
      if (onClearInitialDonor) {
        onClearInitialDonor();
      }
    }
  }, [initialDonor]);

  // Smooth scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [communityMessages.length, directMessages.length, selectedRoomId]);

  // Synchronous 1-click Google login inside chat so popup is never blocked
  const handleInstantGoogleSignIn = () => {
    const p = signInWithGoogleReal();
    setChatError(null);
    p.catch((err) => {
      const parsed = parseFirebaseAuthError(err);
      setChatError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    if (!isVerifiedSignedIn) {
      setChatError(
        lang === 'bn'
          ? 'লাইভ চ্যাট পাঠাতে নিচের সবুজ বাটনে চাপ দিয়ে আসল Gmail বা সিম দিয়ে ১-সেকেন্ডে লগইন করুন।'
          : 'Please sign in with Google/Gmail or Phone OTP below to send live messages.'
      );
      return;
    }

    setChatError(null);
    setIsSending(true);
    const textToSend = trimmed;
    const quote = replyingTo;
    setInputText('');
    setReplyingTo(null);

    try {
      if (selectedRoomId === COMMUNITY_ROOM_ID) {
        await sendCommunityMessageInFirestore({
          text: textToSend,
          senderName: myName,
          senderBloodGroup: myGroup,
          senderAvatar: myAvatar,
          senderDistrict: myDistrict,
          replyToName: quote?.name || '',
          replyToText: quote?.text || '',
        });
      } else if (enrichedPeer) {
        const realChatId = await sendDirectMessageInFirestore({
          myName,
          myGroup,
          myAvatar,
          myWhatsapp,
          myFb,
          peerUid: enrichedPeer.peerUid,
          peerName: enrichedPeer.peerName,
          peerGroup: enrichedPeer.peerGroup,
          peerAvatar: enrichedPeer.peerAvatar,
          peerWhatsapp: enrichedPeer.peerWhatsapp,
          peerFb: enrichedPeer.peerFb,
          text: textToSend,
          replyToText: quote ? `${quote.name}: ${quote.text}` : '',
        });
        if (realChatId && realChatId !== selectedRoomId) {
          setSelectedRoomId(realChatId);
        }

        // If user enabled "WhatsApp Sync", also open WhatsApp chat via anchor click
        if (syncWhatsAppOnSend) {
          const waHref = buildWhatsAppChatUrl(enrichedPeer.peerWhatsapp, textToSend);
          const link = document.createElement('a');
          link.href = waHref;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err: any) {
      setInputText(textToSend);
      if (String(err?.message).includes('SELF_CHAT_NOT_ALLOWED')) {
        setChatError(
          lang === 'bn'
            ? 'নিজের আইডিতে মেসেজ পাঠানো যাবে না। অন্য রক্তদাতা নির্বাচন করুন।'
            : 'Cannot send direct message to yourself.'
        );
      } else {
        setChatError(
          lang === 'bn'
            ? 'বার্তা পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ বা লগইন চেক করে আবার চেষ্টা করুন।'
            : 'Could not send message. Please verify your login and retry.'
        );
      }
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Filtered Direct Rooms & Directory Users
  const filteredDirectRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return directRooms;
    return directRooms.filter((r) => {
      const peerIsOne = r.participantOneUid !== myUid;
      const pName = (peerIsOne ? r.participantOneName : r.participantTwoName).toLowerCase();
      const pGrp = (peerIsOne ? r.participantOneGroup : r.participantTwoGroup).toLowerCase();
      return pName.includes(q) || pGrp.includes(q) || r.lastMessage.toLowerCase().includes(q);
    });
  }, [directRooms, searchQuery, myUid]);

  const filteredDirectoryDonors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = donors.filter((d) => sanitizeFirestoreIdPart(d.id) !== myUid);
    if (!q) return list;
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.bloodGroup.toLowerCase().includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.upazila.toLowerCase().includes(q)
    );
  }, [donors, searchQuery, myUid]);

  const isCommunityActive = selectedRoomId === COMMUNITY_ROOM_ID;
  const activeWaHref = useMemo(() => {
    const draft =
      inputText.trim() ||
      (isCommunityActive
        ? `আসসালামু আলাইকুম, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে জরুরি রক্তের বিষয়ে যোগাযোগ করছি।`
        : `আসসালামু আলাইকুম ${enrichedPeer?.peerName || ''}, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে ${enrichedPeer?.peerGroup || ''} রক্তের বিষয়ে আপনার সাথে যোগাযোগ করছি।`);
    return buildWhatsAppChatUrl(isCommunityActive ? '' : enrichedPeer?.peerWhatsapp, draft);
  }, [isCommunityActive, enrichedPeer, inputText]);

  return (
    <div className="bg-white dark:bg-[#111b21] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-300 dark:border-slate-700 h-[calc(100dvh-146px)] min-h-[420px] max-h-[720px] flex flex-col @2xl:flex-row text-left">
      {/* ===================================================================== */}
      {/* LEFT PANE: WHATSAPP-STYLE INBOX & USER DIRECTORY                      */}
      {/* ===================================================================== */}
      <div
        className={`w-full @2xl:w-80 border-b @2xl:border-b-0 @2xl:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-white dark:bg-[#111b21] ${
          showMobileRoom ? 'hidden @2xl:flex' : 'flex h-full'
        }`}
      >
        {/* Top Green WhatsApp-Inspired Header */}
        <div className="p-3.5 bg-[#075e54] dark:bg-[#1f2c34] text-white space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#25D366] text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                <MessageSquare className="w-5 h-5 fill-slate-950" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black leading-tight truncate">
                  {lang === 'bn' ? 'BloodSearch মেসেঞ্জার' : 'BloodSearch Messenger'}
                </h2>
                <span className="text-[10px] text-emerald-200 font-semibold block truncate">
                  {lang === 'bn'
                    ? 'আনলিমিটেড ইউজার-টু-ইউজার ও WhatsApp চ্যাট'
                    : 'Unlimited User-to-User & WhatsApp Sync'}
                </span>
              </div>
            </div>

            {!isVerifiedSignedIn && (
              <button
                type="button"
                onClick={onOpenAuthModal || handleInstantGoogleSignIn}
                className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer shrink-0 shadow-xs"
              >
                {lang === 'bn' ? 'লগইন' : 'Login'}
              </button>
            )}
          </div>

          {/* 2 Segmented Tabs: Inbox vs All Users/Donors */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/25 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSidebarTab('inbox')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                sidebarTab === 'inbox'
                  ? 'bg-white text-[#075e54] shadow-xs font-black'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'চ্যাট ইনবক্স' : 'Chats'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('directory')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                sidebarTab === 'directory'
                  ? 'bg-white text-[#075e54] shadow-xs font-black'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn' ? `সকল ইউজার (${donors.length})` : `Users (${donors.length})`}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'নাম, ব্লাড গ্রুপ বা জেলা দিয়ে খুঁজুন...'
                  : 'Search name, blood group, district...'
              }
              className="w-full h-8 pl-8 pr-2.5 text-xs rounded-xl bg-white dark:bg-[#2a3942] text-slate-900 dark:text-white border-0 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto modal-scroll-contain divide-y divide-slate-100 dark:divide-slate-800/70">
          {sidebarTab === 'inbox' ? (
            <>
              {/* Pinned Global Live Community Room */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoomId(COMMUNITY_ROOM_ID);
                  setActivePeer(null);
                  setShowMobileRoom(true);
                  setReplyingTo(null);
                }}
                className={`w-full p-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  isCommunityActive
                    ? 'bg-emerald-50/90 dark:bg-[#202c33]'
                    : 'hover:bg-slate-50 dark:hover:bg-[#202c33]/60'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#075e54] to-[#25D366] text-white flex items-center justify-center font-black text-base shadow-xs">
                    🇧🇩
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#25D366] ring-2 ring-white dark:ring-[#111b21]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                      {lang === 'bn'
                        ? 'সবার উন্মুক্ত লাইভ চ্যাট (BD Live)'
                        : 'Bangladesh Live Community Chat'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#25D366] shrink-0">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {communityMessages.length > 0
                      ? `${communityMessages[communityMessages.length - 1].senderName}: ${communityMessages[communityMessages.length - 1].text}`
                      : lang === 'bn'
                      ? 'সকল রক্তদাতা ও রোগীর সাথে সরাসরি কথা বলুন...'
                      : 'Chat live with all donors & recipients...'}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {lang === 'bn'
                      ? `${communityMessages.length}টি লাইভ বার্তা · যেকোনো ইউজারে ট্যাপ করে ইনবক্স করুন`
                      : `${communityMessages.length} live messages · Tap any user to DM`}
                  </div>
                </div>
              </button>

              {/* My 1-to-1 Direct User-to-User Conversations */}
              {filteredDirectRooms.map((room) => {
                const peerIsOne = room.participantOneUid !== myUid;
                const pUid = peerIsOne ? room.participantOneUid : room.participantTwoUid;
                const pName = peerIsOne ? room.participantOneName : room.participantTwoName;
                const pGrp = peerIsOne ? room.participantOneGroup : room.participantTwoGroup;
                const pAvatar = peerIsOne ? room.participantOneAvatar : room.participantTwoAvatar;
                const pWa = peerIsOne ? room.participantOneWhatsapp : room.participantTwoWhatsapp;
                const pFb = peerIsOne ? room.participantOneFb : room.participantTwoFb;
                const isSelected = selectedRoomId === room.id;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() =>
                      openDirectChatWithUser({
                        uid: pUid,
                        name: pName,
                        bloodGroup: pGrp,
                        avatar: pAvatar,
                        whatsapp: pWa,
                        fb: pFb,
                        subtitle: lang === 'bn' ? 'ব্যক্তিগত ১-টু-১ চ্যাট' : 'Direct 1-to-1 Chat',
                      })
                    }
                    className={`w-full p-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 dark:bg-[#202c33]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#202c33]/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={pAvatar || DEFAULT_AVATAR_DATA_URI}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                        }}
                        alt={pName}
                        className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 px-1 rounded bg-rose-600 text-white text-[9px] font-black">
                        {pGrp}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {pName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {room.timeLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {room.lastSenderUid === myUid ? '✓✓ আপনি: ' : ''}
                        {room.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Prompt to pick a user if no 1-to-1 chats started yet */}
              {filteredDirectRooms.length === 0 && (
                <div className="p-4 text-center space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'যেকোনো রক্তদাতা বা ইউজারের সাথে ব্যক্তিগত (User-to-User) চ্যাট বা WhatsApp শুরু করতে নিচের বাটনে চাপুন:'
                      : 'Start a private User-to-User or WhatsApp chat with any registered donor:'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('directory')}
                    className="px-3.5 py-2 rounded-xl bg-[#075e54] hover:bg-[#128c7e] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'bn' ? 'সকল ইউজার ও রক্তদাতা দেখুন →' : 'Browse Users & Donors →'}
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* DIRECTORY TAB: Start 1-to-1 In-App Chat or Direct WhatsApp with Any Donor */
            filteredDirectoryDonors.map((d) => {
              const waUrl = buildWhatsAppChatUrl(
                d.whatsappPhone || d.phone,
                `আসসালামু আলাইকুম ${d.name}, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে জরুরি ${d.bloodGroup} রক্তের বিষয়ে যোগাযোগ করছি।`
              );
              return (
                <div
                  key={d.id}
                  className="p-3 flex items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-[#202c33]/60 transition-colors"
                >
                  <div
                    onClick={() =>
                      openDirectChatWithUser({
                        uid: d.id,
                        name: d.name,
                        bloodGroup: d.bloodGroup,
                        avatar: d.avatar,
                        whatsapp: d.whatsappPhone || d.phone,
                        fb: d.facebookUrl,
                        subtitle: `${d.upazila}, ${d.district}`,
                      })
                    }
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={d.avatar || DEFAULT_AVATAR_DATA_URI}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                        }}
                        alt={d.name}
                        className="w-10 h-10 rounded-2xl object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 px-1 rounded bg-rose-600 text-white text-[9px] font-black">
                        {d.bloodGroup}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {d.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {d.upazila}, {d.district}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        openDirectChatWithUser({
                          uid: d.id,
                          name: d.name,
                          bloodGroup: d.bloodGroup,
                          avatar: d.avatar,
                          whatsapp: d.whatsappPhone || d.phone,
                          fb: d.facebookUrl,
                          subtitle: `${d.upazila}, ${d.district}`,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-black text-white font-bold text-[11px] cursor-pointer"
                    >
                      {lang === 'bn' ? 'চ্যাট' : 'Chat'}
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-black text-[11px] cursor-pointer"
                      title="WhatsApp-এ সরাসরি চ্যাট করুন"
                    >
                      WA
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT PANE: WHATSAPP-STYLE ACTIVE LIVE CHAT STREAM                    */}
      {/* ===================================================================== */}
      <div
        className={`flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] min-w-0 ${
          !showMobileRoom ? 'hidden @2xl:flex' : 'flex'
        }`}
      >
        {/* Active Room Header */}
        <div className="px-3 py-2.5 bg-[#075e54] dark:bg-[#202c33] text-white flex items-center justify-between gap-2 shadow-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setShowMobileRoom(false)}
              className="@2xl:hidden p-1.5 -ml-1 rounded-lg text-white hover:bg-white/10 cursor-pointer shrink-0"
              title="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {isCommunityActive ? (
              <div className="w-9 h-9 rounded-2xl bg-[#25D366] text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                🇧🇩
              </div>
            ) : (
              <img
                src={enrichedPeer?.peerAvatar || DEFAULT_AVATAR_DATA_URI}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                }}
                alt={enrichedPeer?.peerName || 'User'}
                className="w-9 h-9 rounded-2xl object-cover ring-2 ring-white/25 shrink-0"
              />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs @md:text-sm text-white truncate">
                  {isCommunityActive
                    ? lang === 'bn'
                      ? 'সবার উন্মুক্ত লাইভ চ্যাট (BD)'
                      : 'BD Live Community Chat'
                    : enrichedPeer?.peerName}
                </h3>
                {!isCommunityActive && enrichedPeer && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[10px] shrink-0">
                    {enrichedPeer.peerGroup}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-100 truncate">
                {isCommunityActive
                  ? lang === 'bn'
                    ? 'আনলিমিটেড লাইভ চ্যাট · নামের ওপর ক্লিক করে ব্যক্তিগত মেসেজ দিন'
                    : 'Unlimited live chat · Tap any name for 1-to-1 DM'
                  : enrichedPeer?.peerSubtitle || (lang === 'bn' ? 'রিয়েল-টাইম ক্লাউড চ্যাট' : 'Live Cloud Chat')}
              </p>
            </div>
          </div>

          {/* Direct WhatsApp, Facebook & Phone Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={activeWaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              title="WhatsApp-এ কানেক্ট করুন"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {!isCommunityActive && enrichedPeer?.peerFb && (
              <a
                href={
                  enrichedPeer.peerFb.startsWith('http')
                    ? enrichedPeer.peerFb
                    : `https://${enrichedPeer.peerFb}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                title="Facebook প্রোফাইল"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {!isCommunityActive &&
              enrichedPeer?.peerWhatsapp &&
              !enrichedPeer.peerWhatsapp.includes('*') &&
              !enrichedPeer.peerWhatsapp.includes('X') && (
                <a
                  href={`tel:${enrichedPeer.peerWhatsapp}`}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="সরাসরি কল করুন"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
          </div>
        </div>

        {/* Message Canvas */}
        <div className="flex-1 overflow-y-auto modal-scroll-contain p-3 @md:p-4 space-y-2.5">
          {/* Encryption / Info Note */}
          <div className="text-center my-1">
            <span className="inline-block text-[11px] font-semibold text-slate-700 dark:text-amber-200/90 bg-[#fff5c4] dark:bg-[#182229] px-3 py-1 rounded-xl shadow-2xs max-w-[92%]">
              {isCommunityActive
                ? lang === 'bn'
                  ? '🔓 এটি লাইভ কমিউনিটি রুম — আপনার মেসেজ সকল অনলাইন ইউজার সাথে সাথে দেখতে পাবেন। কোনো লিমিট নেই, যা ইচ্ছা লিখুন!'
                  : '🔓 Live Community Room — Real users see your messages instantly with zero limits!'
                : lang === 'bn'
                ? '🔒 ব্যক্তিগত ইউজার-টু-ইউজার চ্যাট — শুধুমাত্র আপনি এবং অপর পক্ষ এই মেসেজ দেখতে পাবেন। উপরের WhatsApp বাটনে চাপলে সরাসরি WhatsApp-এও কথা বলতে পারবেন।'
                : '🔒 Private 1-to-1 User-to-User Chat — Isolated strictly to both participants + 1-tap WhatsApp connect.'}
            </span>
          </div>

          {/* Render Community Stream */}
          {isCommunityActive &&
            (communityMessages.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'প্রথম লাইভ বার্তাটি আপনিই পাঠান! (যেমন: সালাম বা রক্তের গ্রুপ জানান)'
                    : 'Send the first live message to the community!'}
                </p>
              </div>
            ) : (
              communityMessages.map((msg) => {
                const isMe = Boolean(myUid && msg.senderUid === myUid);
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[86%] @md:max-w-md rounded-2xl px-3 py-2 shadow-xs text-xs @md:text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none'
                          : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {/* Sender Header for Others (Clickable to start 1-to-1 User-to-User Chat!) */}
                      {!isMe && (
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() =>
                              openDirectChatWithUser({
                                uid: msg.senderUid,
                                name: msg.senderName,
                                bloodGroup: msg.senderBloodGroup,
                                avatar: msg.senderAvatar,
                                subtitle: msg.senderDistrict || 'BloodSearch User',
                              })
                            }
                            className="font-black text-[11px] text-emerald-700 dark:text-[#25D366] hover:underline cursor-pointer flex items-center gap-1"
                            title="এই ইউজারের সাথে ১-টু-১ ব্যক্তিগত চ্যাট শুরু করুন"
                          >
                            <span>{msg.senderName}</span>
                            <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px]">
                              {msg.senderBloodGroup}
                            </span>
                          </button>
                          {msg.senderDistrict && (
                            <span className="text-[10px] text-slate-400">{msg.senderDistrict}</span>
                          )}
                        </div>
                      )}

                      {/* Quoted Reply Box */}
                      {msg.replyToText && (
                        <div className="mb-1.5 p-1.5 rounded-lg bg-black/5 dark:bg-black/25 border-l-3 border-emerald-600 text-[11px] opacity-90">
                          {msg.replyToName && (
                            <span className="font-bold block text-emerald-700 dark:text-emerald-400">
                              {msg.replyToName}
                            </span>
                          )}
                          <span className="line-clamp-2">{msg.replyToText}</span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap select-text">{msg.text}</p>

                      {/* Bubble Footer: Time, Ticks, Reply & WhatsApp Forward */}
                      <div className="flex items-center justify-end gap-2 mt-1 text-[10px] text-slate-500 dark:text-emerald-100/70">
                        <button
                          type="button"
                          onClick={() => setReplyingTo({ name: msg.senderName, text: msg.text })}
                          className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="উত্তর দিন (Reply)"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                        <a
                          href={buildWhatsAppChatUrl('', msg.text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-700 dark:text-[#25D366] hover:underline"
                          title="WhatsApp-এ ফরোয়ার্ড করুন"
                        >
                          WA
                        </a>
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => deleteCommunityMessageInFirestore(msg.id).catch(() => {})}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <span className="font-mono">{msg.timeLabel}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-500" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ))}

          {/* Render 1-to-1 Direct User-to-User Stream */}
          {!isCommunityActive &&
            (directMessages.length === 0 ? (
              <div className="py-10 text-center space-y-2.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn'
                    ? `${enrichedPeer?.peerName || 'রক্তদাতা'}-কে আপনার বার্তা লিখুন — অথবা সরাসরি WhatsApp-এ মেসেজ পাঠান!`
                    : `Send a live message to ${enrichedPeer?.peerName || 'this donor'} or connect on WhatsApp!`}
                </p>
                <a
                  href={activeWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-xs"
                >
                  <span>📲 সরাসরি WhatsApp-এ চ্যাট শুরু করুন</span>
                </a>
              </div>
            ) : (
              directMessages.map((msg) => {
                const isMe = Boolean(myUid && msg.senderUid === myUid);
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[86%] @md:max-w-md rounded-2xl px-3 py-2 shadow-xs text-xs @md:text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none'
                          : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {msg.replyToText && (
                        <div className="mb-1.5 p-1.5 rounded-lg bg-black/5 dark:bg-black/25 border-l-3 border-emerald-600 text-[11px] opacity-90">
                          <span className="line-clamp-2">{msg.replyToText}</span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap select-text">{msg.text}</p>

                      <div className="flex items-center justify-end gap-2 mt-1 text-[10px] text-slate-500 dark:text-emerald-100/70">
                        <button
                          type="button"
                          onClick={() =>
                            setReplyingTo({
                              name: isMe ? myName : enrichedPeer?.peerName || 'User',
                              text: msg.text,
                            })
                          }
                          className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="Reply"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                        <a
                          href={buildWhatsAppChatUrl(enrichedPeer?.peerWhatsapp, msg.text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-700 dark:text-[#25D366] hover:underline"
                          title="এই মেসেজটি সরাসরি WhatsApp-এও পাঠান"
                        >
                          WA
                        </a>
                        <span className="font-mono">{msg.timeLabel}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-500" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Error / Auth Prompt Banner */}
        {chatError && (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-900 flex items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300 font-bold">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{chatError}</span>
            </div>
            <button
              type="button"
              onClick={() => setChatError(null)}
              className="p-1 text-red-500 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Guest Fast Sign-In Strip (So unauthenticated users can log in with 1 tap and chat freely!) */}
        {!isVerifiedSignedIn && (
          <div className="px-3 py-2 bg-emerald-50 dark:bg-[#182229] border-t border-emerald-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {lang === 'bn'
                ? 'লাইভ চ্যাট করতে ১-ক্লিকে আসল Gmail দিয়ে যুক্ত হোন:'
                : 'Sign in with Gmail in 1 tap to send live messages:'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleInstantGoogleSignIn}
                className="px-3 py-1.5 rounded-lg bg-[#075e54] hover:bg-[#128c7e] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'Google লগইন' : 'Google Login'}</span>
              </button>
              {onOpenRegister && (
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'আইডি খুলুন' : 'Create ID'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reply Preview Strip */}
        {replyingTo && (
          <div className="px-3 py-1.5 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0 flex-1 border-l-3 border-[#25D366] pl-2">
              <span className="font-bold text-emerald-700 dark:text-[#25D366] block text-[11px]">
                {replyingTo.name}
              </span>
              <span className="text-slate-600 dark:text-slate-300 truncate block text-[11px]">
                {replyingTo.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Emoji + Quick Templates + WhatsApp Auto-Sync Toggle */}
        <div className="px-2.5 py-1.5 bg-white/95 dark:bg-[#1f2c34] border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          {!isCommunityActive && (
            <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-[#25D366] font-bold shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={syncWhatsAppOnSend}
                onChange={(e) => setSyncWhatsAppOnSend(e.target.checked)}
                className="w-3 h-3 accent-emerald-600"
              />
              <span>WhatsApp সিঙ্ক</span>
            </label>
          )}

          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setInputText((prev) => `${prev}${em}`)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 text-sm"
            >
              {em}
            </button>
          ))}

          {[
            'আসসালামু আলাইকুম, জরুরি রক্ত প্রয়োজন',
            'রোগী কোন হাসপাতালে আছেন?',
            'আমি রক্ত দিতে প্রস্তুত আছি',
            'WhatsApp-এ লোকেশন পাঠান',
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(chip)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#2a3942] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap cursor-pointer font-medium shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* WhatsApp-Style Unlimited Message Composer */}
        <form
          onSubmit={handleSendMessage}
          className="p-2 @md:p-2.5 bg-[#f0f2f5] dark:bg-[#202c33] flex items-end gap-2 shrink-0"
        >
          <textarea
            ref={inputRef}
            rows={1}
            placeholder={
              lang === 'bn'
                ? 'মেসেজ লিখুন (কোনো লিমিট নেই — যা ইচ্ছা লিখুন)...'
                : 'Type any message (unlimited)...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 min-h-[42px] max-h-28 py-2.5 px-3.5 text-xs @md:text-sm rounded-2xl bg-white dark:bg-[#2a3942] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#128c7e] resize-none placeholder:text-slate-400"
          />

          {/* 1-Tap Direct Send to WhatsApp with Current Input Text */}
          <a
            href={activeWaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="h-[42px] px-3 rounded-2xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer shrink-0 transition-colors"
            title="এই মেসেজটি সরাসরি WhatsApp-এ পাঠান"
          >
            <span>WA</span>
          </a>

          {/* Primary Real-Time Cloud Send Button */}
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="w-[42px] h-[42px] rounded-2xl bg-[#075e54] hover:bg-[#128c7e] disabled:opacity-50 text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer shrink-0"
            title="লাইভ চ্যাটে পাঠান"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
