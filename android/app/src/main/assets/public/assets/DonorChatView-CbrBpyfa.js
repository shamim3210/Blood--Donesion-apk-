import { a as __toESM, n as createLucideIcon, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-C_MSr2-h.js";
import { $t as reverseGeocodeBangladeshCoords, A as compressChatAttachmentImage, An as MapPin, B as isUserVerifiedForWrites, C as auth, Cn as Phone, Dn as MessageSquare, E as checkActionCooldownGuard, En as MicOff, F as deleteDirectMessageInFirestore, H as onAuthStateChanged, J as parseFirebaseAuthError, L as getStoredDevOtpSandboxSession, N as deleteCommunityMessageInFirestore, Nn as LogIn, O as clearAllLocalSavedChats, P as deleteDirectChatRoomInFirestore, T as buildWhatsAppChatUrl, Tn as Mic, V as normalizeFacebookProfileUrl, Vn as ExternalLink, Xn as CircleAlert, Yt as requestFreshHighAccuracyGPS, ar as isFakePersonName, c as DEFAULT_AVATAR_DATA_URI, cn as X, gt as subscribeMyDirectChats, ir as isFakeIdentifier, kn as Megaphone, ln as Users, mt as subscribeDirectChatMessages, nr as ArrowLeft, nt as sendCommunityMessageInFirestore, pn as Trash2, pt as subscribeCommunityMessages, rt as sendDirectMessageInFirestore, st as signInWithGoogleReal, tt as sanitizeFirestoreIdPart, un as UserPlus, vn as Send, w as buildDirectChatId, xt as wipeAllMyDirectChatsInFirestore, yn as Search } from "./index-iojd0cJp.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CheckCheck = createLucideIcon("check-check", [["path", {
	d: "M18 6 7 17l-5-5",
	key: "116fxf"
}], ["path", {
	d: "m22 10-7.5 7.5L13 16",
	key: "ke71qq"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ImagePlus = createLucideIcon("image-plus", [
	["path", {
		d: "M16 5h6",
		key: "1vod17"
	}],
	["path", {
		d: "M19 2v6",
		key: "4bpg5p"
	}],
	["path", {
		d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",
		key: "1ue2ih"
	}],
	["path", {
		d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
		key: "1xmnt7"
	}],
	["circle", {
		cx: "9",
		cy: "9",
		r: "2",
		key: "af1f0g"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Reply = createLucideIcon("reply", [["path", {
	d: "M20 18v-2a4 4 0 0 0-4-4H4",
	key: "5vmcpk"
}], ["path", {
	d: "m9 17-5-5 5-5",
	key: "nvlc11"
}]]);
// src/components/donor/DonorChatView.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var COMMUNITY_ROOM_ID = "__COMMUNITY_LIVE__";
var QUICK_EMOJIS = [
	"👍",
	"❤️",
	"🙏",
	"🩸",
	"🏥",
	"✅",
	"🤲",
	"⚡"
];
var BLOOD_GROUPS = [
	"O-",
	"O+",
	"A-",
	"A+",
	"B-",
	"B+",
	"AB-",
	"AB+"
];
function parseRichChatText(rawText) {
	let body = rawText || "";
	let locationPin;
	let sosCard;
	const locMatch = body.match(/\[LOC:([0-9.-]+),([0-9.-]+)\|([^\]]+)\]/);
	if (locMatch) {
		const [, lat, lng, label] = locMatch;
		locationPin = {
			lat,
			lng,
			label: label.trim(),
			mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`
		};
		body = body.replace(locMatch[0], "").trim();
	}
	const sosMatch = body.match(/\[SOS:([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/);
	if (sosMatch) {
		const [, group, bags, hospital] = sosMatch;
		sosCard = {
			group: group.trim(),
			bags: bags.trim(),
			hospital: hospital.trim()
		};
		body = body.replace(sosMatch[0], "").trim();
	}
	return {
		cleanBody: body,
		locationPin,
		sosCard
	};
}
var DonorChatView = ({ lang, donors = [], initialDonor, onClearInitialDonor, onOpenAuthModal, onOpenRegister }) => {
	const messagesContainerRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const speechRecRef = (0, import_react.useRef)(null);
	const [firebaseUser, setFirebaseUser] = (0, import_react.useState)(auth.currentUser);
	const [devOtpSession, setDevOtpSession] = (0, import_react.useState)(() => getStoredDevOtpSandboxSession());
	const [currentUser, setCurrentUser] = (0, import_react.useState)(() => {
		try {
			const saved = localStorage.getItem("bloodsearch_current_user");
			if (saved) return JSON.parse(saved);
		} catch {}
		return null;
	});
	(0, import_react.useEffect)(() => {
		const unsubAuth = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
		const syncProfile = () => {
			try {
				const saved = localStorage.getItem("bloodsearch_current_user");
				setCurrentUser(saved ? JSON.parse(saved) : null);
			} catch {}
		};
		const syncDevOtp = () => {
			setDevOtpSession(getStoredDevOtpSandboxSession());
		};
		window.addEventListener("bloodsearch_user_changed", syncProfile);
		window.addEventListener("bloodsearch_dev_otp_changed", syncDevOtp);
		return () => {
			unsubAuth();
			window.removeEventListener("bloodsearch_user_changed", syncProfile);
			window.removeEventListener("bloodsearch_dev_otp_changed", syncDevOtp);
			if (speechRecRef.current) try {
				speechRecRef.current.stop();
			} catch {}
		};
	}, []);
	const cloudAuthUid = firebaseUser?.uid || "";
	const myUid = cloudAuthUid || devOtpSession?.uid || "";
	const isVerifiedSignedIn = Boolean(firebaseUser && isUserVerifiedForWrites(firebaseUser));
	const myName = (currentUser?.name && !isFakePersonName(currentUser.name) ? currentUser.name : "") || (firebaseUser?.displayName && !isFakePersonName(firebaseUser.displayName) ? firebaseUser.displayName : "") || firebaseUser?.email?.split("@")[0] || (devOtpSession ? `Donor (${devOtpSession.phoneLocal})` : "") || (lang === "bn" ? "রক্তযোদ্ধা" : "Blood Donor");
	const myGroup = currentUser?.bloodGroup || "B+";
	const myAvatar = currentUser?.photoUrl || firebaseUser?.photoURL || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E";
	const myDistrict = currentUser?.district || "ঢাকা";
	const myWhatsapp = currentUser?.whatsappPhone || currentUser?.phone || firebaseUser?.phoneNumber || devOtpSession?.phoneE164 || "";
	const myFb = currentUser?.facebookUrl || "";
	const [sidebarTab, setSidebarTab] = (0, import_react.useState)("inbox");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [selectedRoomId, setSelectedRoomId] = (0, import_react.useState)(COMMUNITY_ROOM_ID);
	const [activePeer, setActivePeer] = (0, import_react.useState)(null);
	const [showMobileRoom, setShowMobileRoom] = (0, import_react.useState)(false);
	const [communityMessages, setCommunityMessages] = (0, import_react.useState)([]);
	const [directRooms, setDirectRooms] = (0, import_react.useState)([]);
	const [directMessages, setDirectMessages] = (0, import_react.useState)([]);
	const [localSavedCommunity, setLocalSavedCommunity] = (0, import_react.useState)(() => {
		try {
			if (localStorage.getItem("bloodsearch_chat_zero_slate_v7") !== "done") {
				localStorage.removeItem("bloodsearch_saved_community_chat_v1");
				localStorage.removeItem("bloodsearch_saved_direct_chat_v1");
				localStorage.setItem("bloodsearch_chat_zero_slate_v7", "done");
				return [];
			}
			const raw = localStorage.getItem("bloodsearch_saved_community_chat_v1");
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	});
	const [localSavedDirectByRoom, setLocalSavedDirectByRoom] = (0, import_react.useState)(() => {
		try {
			const raw = localStorage.getItem("bloodsearch_saved_direct_chat_v1");
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	});
	const [inputText, setInputText] = (0, import_react.useState)("");
	const [pendingAttachment, setPendingAttachment] = (0, import_react.useState)("");
	const [isCompressingImage, setIsCompressingImage] = (0, import_react.useState)(false);
	const [isSharingGps, setIsSharingGps] = (0, import_react.useState)(false);
	const [isListeningVoice, setIsListeningVoice] = (0, import_react.useState)(false);
	const [showVoiceTemplates, setShowVoiceTemplates] = (0, import_react.useState)(false);
	const [showSosComposer, setShowSosComposer] = (0, import_react.useState)(false);
	const [sosDraftGroup, setSosDraftGroup] = (0, import_react.useState)("O+");
	const [sosDraftBags, setSosDraftBags] = (0, import_react.useState)("1");
	const [sosDraftHospital, setSosDraftHospital] = (0, import_react.useState)("");
	const [lightboxImage, setLightboxImage] = (0, import_react.useState)(null);
	const [replyingTo, setReplyingTo] = (0, import_react.useState)(null);
	const [isSending, setIsSending] = (0, import_react.useState)(false);
	const [chatError, setChatError] = (0, import_react.useState)(null);
	const [syncWhatsAppOnSend, setSyncWhatsAppOnSend] = (0, import_react.useState)(false);
	const [visibleMsgLimit, setVisibleMsgLimit] = (0, import_react.useState)(50);
	const [visibleDirLimit, setVisibleDirLimit] = (0, import_react.useState)(40);
	const [confirmClearAllChats, setConfirmClearAllChats] = (0, import_react.useState)(false);
	const [isWipingChats, setIsWipingChats] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const onLocalCleared = (ev) => {
			const roomId = ev?.detail?.roomId || "ALL";
			if (roomId === "ALL") {
				setLocalSavedCommunity([]);
				setLocalSavedDirectByRoom({});
			} else setLocalSavedDirectByRoom((prev) => {
				const next = { ...prev };
				delete next[roomId];
				return next;
			});
		};
		window.addEventListener("bloodsearch_local_chats_cleared", onLocalCleared);
		return () => window.removeEventListener("bloodsearch_local_chats_cleared", onLocalCleared);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!firebaseUser) return;
		const chatZeroKey = `bloodsearch_cloud_chat_zero_v7_${firebaseUser.uid}`;
		if (localStorage.getItem(chatZeroKey) === "done") return;
		localStorage.setItem(chatZeroKey, "done");
		clearAllLocalSavedChats();
		setDirectRooms([]);
		setDirectMessages([]);
		setActivePeer(null);
		setSelectedRoomId(COMMUNITY_ROOM_ID);
		wipeAllMyDirectChatsInFirestore(firebaseUser).catch(() => 0);
	}, [firebaseUser]);
	const handleDeleteDirectRoom = async (roomId, e) => {
		if (e) e.stopPropagation();
		setDirectRooms((prev) => prev.filter((r) => r.id !== roomId));
		setLocalSavedDirectByRoom((prev) => {
			const next = { ...prev };
			delete next[roomId];
			return next;
		});
		if (selectedRoomId === roomId || activePeer?.chatId === roomId) {
			setDirectMessages([]);
			setActivePeer(null);
			setSelectedRoomId(COMMUNITY_ROOM_ID);
			setShowMobileRoom(false);
		}
		await deleteDirectChatRoomInFirestore(roomId, firebaseUser).catch(() => false);
	};
	const handleClearAllChats = async () => {
		if (!confirmClearAllChats) {
			setConfirmClearAllChats(true);
			return;
		}
		setIsWipingChats(true);
		setConfirmClearAllChats(false);
		try {
			clearAllLocalSavedChats();
			setLocalSavedCommunity([]);
			setLocalSavedDirectByRoom({});
			setDirectRooms([]);
			setDirectMessages([]);
			setActivePeer(null);
			setSelectedRoomId(COMMUNITY_ROOM_ID);
			if (firebaseUser) await wipeAllMyDirectChatsInFirestore(firebaseUser).catch(() => 0);
		} finally {
			setIsWipingChats(false);
		}
	};
	const appendLocalCommunityMessage = (msg) => {
		setLocalSavedCommunity((prev) => {
			const next = [...prev.filter((m) => m.id !== msg.id), msg].slice(-80);
			try {
				localStorage.setItem("bloodsearch_saved_community_chat_v1", JSON.stringify(next));
			} catch {}
			return next;
		});
	};
	const appendLocalDirectMessage = (roomId, msg) => {
		setLocalSavedDirectByRoom((prev) => {
			const nextRoomList = [...(prev[roomId] || []).filter((m) => m.id !== msg.id), msg].slice(-80);
			const next = {
				...prev,
				[roomId]: nextRoomList
			};
			try {
				localStorage.setItem("bloodsearch_saved_direct_chat_v1", JSON.stringify(next));
			} catch {}
			return next;
		});
	};
	(0, import_react.useEffect)(() => {
		if (!cloudAuthUid) {
			setCommunityMessages([]);
			return;
		}
		const unsub = subscribeCommunityMessages((msgs) => {
			setCommunityMessages(msgs);
		});
		return () => unsub();
	}, [cloudAuthUid]);
	(0, import_react.useEffect)(() => {
		if (!cloudAuthUid) {
			setDirectRooms([]);
			return;
		}
		const unsub = subscribeMyDirectChats(cloudAuthUid, (rooms) => {
			setDirectRooms(rooms);
		});
		return () => unsub();
	}, [cloudAuthUid]);
	(0, import_react.useEffect)(() => {
		if (!myUid || !activePeer) return;
		const realChatId = buildDirectChatId(myUid, activePeer.peerUid);
		if (activePeer.chatId !== realChatId) {
			setActivePeer((prev) => prev ? {
				...prev,
				chatId: realChatId
			} : null);
			setSelectedRoomId((prev) => prev === COMMUNITY_ROOM_ID ? prev : realChatId);
		}
	}, [
		myUid,
		activePeer?.peerUid,
		activePeer?.chatId
	]);
	(0, import_react.useEffect)(() => {
		if (selectedRoomId === COMMUNITY_ROOM_ID || !activePeer || !cloudAuthUid) {
			setDirectMessages([]);
			return;
		}
		const realChatId = buildDirectChatId(cloudAuthUid, activePeer.peerUid);
		const matchedRoom = directRooms.find((r) => r.id === realChatId);
		const sorted = [sanitizeFirestoreIdPart(cloudAuthUid), sanitizeFirestoreIdPart(activePeer.peerUid)].sort();
		const p1Uid = matchedRoom ? matchedRoom.participantOneUid : sorted[0];
		const unsub = subscribeDirectChatMessages(realChatId, cloudAuthUid, p1Uid, (msgs) => {
			setDirectMessages(msgs);
		});
		return () => unsub();
	}, [
		selectedRoomId,
		activePeer?.chatId,
		activePeer?.peerUid,
		cloudAuthUid,
		directRooms
	]);
	const enrichedPeer = (0, import_react.useMemo)(() => {
		if (!activePeer) return null;
		const room = directRooms.find((r) => r.id === activePeer.chatId);
		if (!room) return activePeer;
		const peerIsOne = room.participantOneUid !== myUid;
		return {
			...activePeer,
			peerName: (peerIsOne ? room.participantOneName : room.participantTwoName) || activePeer.peerName,
			peerGroup: (peerIsOne ? room.participantOneGroup : room.participantTwoGroup) || activePeer.peerGroup,
			peerAvatar: (peerIsOne ? room.participantOneAvatar : room.participantTwoAvatar) || activePeer.peerAvatar,
			peerWhatsapp: (peerIsOne ? room.participantOneWhatsapp : room.participantTwoWhatsapp) || activePeer.peerWhatsapp,
			peerFb: (peerIsOne ? room.participantOneFb : room.participantTwoFb) || activePeer.peerFb
		};
	}, [
		activePeer,
		directRooms,
		myUid
	]);
	const openDirectChatWithUser = (target) => {
		const cleanPeerUid = sanitizeFirestoreIdPart(target.uid);
		if (myUid && cleanPeerUid === myUid) {
			setChatError(lang === "bn" ? "এটি আপনার নিজের প্রোফাইল! অন্য যেকোনো রক্তদাতা বা ইউজারের সাথে ১-টু-১ চ্যাট করুন।" : "This is your own profile! Pick another user or donor to start a 1-to-1 chat.");
			return;
		}
		setChatError(null);
		const chatId = buildDirectChatId(myUid || "guest", cleanPeerUid);
		setActivePeer({
			peerUid: cleanPeerUid,
			peerName: target.name,
			peerGroup: target.bloodGroup,
			peerAvatar: target.avatar || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E",
			peerWhatsapp: target.whatsapp || "",
			peerFb: target.fb || "",
			peerSubtitle: target.subtitle || (lang === "bn" ? "স্বেচ্ছাসেবী রক্তদাতা" : "Voluntary Donor"),
			chatId
		});
		setSelectedRoomId(chatId);
		setShowMobileRoom(true);
		setReplyingTo(null);
	};
	(0, import_react.useEffect)(() => {
		if (initialDonor) {
			openDirectChatWithUser({
				uid: initialDonor.id,
				name: initialDonor.name,
				bloodGroup: initialDonor.bloodGroup,
				avatar: initialDonor.avatar,
				whatsapp: initialDonor.whatsappPhone || initialDonor.phone,
				fb: initialDonor.facebookUrl,
				subtitle: initialDonor.hospitalAffiliation || `${initialDonor.upazila}, ${initialDonor.district}`
			});
			if (onClearInitialDonor) onClearInitialDonor();
		}
	}, [initialDonor]);
	(0, import_react.useEffect)(() => {
		setVisibleMsgLimit(50);
		const el = messagesContainerRef.current;
		if (el) requestAnimationFrame(() => {
			el.scrollTop = el.scrollHeight;
		});
	}, [selectedRoomId, showMobileRoom]);
	(0, import_react.useEffect)(() => {
		const el = messagesContainerRef.current;
		if (!el) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 220) requestAnimationFrame(() => {
			el.scrollTop = el.scrollHeight;
		});
	}, [communityMessages.length, directMessages.length]);
	const handleInstantGoogleSignIn = () => {
		const p = signInWithGoogleReal();
		setChatError(null);
		p.catch((err) => {
			const parsed = parseFirebaseAuthError(err);
			setChatError(lang === "bn" ? parsed.messageBn : parsed.messageEn);
		});
	};
	const handleSelectImageFile = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setChatError(lang === "bn" ? "অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন।" : "Please select a valid image file.");
			return;
		}
		setIsCompressingImage(true);
		setChatError(null);
		const reader = new FileReader();
		reader.onload = async () => {
			const rawDataUrl = String(reader.result || "");
			const compressed = await compressChatAttachmentImage(rawDataUrl);
			setIsCompressingImage(false);
			if (!compressed) {
				setChatError(lang === "bn" ? "ছবিটি প্রসেস করা যায়নি। অনুগ্রহ করে অন্য একটি স্পষ্ট ছবি চেষ্টা করুন।" : "Could not compress image. Please try another photo.");
				return;
			}
			setPendingAttachment(compressed);
		};
		reader.onerror = () => {
			setIsCompressingImage(false);
		};
		reader.readAsDataURL(file);
		e.target.value = "";
	};
	const handleShareLiveGpsPin = async () => {
		if (isSharingGps) return;
		setIsSharingGps(true);
		setChatError(null);
		try {
			const coords = (await requestFreshHighAccuracyGPS()).coords;
			const rev = await reverseGeocodeBangladeshCoords(coords, lang).catch(() => null);
			const lat = coords.latitude.toFixed(5);
			const lng = coords.longitude.toFixed(5);
			const areaTitle = rev ? `${rev.areaText}, ${rev.districtName}` : myDistrict;
			const locTag = `[LOC:${lat},${lng}|${lang === "bn" ? `${areaTitle} · লাইভ লোকেশন পিন` : `${areaTitle} · Live Location Pin`}]`;
			const bodyLine = lang === "bn" ? `📍 আমার বর্তমান লোকেশন (${areaTitle}) শেয়ার করলাম।` : `📍 Shared my live location (${areaTitle}).`;
			setInputText((prev) => prev.trim() ? `${locTag}\n${prev.trim()}` : `${locTag}\n${bodyLine}`);
			inputRef.current?.focus();
		} catch {
			setChatError(lang === "bn" ? "জিপিএস লোকেশন পাওয়া যায়নি। আবার চেষ্টা করুন।" : "Could not read GPS location. Please try again.");
		} finally {
			setIsSharingGps(false);
		}
	};
	const handleInsertSosCard = () => {
		const hosp = sosDraftHospital.trim() || (lang === "bn" ? "ঢাকা মেডিকেল কলেজ হাসপাতাল" : "Emergency Hospital");
		const cardTag = `[SOS:${sosDraftGroup}|${sosDraftBags} ব্যাগ|${hosp}]`;
		const note = lang === "bn" ? `🆘 জরুরি ${sosDraftGroup} রক্ত প্রয়োজন (${sosDraftBags} ব্যাগ) — হাসপাতাল: ${hosp}। প্রস্তুত রক্তদাতারা অনুগ্রহ করে সাড়া দিন!` : `🆘 Urgent ${sosDraftGroup} blood needed (${sosDraftBags} bag) at ${hosp}. Please respond!`;
		setInputText(`${cardTag}\n${note}`);
		setShowSosComposer(false);
		inputRef.current?.focus();
	};
	const handleToggleVoiceDictation = () => {
		setChatError(null);
		const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRec) {
			setShowVoiceTemplates((prev) => !prev);
			return;
		}
		if (isListeningVoice && speechRecRef.current) {
			try {
				speechRecRef.current.stop();
			} catch {}
			setIsListeningVoice(false);
			return;
		}
		try {
			const rec = new SpeechRec();
			rec.lang = lang === "bn" ? "bn-BD" : "en-US";
			rec.interimResults = false;
			rec.maxAlternatives = 1;
			rec.onstart = () => {
				setIsListeningVoice(true);
				setShowVoiceTemplates(false);
			};
			rec.onend = () => setIsListeningVoice(false);
			rec.onerror = () => {
				setIsListeningVoice(false);
				setShowVoiceTemplates(true);
			};
			rec.onresult = (event) => {
				const transcript = event?.results?.[0]?.[0]?.transcript || "";
				if (transcript) {
					setInputText((prev) => prev.trim() ? `${prev.trim()} ${transcript}` : transcript);
					inputRef.current?.focus();
				}
			};
			speechRecRef.current = rec;
			rec.start();
		} catch {
			setIsListeningVoice(false);
			setShowVoiceTemplates(true);
		}
	};
	const triggerExternalLinkSafely = (href) => {
		const link = document.createElement("a");
		link.href = href;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
	const handleSendViaWhatsAppAndSave = async (opts) => {
		const targetPeer = opts?.peer ? {
			peerUid: sanitizeFirestoreIdPart(opts.peer.uid),
			peerName: opts.peer.name,
			peerGroup: opts.peer.bloodGroup,
			peerAvatar: opts.peer.avatar || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E",
			peerWhatsapp: opts.peer.whatsapp || "",
			peerFb: opts.peer.fb || "",
			peerSubtitle: opts.peer.subtitle || "Voluntary Donor",
			chatId: buildDirectChatId(myUid || "guest", sanitizeFirestoreIdPart(opts.peer.uid))
		} : enrichedPeer;
		const draftText = opts?.customText?.trim() || inputText.trim() || (targetPeer ? lang === "bn" ? `আসসালামু আলাইকুম ${targetPeer.peerName}, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে জরুরি ${targetPeer.peerGroup} রক্তের বিষয়ে যোগাযোগ করছি।` : `Hello ${targetPeer.peerName}, reaching out from BloodSearch regarding an urgent ${targetPeer.peerGroup} blood need.` : lang === "bn" ? "আসসালামু আলাইকুম, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে জরুরি রক্তের বিষয়ে যোগাযোগ করছি।" : "Hello, reaching out via BloodSearch Bangladesh regarding an urgent blood need.");
		const savedTextWithBadge = `📲 [WhatsApp Synced] ${draftText}`;
		const nowTimeLabel = (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		});
		if (opts?.peer && (!myUid || sanitizeFirestoreIdPart(opts.peer.uid) !== myUid)) openDirectChatWithUser(opts.peer);
		const waHref = buildWhatsAppChatUrl(targetPeer?.peerWhatsapp || "", draftText);
		triggerExternalLinkSafely(waHref);
		if (!opts?.customText && inputText.trim()) setInputText("");
		if (targetPeer && (!myUid || targetPeer.peerUid !== myUid)) {
			const localMsg = {
				id: `local_wa_${Date.now()}`,
				chatId: targetPeer.chatId,
				senderUid: myUid || "guest",
				senderName: myName,
				text: savedTextWithBadge,
				replyToText: "",
				timeLabel: nowTimeLabel,
				createdAtMs: Date.now()
			};
			appendLocalDirectMessage(targetPeer.chatId, localMsg);
			if (isVerifiedSignedIn && myUid && targetPeer.peerUid !== myUid) sendDirectMessageInFirestore({
				myName,
				myGroup,
				myAvatar,
				myWhatsapp,
				myFb,
				peerUid: targetPeer.peerUid,
				peerName: targetPeer.peerName,
				peerGroup: targetPeer.peerGroup,
				peerAvatar: targetPeer.peerAvatar,
				peerWhatsapp: targetPeer.peerWhatsapp,
				peerFb: targetPeer.peerFb,
				text: savedTextWithBadge
			}).catch(() => {});
		} else {
			const localComm = {
				id: `local_comm_wa_${Date.now()}`,
				senderUid: myUid || "guest",
				senderName: myName,
				senderBloodGroup: myGroup,
				senderAvatar: myAvatar,
				senderDistrict: myDistrict,
				text: savedTextWithBadge,
				replyToName: "",
				replyToText: "",
				timeLabel: nowTimeLabel,
				createdAtMs: Date.now()
			};
			appendLocalCommunityMessage(localComm);
			if (isVerifiedSignedIn) sendCommunityMessageInFirestore({
				text: savedTextWithBadge,
				senderName: myName,
				senderBloodGroup: myGroup,
				senderAvatar: myAvatar,
				senderDistrict: myDistrict
			}).catch(() => {});
		}
	};
	const handleSendMessage = async (e) => {
		if (e) e.preventDefault();
		const trimmed = inputText.trim();
		if (!trimmed && !pendingAttachment || isSending) return;
		const guard = checkActionCooldownGuard("CHAT_SEND", 1500);
		if (!guard.allowed) {
			setChatError(lang === "bn" ? `অনুগ্রহ করে স্প্যাম রোধে ${guard.waitSeconds} সেকেন্ড অপেক্ষা করে বার্তা পাঠান।` : `Please wait ${guard.waitSeconds}s before sending another message.`);
			return;
		}
		setChatError(null);
		setIsSending(true);
		const textToSend = trimmed || (lang === "bn" ? "📷 হাসপাতালের রিকুইজিশন স্লিপ / প্রেসক্রিপশন ছবি" : "📷 Hospital Requisition Slip / Prescription");
		const attachmentToSend = pendingAttachment;
		const quote = replyingTo;
		const nowTimeLabel = (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		});
		setInputText("");
		setPendingAttachment("");
		setReplyingTo(null);
		if (selectedRoomId === COMMUNITY_ROOM_ID) appendLocalCommunityMessage({
			id: `local_comm_${Date.now()}`,
			senderUid: myUid || "guest",
			senderName: myName,
			senderBloodGroup: myGroup,
			senderAvatar: myAvatar,
			senderDistrict: myDistrict,
			text: textToSend,
			replyToName: quote?.name || "",
			replyToText: quote?.text || "",
			attachmentUrl: attachmentToSend || void 0,
			timeLabel: nowTimeLabel,
			createdAtMs: Date.now()
		});
		else if (enrichedPeer) appendLocalDirectMessage(enrichedPeer.chatId, {
			id: `local_dm_${Date.now()}`,
			chatId: enrichedPeer.chatId,
			senderUid: myUid || "guest",
			senderName: myName,
			text: textToSend,
			replyToText: quote ? `${quote.name}: ${quote.text}` : "",
			attachmentUrl: attachmentToSend || void 0,
			timeLabel: nowTimeLabel,
			createdAtMs: Date.now()
		});
		if (!isVerifiedSignedIn) {
			if (syncWhatsAppOnSend && enrichedPeer) {
				const waHref = buildWhatsAppChatUrl(enrichedPeer.peerWhatsapp, textToSend);
				triggerExternalLinkSafely(waHref);
			}
			setIsSending(false);
			inputRef.current?.focus();
			return;
		}
		try {
			if (selectedRoomId === COMMUNITY_ROOM_ID) await sendCommunityMessageInFirestore({
				text: textToSend,
				senderName: myName,
				senderBloodGroup: myGroup,
				senderAvatar: myAvatar,
				senderDistrict: myDistrict,
				replyToName: quote?.name || "",
				replyToText: quote?.text || "",
				attachmentUrl: attachmentToSend || void 0
			});
			else if (enrichedPeer) {
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
					replyToText: quote ? `${quote.name}: ${quote.text}` : "",
					attachmentUrl: attachmentToSend || void 0
				});
				if (realChatId && realChatId !== selectedRoomId) setSelectedRoomId(realChatId);
				if (syncWhatsAppOnSend) {
					const waHref = buildWhatsAppChatUrl(enrichedPeer.peerWhatsapp, textToSend);
					triggerExternalLinkSafely(waHref);
				}
			}
		} catch (err) {
			if (String(err?.message).includes("SELF_CHAT_NOT_ALLOWED")) setChatError(lang === "bn" ? "নিজের আইডিতে মেসেজ পাঠানো যাবে না। অন্য রক্তদাতা নির্বাচন করুন।" : "Cannot send direct message to yourself.");
		} finally {
			setIsSending(false);
			inputRef.current?.focus();
		}
	};
	const filteredDirectRooms = (0, import_react.useMemo)(() => {
		const q = searchQuery.trim().toLowerCase();
		const cleanRooms = directRooms.filter((r) => {
			const peerIsOne = r.participantOneUid !== myUid;
			const pUid = peerIsOne ? r.participantOneUid : r.participantTwoUid;
			const pName = peerIsOne ? r.participantOneName : r.participantTwoName;
			return !isFakeIdentifier(pUid) && !isFakePersonName(pName);
		});
		if (!q) return cleanRooms;
		return cleanRooms.filter((r) => {
			const peerIsOne = r.participantOneUid !== myUid;
			const pName = (peerIsOne ? r.participantOneName : r.participantTwoName).toLowerCase();
			const pGrp = (peerIsOne ? r.participantOneGroup : r.participantTwoGroup).toLowerCase();
			return pName.includes(q) || pGrp.includes(q) || r.lastMessage.toLowerCase().includes(q);
		});
	}, [
		directRooms,
		searchQuery,
		myUid
	]);
	const peerDonorsCount = (0, import_react.useMemo)(() => donors.filter((d) => sanitizeFirestoreIdPart(d.id) !== myUid).length, [donors, myUid]);
	const filteredDirectoryDonors = (0, import_react.useMemo)(() => {
		const q = searchQuery.trim().toLowerCase();
		const list = donors.filter((d) => sanitizeFirestoreIdPart(d.id) !== myUid);
		if (!q) return list;
		return list.filter((d) => d.name.toLowerCase().includes(q) || d.bloodGroup.toLowerCase().includes(q) || d.district.toLowerCase().includes(q) || d.upazila.toLowerCase().includes(q));
	}, [
		donors,
		searchQuery,
		myUid
	]);
	const mergedCommunityMessages = (0, import_react.useMemo)(() => {
		const cloudTexts = new Set(communityMessages.map((m) => `${m.senderName}:${m.text.trim()}`));
		const unsyncedLocal = localSavedCommunity.filter((lm) => !cloudTexts.has(`${lm.senderName}:${lm.text.trim()}`));
		return [...communityMessages, ...unsyncedLocal].sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
	}, [communityMessages, localSavedCommunity]);
	const mergedDirectMessages = (0, import_react.useMemo)(() => {
		const roomKey = activePeer?.chatId || selectedRoomId;
		const localList = localSavedDirectByRoom[roomKey] || [];
		const cloudTexts = new Set(directMessages.map((m) => m.text.trim()));
		const unsyncedLocal = localList.filter((lm) => !cloudTexts.has(lm.text.trim()));
		return [...directMessages, ...unsyncedLocal].sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
	}, [
		directMessages,
		localSavedDirectByRoom,
		activePeer?.chatId,
		selectedRoomId
	]);
	const windowedCommunityMessages = (0, import_react.useMemo)(() => {
		if (mergedCommunityMessages.length <= visibleMsgLimit) return mergedCommunityMessages;
		return mergedCommunityMessages.slice(mergedCommunityMessages.length - visibleMsgLimit);
	}, [mergedCommunityMessages, visibleMsgLimit]);
	const windowedDirectMessages = (0, import_react.useMemo)(() => {
		if (mergedDirectMessages.length <= visibleMsgLimit) return mergedDirectMessages;
		return mergedDirectMessages.slice(mergedDirectMessages.length - visibleMsgLimit);
	}, [mergedDirectMessages, visibleMsgLimit]);
	const isCommunityActive = selectedRoomId === COMMUNITY_ROOM_ID;
	(0, import_react.useMemo)(() => {
		const draft = inputText.trim() || (isCommunityActive ? `আসসালামু আলাইকুম, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে জরুরি রক্তের বিষয়ে যোগাযোগ করছি।` : `আসসালামু আলাইকুম ${enrichedPeer?.peerName || ""}, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে ${enrichedPeer?.peerGroup || ""} রক্তের বিষয়ে আপনার সাথে যোগাযোগ করছি।`);
		return buildWhatsAppChatUrl(isCommunityActive ? "" : enrichedPeer?.peerWhatsapp, draft);
	}, [
		isCommunityActive,
		enrichedPeer,
		inputText
	]);
	const renderRichBubbleContent = (rawText, attachmentUrl) => {
		const parsed = parseRichChatText(rawText);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [
				parsed.sosCard && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-2.5 rounded-xl bg-rose-600 text-white space-y-1 shadow-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-black uppercase tracking-wider text-rose-100",
							children: "জরুরি রক্তের SOS কার্ড"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "px-2 py-0.5 rounded bg-white text-rose-700 font-black text-xs",
							children: [
								parsed.sosCard.group,
								" · ",
								parsed.sosCard.bags
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-bold text-xs leading-snug",
						children: ["🏥 ", parsed.sosCard.hospital]
					})]
				}),
				parsed.locationPin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-2.5 rounded-xl bg-slate-900 text-white space-y-1.5 border border-slate-700",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 text-xs font-bold text-emerald-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-4 h-4 text-rose-400 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: parsed.locationPin.label
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[10px] font-mono text-slate-300",
							children: [
								"GPS: ",
								parsed.locationPin.lat,
								", ",
								parsed.locationPin.lng
							]
						}),
						/^https:\/\/(www\.)?google\.com\/maps\b|^https:\/\/maps\.google\.com\b/i.test(parsed.locationPin.mapsUrl) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: parsed.locationPin.mapsUrl,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "w-full py-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Google Maps-এ ডিরেকশন দেখুন" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3 h-3" })]
						})
					]
				}),
				attachmentUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: attachmentUrl,
						alt: "Medical Requisition Slip",
						loading: "lazy",
						decoding: "async",
						onClick: () => setLightboxImage(attachmentUrl),
						className: "w-full max-h-56 object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setLightboxImage(attachmentUrl),
						className: "w-full py-1 px-2 text-[10px] font-bold text-center bg-black/5 dark:bg-white/5 hover:underline cursor-pointer",
						children: lang === "bn" ? "🔍 বড় করে প্রেসক্রিপশন / স্লিপ দেখুন" : "🔍 Tap to enlarge slip"
					})]
				}),
				parsed.cleanBody && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "whitespace-pre-wrap select-text",
					children: parsed.cleanBody
				})
			]
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-white dark:bg-[#111b21] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-300 dark:border-slate-700 h-[calc(100dvh-146px)] min-h-[430px] max-h-[740px] flex flex-col @2xl:flex-row text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `w-full @2xl:w-80 border-b @2xl:border-b-0 @2xl:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-white dark:bg-[#111b21] ${showMobileRoom ? "hidden @2xl:flex" : "flex h-full"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-3.5 bg-[#075e54] dark:bg-[#1f2c34] text-white space-y-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-9 h-9 rounded-xl bg-[#25D366] text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "w-5 h-5 fill-slate-950" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-sm font-black leading-tight truncate",
										children: lang === "bn" ? "BloodSearch মেসেঞ্জার" : "BloodSearch Messenger"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-emerald-200 font-semibold block truncate",
										children: lang === "bn" ? "লাইভ চ্যাট · GPS পিন · প্রেসক্রিপশন ছবি · ভয়েস" : "Live Chat · GPS Pin · Slip Photo · Voice"
									})]
								})]
							}), !isVerifiedSignedIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onOpenAuthModal || handleInstantGoogleSignIn,
								className: "px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer shrink-0 shadow-xs",
								children: lang === "bn" ? "লগইন" : "Login"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/25 text-xs font-bold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSidebarTab("inbox"),
								className: `py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${sidebarTab === "inbox" ? "bg-white text-[#075e54] shadow-xs font-black" : "text-emerald-100 hover:text-white"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "চ্যাট ইনবক্স" : "Chats" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSidebarTab("directory"),
								className: `py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${sidebarTab === "directory" ? "bg-white text-[#075e54] shadow-xs font-black" : "text-emerald-100 hover:text-white"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? `সকল ইউজার (${peerDonorsCount})` : `Users (${peerDonorsCount})` })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "chat-peer-search",
								name: "chatSearchQuery",
								type: "text",
								value: searchQuery,
								onChange: (e) => setSearchQuery(e.target.value),
								placeholder: lang === "bn" ? "নাম, ব্লাড গ্রুপ বা জেলা দিয়ে খুঁজুন..." : "Search name, blood group, district...",
								className: "w-full h-8 pl-8 pr-2.5 text-xs rounded-xl bg-white dark:bg-[#2a3942] text-slate-900 dark:text-white border-0 focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder:text-slate-400"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto modal-scroll-contain divide-y divide-slate-100 dark:divide-slate-800/70",
					children: sidebarTab === "inbox" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setSelectedRoomId(COMMUNITY_ROOM_ID);
								setActivePeer(null);
								setShowMobileRoom(true);
								setReplyingTo(null);
							},
							className: `w-full p-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${isCommunityActive ? "bg-emerald-50/90 dark:bg-[#202c33]" : "hover:bg-slate-50 dark:hover:bg-[#202c33]/60"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#075e54] to-[#25D366] text-white flex items-center justify-center font-black text-base shadow-xs",
									children: "🇧🇩"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-black text-xs text-slate-900 dark:text-white truncate",
											children: lang === "bn" ? "সবার উন্মুক্ত লাইভ চ্যাট (BD Live)" : "Bangladesh Live Community Chat"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold text-emerald-600 dark:text-[#25D366] shrink-0",
											children: "LIVE"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5",
										children: communityMessages.length > 0 ? `${communityMessages[communityMessages.length - 1].senderName}: ${parseRichChatText(communityMessages[communityMessages.length - 1].text).cleanBody || "📍 লোকেশন / 📷 স্লিপ"}` : lang === "bn" ? "সকল রক্তদাতা ও রোগীর সাথে সরাসরি কথা বলুন..." : "Chat live with all donors & recipients..."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-slate-400 mt-1",
										children: lang === "bn" ? `${communityMessages.length}টি বার্তা · GPS পিন ও প্রেসক্রিপশন স্লিপ শেয়ারযোগ্য` : `${communityMessages.length} live messages · GPS & slip share enabled`
									})
								]
							})]
						}),
						(filteredDirectRooms.length > 0 || mergedCommunityMessages.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-3 py-2 bg-slate-50 dark:bg-[#182229] flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-bold text-slate-600 dark:text-slate-300",
								children: lang === "bn" ? "চ্যাট তালিকা" : "Conversations"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5",
								children: [confirmClearAllChats && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setConfirmClearAllChats(false),
									className: "px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer",
									children: lang === "bn" ? "বাতিল" : "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: isWipingChats,
									onClick: handleClearAllChats,
									className: `px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition-colors ${confirmClearAllChats ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isWipingChats ? lang === "bn" ? "মুছে ফেলা হচ্ছে..." : "Deleting..." : confirmClearAllChats ? lang === "bn" ? "নিশ্চিত সব মুছুন" : "Confirm Delete All" : lang === "bn" ? "সব চ্যাট মুছুন" : "Clear All Chats" })]
								})]
							})]
						}),
						filteredDirectRooms.map((room) => {
							const peerIsOne = room.participantOneUid !== myUid;
							const pUid = peerIsOne ? room.participantOneUid : room.participantTwoUid;
							const pName = peerIsOne ? room.participantOneName : room.participantTwoName;
							const pGrp = peerIsOne ? room.participantOneGroup : room.participantTwoGroup;
							const pAvatar = peerIsOne ? room.participantOneAvatar : room.participantTwoAvatar;
							const pWa = peerIsOne ? room.participantOneWhatsapp : room.participantTwoWhatsapp;
							const pFb = peerIsOne ? room.participantOneFb : room.participantTwoFb;
							const isSelected = selectedRoomId === room.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `w-full p-3 text-left flex items-center gap-2.5 transition-colors ${isSelected ? "bg-emerald-50/90 dark:bg-[#202c33]" : "hover:bg-slate-50 dark:hover:bg-[#202c33]/60"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => openDirectChatWithUser({
										uid: pUid,
										name: pName,
										bloodGroup: pGrp,
										avatar: pAvatar,
										whatsapp: pWa,
										fb: pFb,
										subtitle: lang === "bn" ? "ব্যক্তিগত ১-টু-১ চ্যাট" : "Direct 1-to-1 Chat"
									}),
									className: "flex-1 min-w-0 text-left flex items-start gap-3 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: pAvatar || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E",
											loading: "lazy",
											decoding: "async",
											onError: (e) => {
												e.currentTarget.src = DEFAULT_AVATAR_DATA_URI;
											},
											alt: pName,
											className: "w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute -bottom-0.5 -right-0.5 px-1 rounded bg-rose-600 text-white text-[9px] font-black",
											children: pGrp
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-xs text-slate-900 dark:text-white truncate",
												children: pName
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-slate-400 font-mono shrink-0",
												children: room.timeLabel
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5",
											children: [room.lastSenderUid === myUid ? "✓✓ আপনি: " : "", parseRichChatText(room.lastMessage).cleanBody || "📍 লোকেশন / 📷 স্লিপ"]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: (e) => handleDeleteDirectRoom(room.id, e),
									className: "p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0",
									title: lang === "bn" ? "এই চ্যাট ডিলিট করুন" : "Delete conversation",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5" })
								})]
							}, room.id);
						}),
						filteredDirectRooms.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 text-center space-y-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-500 dark:text-slate-400",
								children: lang === "bn" ? "যেকোনো রক্তদাতা বা ইউজারের সাথে ব্যক্তিগত (User-to-User) চ্যাট বা WhatsApp শুরু করতে নিচের বাটনে চাপুন:" : "Start a private User-to-User or WhatsApp chat with any registered donor:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSidebarTab("directory"),
								className: "px-3.5 py-2 rounded-xl bg-[#075e54] hover:bg-[#128c7e] text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "সকল ইউজার ও রক্তদাতা দেখুন →" : "Browse Users & Donors →" })]
							})]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						filteredDirectoryDonors.slice(0, visibleDirLimit).map((d) => {
							buildWhatsAppChatUrl(d.whatsappPhone || d.phone, `আসসালামু আলাইকুম ${d.name}, আমি BloodSearch বাংলাদেশ অ্যাপ থেকে জরুরি ${d.bloodGroup} রক্তের বিষয়ে যোগাযোগ করছি।`);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 flex items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-[#202c33]/60 transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									onClick: () => openDirectChatWithUser({
										uid: d.id,
										name: d.name,
										bloodGroup: d.bloodGroup,
										avatar: d.avatar,
										whatsapp: d.whatsappPhone || d.phone,
										fb: d.facebookUrl,
										subtitle: `${d.upazila}, ${d.district}`
									}),
									className: "flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: d.avatar || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E",
											loading: "lazy",
											decoding: "async",
											onError: (e) => {
												e.currentTarget.src = DEFAULT_AVATAR_DATA_URI;
											},
											alt: d.name,
											className: "w-10 h-10 rounded-2xl object-cover"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute -bottom-0.5 -right-0.5 px-1 rounded bg-rose-600 text-white text-[9px] font-black",
											children: d.bloodGroup
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "font-bold text-xs text-slate-900 dark:text-white truncate",
											children: d.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] text-slate-500 dark:text-slate-400 truncate",
											children: [
												d.upazila,
												", ",
												d.district
											]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => openDirectChatWithUser({
											uid: d.id,
											name: d.name,
											bloodGroup: d.bloodGroup,
											avatar: d.avatar,
											whatsapp: d.whatsappPhone || d.phone,
											fb: d.facebookUrl,
											subtitle: `${d.upazila}, ${d.district}`
										}),
										className: "px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-black text-white font-bold text-[11px] cursor-pointer",
										children: lang === "bn" ? "চ্যাট" : "Chat"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => handleSendViaWhatsAppAndSave({ peer: {
											uid: d.id,
											name: d.name,
											bloodGroup: d.bloodGroup,
											avatar: d.avatar,
											whatsapp: d.whatsappPhone || d.phone,
											fb: d.facebookUrl,
											subtitle: `${d.upazila}, ${d.district}`
										} }),
										className: "px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-black text-[11px] cursor-pointer",
										title: "WhatsApp-এ পাঠান ও চ্যাটে সেভ রাখুন",
										children: "WA"
									})]
								})]
							}, d.id);
						}),
						filteredDirectoryDonors.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-6 text-center text-xs text-slate-500 dark:text-slate-400",
							children: lang === "bn" ? "কোনো ম্যাচিং ইউজার পাওয়া যায়নি।" : "No matching users found."
						}),
						filteredDirectoryDonors.length > visibleDirLimit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setVisibleDirLimit((prev) => prev + 40),
								className: "px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#202c33] text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer",
								children: lang === "bn" ? `আরও ইউজার দেখুন (${filteredDirectoryDonors.length - visibleDirLimit})` : `Load more users (${filteredDirectoryDonors.length - visibleDirLimit})`
							})
						})
					] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] min-w-0 ${!showMobileRoom ? "hidden @2xl:flex" : "flex"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-2.5 bg-[#075e54] dark:bg-[#202c33] text-white flex items-center justify-between gap-2 shadow-xs shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowMobileRoom(false),
									className: "@2xl:hidden p-1.5 -ml-1 rounded-lg text-white hover:bg-white/10 cursor-pointer shrink-0",
									title: "Back to chats",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "w-5 h-5" })
								}),
								isCommunityActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-9 h-9 rounded-2xl bg-[#25D366] text-slate-950 flex items-center justify-center font-black text-sm shrink-0",
									children: "🇧🇩"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: enrichedPeer?.peerAvatar || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E",
									onError: (e) => {
										e.currentTarget.src = DEFAULT_AVATAR_DATA_URI;
									},
									alt: enrichedPeer?.peerName || "User",
									className: "w-9 h-9 rounded-2xl object-cover ring-2 ring-white/25 shrink-0"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-xs @md:text-sm text-white truncate",
											children: isCommunityActive ? lang === "bn" ? "সবার উন্মুক্ত লাইভ চ্যাট (BD)" : "BD Live Community Chat" : enrichedPeer?.peerName
										}), !isCommunityActive && enrichedPeer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[10px] shrink-0",
											children: enrichedPeer.peerGroup
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-emerald-100 truncate",
										children: isCommunityActive ? lang === "bn" ? "আনলিমিটেড লাইভ চ্যাট · GPS লোকেশন ও প্রেসক্রিপশন ছবি পাঠান" : "Unlimited live chat · Share GPS pins & prescription photos" : enrichedPeer?.peerSubtitle || (lang === "bn" ? "রিয়েল-টাইম ক্লাউড চ্যাট" : "Live Cloud Chat")
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 shrink-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => handleSendViaWhatsAppAndSave(),
									className: "flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap",
									title: "Send via WhatsApp & Auto-Save in Chat",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
										className: "w-3.5 h-3.5 fill-current shrink-0",
										viewBox: "0 0 24 24",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WhatsApp" })]
								}),
								!isCommunityActive && normalizeFacebookProfileUrl(enrichedPeer?.peerFb) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: normalizeFacebookProfileUrl(enrichedPeer?.peerFb),
									target: "_blank",
									rel: "noopener noreferrer",
									className: "p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer",
									title: "Facebook প্রোফাইল",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3.5 h-3.5" })
								}),
								!isCommunityActive && enrichedPeer?.peerWhatsapp && !enrichedPeer.peerWhatsapp.includes("*") && !enrichedPeer.peerWhatsapp.includes("X") && /^\+?\d{8,16}$/.test(enrichedPeer.peerWhatsapp.replace(/[^\d+]/g, "")) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `tel:${enrichedPeer.peerWhatsapp.replace(/[^\d+]/g, "")}`,
									className: "p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer",
									title: "সরাসরি কল করুন",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5" })
								}),
								!isCommunityActive && enrichedPeer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => handleDeleteDirectRoom(enrichedPeer.chatId),
									className: "p-2 rounded-xl bg-red-600/85 hover:bg-red-600 text-white transition-colors cursor-pointer",
									title: lang === "bn" ? "এই সম্পূর্ণ চ্যাট ডিলিট করুন" : "Delete entire conversation",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5" })
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						ref: messagesContainerRef,
						className: "flex-1 overflow-y-auto modal-scroll-contain p-3 @md:p-4 space-y-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center my-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block text-[11px] font-semibold text-slate-700 dark:text-amber-200/90 bg-[#fff5c4] dark:bg-[#182229] px-3 py-1 rounded-xl shadow-2xs max-w-[94%]",
									children: isCommunityActive ? lang === "bn" ? "🔓 লাইভ কমিউনিটি রুম — নিচে 📍 GPS লোকেশন পিন, 📷 প্রেসক্রিপশন স্লিপ বা 🆘 জরুরি রক্তের কার্ড পাঠাতে পারবেন!" : "🔓 Live Community Room — Share GPS pins, requisition photos, or SOS cards!" : lang === "bn" ? "🔒 ব্যক্তিগত ইউজার-টু-ইউজার চ্যাট — শুধুমাত্র আপনি ও অপর পক্ষ এই মেসেজ ও প্রেসক্রিপশন ছবি দেখতে পাবেন।" : "🔒 Private 1-to-1 User-to-User Chat — Isolated strictly to both participants."
								})
							}),
							(isCommunityActive && communityMessages.length > visibleMsgLimit || !isCommunityActive && directMessages.length > visibleMsgLimit) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center py-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setVisibleMsgLimit((prev) => prev + 50),
									className: "px-3 py-1 rounded-lg bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer",
									children: lang === "bn" ? "↑ পূর্ববর্তী মেসেজ দেখুন" : "↑ Load older messages"
								})
							}),
							isCommunityActive && (windowedCommunityMessages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-10 text-center space-y-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold text-slate-600 dark:text-slate-400",
									children: lang === "bn" ? "প্রথম লাইভ বার্তাটি আপনিই পাঠান! (যেমন: সালাম বা রক্তের গ্রুপ জানান)" : "Send the first live message to the community!"
								})
							}) : windowedCommunityMessages.map((msg) => {
								const isMe = Boolean(myUid && msg.senderUid === myUid);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `flex flex-col ${isMe ? "items-end" : "items-start"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `max-w-[86%] @md:max-w-md rounded-2xl px-3 py-2 shadow-xs text-xs @md:text-sm leading-relaxed break-words ${isMe ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none" : "bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none"}`,
										children: [
											!isMe && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-2 mb-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => openDirectChatWithUser({
														uid: msg.senderUid,
														name: msg.senderName,
														bloodGroup: msg.senderBloodGroup,
														avatar: msg.senderAvatar,
														subtitle: msg.senderDistrict || "BloodSearch User"
													}),
													className: "font-black text-[11px] text-emerald-700 dark:text-[#25D366] hover:underline cursor-pointer flex items-center gap-1",
													title: "এই ইউজারের সাথে ১-টু-১ ব্যক্তিগত চ্যাট শুরু করুন",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: msg.senderName }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "px-1 py-0.2 rounded bg-rose-600 text-white text-[9px]",
														children: msg.senderBloodGroup
													})]
												}), msg.senderDistrict && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-slate-400",
													children: msg.senderDistrict
												})]
											}),
											msg.replyToText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-1.5 p-1.5 rounded-lg bg-black/5 dark:bg-black/25 border border-emerald-500/30 text-[11px] opacity-90",
												children: [msg.replyToName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-bold block text-emerald-700 dark:text-emerald-400",
													children: msg.replyToName
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "line-clamp-2",
													children: msg.replyToText
												})]
											}),
											renderRichBubbleContent(msg.text, msg.attachmentUrl),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-end gap-2 mt-1 text-[10px] text-slate-500 dark:text-emerald-100/70",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => setReplyingTo({
															name: msg.senderName,
															text: msg.text
														}),
														className: "hover:text-slate-900 dark:hover:text-white cursor-pointer",
														title: "উত্তর দিন (Reply)",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reply, { className: "w-3 h-3" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: buildWhatsAppChatUrl("", msg.text),
														target: "_blank",
														rel: "noopener noreferrer",
														className: "font-bold text-emerald-700 dark:text-[#25D366] hover:underline",
														title: "WhatsApp-এ ফরোয়ার্ড করুন",
														children: "WA"
													}),
													isMe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => deleteCommunityMessageInFirestore(msg.id).catch(() => {}),
														className: "text-red-500 hover:text-red-700 cursor-pointer",
														title: "মুছে ফেলুন",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3 h-3" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-mono",
														children: msg.timeLabel
													}),
													isMe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, { className: "w-3.5 h-3.5 text-sky-500" })
												]
											})
										]
									})
								}, msg.id);
							})),
							!isCommunityActive && (windowedDirectMessages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "py-10 text-center space-y-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold text-slate-700 dark:text-slate-300",
									children: lang === "bn" ? `${enrichedPeer?.peerName || "রক্তদাতা"}-কে আপনার বার্তা, 📍 লোকেশন বা 📷 রিকুইজিশন স্লিপ পাঠান!` : `Send a live message, GPS location, or requisition slip to ${enrichedPeer?.peerName || "this donor"}!`
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => handleSendViaWhatsAppAndSave(),
									className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-xs cursor-pointer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "📲 WhatsApp-এ পাঠান (চ্যাটেও সেভ থাকবে)" : "📲 Send on WhatsApp & Save in Chat" })
								})]
							}) : windowedDirectMessages.map((msg) => {
								const isMe = Boolean(myUid && msg.senderUid === myUid);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `flex flex-col ${isMe ? "items-end" : "items-start"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `max-w-[86%] @md:max-w-md rounded-2xl px-3 py-2 shadow-xs text-xs @md:text-sm leading-relaxed break-words ${isMe ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none" : "bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none"}`,
										children: [
											msg.replyToText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mb-1.5 p-1.5 rounded-lg bg-black/5 dark:bg-black/25 border border-emerald-500/30 text-[11px] opacity-90",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "line-clamp-2",
													children: msg.replyToText
												})
											}),
											renderRichBubbleContent(msg.text, msg.attachmentUrl),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-end gap-2 mt-1 text-[10px] text-slate-500 dark:text-emerald-100/70",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => setReplyingTo({
															name: isMe ? myName : enrichedPeer?.peerName || "User",
															text: msg.text
														}),
														className: "hover:text-slate-900 dark:hover:text-white cursor-pointer",
														title: "Reply",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reply, { className: "w-3 h-3" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: buildWhatsAppChatUrl(enrichedPeer?.peerWhatsapp, msg.text),
														target: "_blank",
														rel: "noopener noreferrer",
														className: "font-bold text-emerald-700 dark:text-[#25D366] hover:underline",
														title: "এই মেসেজটি সরাসরি WhatsApp-এও পাঠান",
														children: "WA"
													}),
													isMe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => {
															const roomKey = msg.chatId || activePeer?.chatId || selectedRoomId;
															setLocalSavedDirectByRoom((prev) => ({
																...prev,
																[roomKey]: (prev[roomKey] || []).filter((m) => m.id !== msg.id)
															}));
															setDirectMessages((prev) => prev.filter((m) => m.id !== msg.id));
															deleteDirectMessageInFirestore(roomKey, msg.id).catch(() => false);
														},
														className: "text-red-500 hover:text-red-700 cursor-pointer",
														title: lang === "bn" ? "মেসেজ মুছুন" : "Delete message",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3 h-3" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-mono",
														children: msg.timeLabel
													}),
													isMe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, { className: "w-3.5 h-3.5 text-sky-500" })
												]
											})
										]
									})
								}, msg.id);
							}))
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-3 py-1.5 bg-amber-50/90 dark:bg-amber-950/30 border-t border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200/90 flex items-center justify-between gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: lang === "bn" ? "সতর্কতা: রক্তদানের আগে বিকাশ/নগদে অগ্রিম ভাড়া পাঠাবেন না · সেবা ১০০% বিনামূল্যে" : "Safety: Never send advance bKash/Nagad fare before meeting at hospital"
						})
					}),
					chatError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-2 bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-900 flex items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300 font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: chatError
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setChatError(null),
							className: "p-1 text-red-500 cursor-pointer shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" })
						})]
					}),
					!isVerifiedSignedIn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-2 bg-emerald-50 dark:bg-[#182229] border-t border-emerald-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-bold text-slate-800 dark:text-slate-200",
							children: lang === "bn" ? "লাইভ চ্যাট ও ছবি পাঠাতে ১-ক্লিকে আসল Gmail দিয়ে যুক্ত হোন:" : "Sign in with Gmail in 1 tap to send live messages & photos:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: handleInstantGoogleSignIn,
								className: "px-3 py-1.5 rounded-lg bg-[#075e54] hover:bg-[#128c7e] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "Google লগইন" : "Google Login" })]
							}), onOpenRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onOpenRegister,
								className: "px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "আইডি খুলুন" : "Create ID" })]
							})]
						})]
					}),
					showSosComposer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900 space-y-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-black text-rose-700 dark:text-rose-300",
									children: lang === "bn" ? "🆘 চ্যাটে জরুরি রক্তের কার্ড তৈরি করুন" : "🆘 Build Urgent Blood Card"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowSosComposer(false),
									className: "p-0.5 text-rose-500 cursor-pointer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-3 gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "chat-sos-draft-group",
										name: "sosDraftGroup",
										value: sosDraftGroup,
										onChange: (e) => setSosDraftGroup(e.target.value),
										className: "h-8 px-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 font-black text-rose-600 text-xs",
										children: BLOOD_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: g,
											children: g
										}, g))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "chat-sos-draft-bags",
										name: "sosDraftBags",
										value: sosDraftBags,
										onChange: (e) => setSosDraftBags(e.target.value),
										className: "h-8 px-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 font-bold text-xs text-slate-800 dark:text-white",
										children: [
											"1",
											"2",
											"3",
											"4",
											"5"
										].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: n,
											children: [
												n,
												" ",
												lang === "bn" ? "ব্যাগ" : "Bag"
											]
										}, n))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: handleInsertSosCard,
										className: "h-8 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer",
										children: lang === "bn" ? "যুক্ত করুন" : "Insert"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "chat-sos-draft-hospital",
								name: "sosDraftHospital",
								type: "text",
								value: sosDraftHospital,
								onChange: (e) => setSosDraftHospital(e.target.value),
								placeholder: lang === "bn" ? "হাসপাতালের নাম (যেমন: ঢাকা মেডিকেল ওয়ার্ড ২০৪)..." : "Hospital & ward name...",
								className: "w-full h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-xs text-slate-900 dark:text-white"
							})
						]
					}),
					(pendingAttachment || isCompressingImage) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-2 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5 min-w-0",
							children: [pendingAttachment && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: pendingAttachment,
								alt: "Attachment preview",
								className: "w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shrink-0"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-emerald-700 dark:text-[#25D366] block",
									children: isCompressingImage ? lang === "bn" ? "ছবিটি অপ্টিমাইজ হচ্ছে..." : "Optimizing photo..." : lang === "bn" ? "📷 রিকুইজিশন স্লিপ / প্রেসক্রিপশন ছবি যুক্ত হয়েছে" : "📷 Prescription / Requisition Slip Ready"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-slate-500 dark:text-slate-400",
									children: lang === "bn" ? "সেন্ড বাটনে চাপলেই চ্যাটে চলে যাবে" : "Press Send to share in chat"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setPendingAttachment(""),
							className: "p-1 text-slate-400 hover:text-red-500 cursor-pointer",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
						})]
					}),
					replyingTo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-1.5 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 pl-2 border border-emerald-500/30 rounded-lg py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-emerald-700 dark:text-[#25D366] block text-[11px]",
								children: replyingTo.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-600 dark:text-slate-300 truncate block text-[11px]",
								children: replyingTo.text
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setReplyingTo(null),
							className: "p-1 text-slate-400 hover:text-slate-700 cursor-pointer",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-2.5 py-1.5 bg-white/95 dark:bg-[#1f2c34] border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "chat-slip-file",
								name: "chatSlipAttachment",
								ref: fileInputRef,
								type: "file",
								accept: "image/*",
								onChange: handleSelectImageFile,
								className: "hidden"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: handleShareLiveGpsPin,
								disabled: isSharingGps,
								className: "px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer",
								title: "লাইভ জিপিএস লোকেশন পিন পাঠান",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-3.5 h-3.5 text-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isSharingGps ? "GPS..." : lang === "bn" ? "লোকেশন পিন" : "GPS Pin" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => fileInputRef.current?.click(),
								className: "px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer",
								title: "হাসপাতালের রিকুইজিশন স্লিপ বা প্রেসক্রিপশন ছবি যুক্ত করুন",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "স্লিপ / ছবি" : "Slip Photo" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setShowSosComposer(!showSosComposer),
								className: "px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "SOS কার্ড" : "SOS Card" })]
							}),
							!isCommunityActive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-[#25D366] font-bold shrink-0 cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "chat-sync-whatsapp",
									name: "syncWhatsAppOnSend",
									type: "checkbox",
									checked: syncWhatsAppOnSend,
									onChange: (e) => setSyncWhatsAppOnSend(e.target.checked),
									className: "w-3 h-3 accent-emerald-600"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WA সিঙ্ক" })]
							}),
							QUICK_EMOJIS.map((em) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setInputText((prev) => `${prev}${em}`),
								className: "px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 text-sm",
								children: em
							}, em))
						]
					}),
					showVoiceTemplates && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3 py-2 bg-slate-50 dark:bg-[#182229] border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-slate-800 dark:text-slate-200 text-[11px]",
								children: lang === "bn" ? "🎙️ কুইক ভয়েস মেসেজ (১-ট্যাপে মেসেজ বক্সে যুক্ত করুন):" : "🎙️ Quick Voice Phrases (1-tap insert):"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowVoiceTemplates(false),
								className: "p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5",
							children: (lang === "bn" ? [
								"আসসালামু আলাইকুম, জরুরি রক্তের প্রয়োজন — আপনি কি এখন রক্ত দিতে পারবেন?",
								"আমি রক্ত দিতে প্রস্তুত আছি, হাসপাতালের নাম ও ওয়ার্ড নম্বর জানান।",
								"আমি হাসপাতালের পথে রওনা দিয়েছি, শীঘ্রই পৌঁছাবো ইনশাআল্লাহ।",
								"রোগীর প্রেসক্রিপশন বা রিকুইজিশন স্লিপটি শেয়ার করুন।"
							] : [
								"Hello, urgent blood is needed at the hospital — are you available now?",
								"I am ready to donate blood. Please share the hospital & ward details.",
								"I am on the way to the hospital blood bank right now.",
								"Please share the hospital requisition slip and attendant phone number."
							]).map((phrase) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setInputText(phrase);
									setShowVoiceTemplates(false);
									inputRef.current?.focus();
								},
								className: "px-2.5 py-1 rounded-lg bg-white dark:bg-[#2a3942] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500 cursor-pointer text-left",
								children: phrase
							}, phrase))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSendMessage,
						className: "p-2 @md:p-2.5 bg-[#f0f2f5] dark:bg-[#202c33] flex items-end gap-1.5 shrink-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleToggleVoiceDictation,
								className: `w-[42px] h-[42px] rounded-2xl flex items-center justify-center shrink-0 cursor-pointer transition-colors ${isListeningVoice || showVoiceTemplates ? "bg-rose-600 text-white" : "bg-white dark:bg-[#2a3942] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"}`,
								title: lang === "bn" ? "ভয়েস টাইপিং বা কুইক মেসেজ" : "Voice Dictation / Quick Phrases",
								children: isListeningVoice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "w-4 h-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "chat-message-input",
								name: "chatMessage",
								ref: inputRef,
								rows: 1,
								placeholder: isListeningVoice ? lang === "bn" ? "🎙️ কথা বলুন... স্বয়ংক্রিয়ভাবে লেখা হচ্ছে" : "🎙️ Listening..." : lang === "bn" ? "মেসেজ লিখুন বা লোকেশন / স্লিপ পাঠান..." : "Type message or share GPS / slip...",
								value: inputText,
								onChange: (e) => setInputText(e.target.value),
								onKeyDown: (e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSendMessage();
									}
								},
								className: "flex-1 min-h-[42px] max-h-28 py-2.5 px-3 text-xs @md:text-sm rounded-2xl bg-white dark:bg-[#2a3942] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#128c7e] resize-none placeholder:text-slate-400"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => handleSendViaWhatsAppAndSave(),
								className: "h-[42px] px-2.5 rounded-2xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs cursor-pointer shrink-0 transition-colors",
								title: "WhatsApp-এ পাঠান ও এই চ্যাটেও সেভ রাখুন",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WA" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: isSending || !inputText.trim() && !pendingAttachment,
								className: "w-[42px] h-[42px] rounded-2xl bg-[#075e54] hover:bg-[#128c7e] disabled:opacity-50 text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer shrink-0",
								title: "লাইভ চ্যাটে পাঠান ও সেভ করুন",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "w-4 h-4" })
							})
						]
					})
				]
			}),
			lightboxImage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				onClick: () => setLightboxImage(null),
				className: "fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: (e) => e.stopPropagation(),
					className: "relative max-w-2xl w-full bg-slate-950 rounded-2xl p-2 border border-slate-800 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-2 py-1 text-white text-xs font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "হাসপাতালের রিকুইজিশন স্লিপ / প্রেসক্রিপশন প্রিভিউ" : "Hospital Requisition Slip Preview" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setLightboxImage(null),
							className: "p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: lightboxImage,
						alt: "Full Medical Slip",
						className: "w-full max-h-[78dvh] object-contain rounded-xl bg-black"
					})]
				})
			})
		]
	});
};
export { DonorChatView };
