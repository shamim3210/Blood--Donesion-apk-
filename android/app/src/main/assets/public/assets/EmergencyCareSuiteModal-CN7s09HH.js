import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { t as createLucideIcon } from "./createLucideIcon-DRE67aPD.js";
import { t as Activity } from "./activity-NRNMH_1-.js";
import { t as Smartphone } from "./smartphone-DQEVZcB-.js";
import { Cn as Phone, Dn as MessageSquare, Dt as isValidBangladeshMobilePhone, Jn as CircleCheck, Ln as Heart, Lt as ALL_BLOOD_GROUPS, M as createGratitudeNoteInFirestore, Nt as downloadIceLockScreenWallpaperPng, Ot as normalizeValidBangladeshMobileE164, Sn as Plus, T as buildWhatsAppChatUrl, Tt as formatBangladeshPhoneDisplay, Un as Download, Wn as Copy, cn as X, fn as TriangleAlert, hn as ShieldCheck, jt as copyTextReliable, kt as buildOfflineEmergencySmsUri, mn as Sparkles, pn as Trash2, yn as Search, yt as subscribePublicGratitudeNotes } from "./index-BZGxtQ_X.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Apple = createLucideIcon("apple", [["path", {
	d: "M12 6.528V3a1 1 0 0 1 1-1h0",
	key: "11qiee"
}], ["path", {
	d: "M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21",
	key: "110c12"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Truck = createLucideIcon("truck", [
	["path", {
		d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
		key: "wrbu53"
	}],
	["path", {
		d: "M15 18H9",
		key: "1lyqi6"
	}],
	["path", {
		d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
		key: "lysw3i"
	}],
	["circle", {
		cx: "17",
		cy: "18",
		r: "2",
		key: "332jqn"
	}],
	["circle", {
		cx: "7",
		cy: "18",
		r: "2",
		key: "19iecd"
	}]
]);
// src/components/ecosystem/EmergencyCareSuiteModal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_MATERNITY_PLAN = {
	motherName: "",
	bloodGroup: "O+",
	eddDate: "",
	hospitalName: "",
	standbyDonors: []
};
var DEFAULT_DENGUE_LOGS = [];
var EmergencyCareSuiteModal = ({ isOpen, onClose, lang, initialTab = "maternity", donors, onOpenSOSWizard }) => {
	const [activeTab, setActiveTab] = (0, import_react.useState)(initialTab);
	const [suiteNotice, setSuiteNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isOpen && initialTab) setActiveTab(initialTab);
	}, [isOpen, initialTab]);
	const showTempNotice = (msg) => {
		setSuiteNotice(msg);
		window.setTimeout(() => setSuiteNotice(null), 3500);
	};
	const [maternityPlan, setMaternityPlan] = (0, import_react.useState)(() => {
		try {
			const saved = localStorage.getItem("bloodsearch_maternity_plan");
			if (saved) return JSON.parse(saved);
		} catch {}
		return DEFAULT_MATERNITY_PLAN;
	});
	const [sbName, setSbName] = (0, import_react.useState)("");
	const [sbPhone, setSbPhone] = (0, import_react.useState)("");
	const [sbGroup, setSbGroup] = (0, import_react.useState)("O+");
	const [sbNote, setSbNote] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		try {
			localStorage.setItem("bloodsearch_maternity_plan", JSON.stringify(maternityPlan));
		} catch {}
	}, [maternityPlan]);
	const eddDaysRemaining = (0, import_react.useMemo)(() => {
		if (!maternityPlan.eddDate) return null;
		const ms = Date.parse(`${maternityPlan.eddDate}T09:00:00`);
		if (Number.isNaN(ms)) return null;
		return Math.ceil((ms - Date.now()) / 864e5);
	}, [maternityPlan.eddDate]);
	const isMotherRhNegative = maternityPlan.bloodGroup.endsWith("-");
	const handleAddStandbyDonor = (e) => {
		e.preventDefault();
		if (!sbName.trim() || !sbPhone.trim()) return;
		const normalizedPhone = normalizeValidBangladeshMobileE164(sbPhone);
		if (!normalizedPhone || !isValidBangladeshMobilePhone(sbPhone)) {
			showTempNotice(lang === "bn" ? "সঠিক ১১ ডিজিটের সচল বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 01712345678)।" : "Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).");
			return;
		}
		const newEntry = {
			id: `sb_${Date.now()}`,
			name: sbName.trim(),
			phone: normalizedPhone,
			bloodGroup: sbGroup,
			relationNote: sbNote.trim() || (lang === "bn" ? "স্ট্যান্ডবাই রক্তদাতা" : "Standby donor")
		};
		setMaternityPlan((prev) => ({
			...prev,
			standbyDonors: [newEntry, ...prev.standbyDonors].slice(0, 8)
		}));
		setSbName("");
		setSbPhone("");
		setSbNote("");
		showTempNotice(lang === "bn" ? "✓ ডেলিভারি স্ট্যান্ডবাই ডোনার পুলে যুক্ত হয়েছে!" : "✓ Added to Maternity Standby Pool!");
	};
	const [dengueLogs, setDengueLogs] = (0, import_react.useState)(() => {
		try {
			const saved = localStorage.getItem("bloodsearch_dengue_logs");
			if (saved) return JSON.parse(saved);
		} catch {}
		return DEFAULT_DENGUE_LOGS;
	});
	const [pltInput, setPltInput] = (0, import_react.useState)("35000");
	const [hctInput, setHctInput] = (0, import_react.useState)("46");
	const [hbInput, setHbInput] = (0, import_react.useState)("12.2");
	(0, import_react.useEffect)(() => {
		try {
			localStorage.setItem("bloodsearch_dengue_logs", JSON.stringify(dengueLogs));
		} catch {}
	}, [dengueLogs]);
	const latestDengue = dengueLogs[dengueLogs.length - 1] || {
		platelets: 15e4,
		hctPercent: 40,
		hemoglobin: 13,
		dateLabel: "-"
	};
	const handleAddDengueLog = (e) => {
		e.preventDefault();
		const pVal = Math.max(1e3, Math.min(8e5, Number(pltInput) || 5e4));
		const hctVal = Math.max(15, Math.min(70, Number(hctInput) || 42));
		const hbVal = Math.max(3, Math.min(22, Number(hbInput) || 12));
		const entry = {
			id: `dl_${Date.now()}`,
			dateLabel: (/* @__PURE__ */ new Date()).toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-US", {
				hour: "2-digit",
				minute: "2-digit"
			}),
			platelets: pVal,
			hctPercent: hctVal,
			hemoglobin: hbVal
		};
		setDengueLogs((prev) => [...prev.slice(-7), entry]);
		showTempNotice(lang === "bn" ? `✓ সিবিসি রিপোর্ট সেভ হয়েছে (প্লাটিলেট: ${pVal.toLocaleString()})` : `✓ CBC report logged (${pVal.toLocaleString()} /µL)`);
	};
	const [ambDistanceKm, setAmbDistanceKm] = (0, import_react.useState)(25);
	const [ambType, setAmbType] = (0, import_react.useState)("AC");
	const estimatedFareRange = (0, import_react.useMemo)(() => {
		const r = {
			NON_AC: {
				base: 800,
				perKm: 32
			},
			AC: {
				base: 1200,
				perKm: 45
			},
			ICU: {
				base: 3500,
				perKm: 95
			},
			FREEZER: {
				base: 2200,
				perKm: 65
			}
		}[ambType];
		const min = Math.round((r.base + ambDistanceKm * r.perKm) / 50) * 50;
		return {
			min,
			max: Math.round(min * 1.18 / 50) * 50
		};
	}, [ambDistanceKm, ambType]);
	const [iceName, setIceName] = (0, import_react.useState)(() => {
		try {
			const raw = localStorage.getItem("bloodsearch_current_user");
			if (raw) return JSON.parse(raw)?.name || "";
		} catch {}
		return "";
	});
	const [iceGroup, setIceGroup] = (0, import_react.useState)(() => {
		try {
			const raw = localStorage.getItem("bloodsearch_current_user");
			if (raw) return JSON.parse(raw)?.bloodGroup || "B+";
		} catch {}
		return "B+";
	});
	const [iceGuardian, setIceGuardian] = (0, import_react.useState)("");
	const [icePhone, setIcePhone] = (0, import_react.useState)(() => {
		try {
			const raw = localStorage.getItem("bloodsearch_current_user");
			if (raw) {
				const p = JSON.parse(raw)?.phone;
				if (p && isValidBangladeshMobilePhone(p)) return p;
			}
		} catch {}
		return "";
	});
	const [iceSecondPhone, setIceSecondPhone] = (0, import_react.useState)("");
	const [iceConditions, setIceConditions] = (0, import_react.useState)("কোনো দীর্ঘমেয়াদী রোগ নেই");
	const [iceAllergies, setIceAllergies] = (0, import_react.useState)("কোনো ওষুধ অ্যালার্জি নেই");
	const [iceDistrict, setIceDistrict] = (0, import_react.useState)("ঢাকা, বাংলাদেশ");
	const [gratitudeNotes, setGratitudeNotes] = (0, import_react.useState)([]);
	const [gratAuthor, setGratAuthor] = (0, import_react.useState)("");
	const [gratDonor, setGratDonor] = (0, import_react.useState)("");
	const [gratGroup, setGratGroup] = (0, import_react.useState)("O+");
	const [gratHospital, setGratHospital] = (0, import_react.useState)("");
	const [gratMessage, setGratMessage] = (0, import_react.useState)("");
	const [isPostingGratitude, setIsPostingGratitude] = (0, import_react.useState)(false);
	const [verifyIdQuery, setVerifyIdQuery] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!isOpen) return;
		let unsub = null;
		try {
			unsub = subscribePublicGratitudeNotes(setGratitudeNotes);
		} catch {}
		return () => {
			if (unsub) unsub();
		};
	}, [isOpen]);
	const verifiedDonorMatch = (0, import_react.useMemo)(() => {
		const q = verifyIdQuery.trim().toLowerCase();
		if (q.length < 2) return null;
		return donors.find((d) => d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.phone.replace(/[^0-9]/g, "").includes(q.replace(/[^0-9]/g, ""))) || null;
	}, [verifyIdQuery, donors]);
	const handlePostGratitude = async (e) => {
		e.preventDefault();
		if (!gratDonor.trim() || !gratMessage.trim() || isPostingGratitude) return;
		setIsPostingGratitude(true);
		try {
			const res = await createGratitudeNoteInFirestore({
				authorName: gratAuthor.trim() || "রোগীর কৃতজ্ঞ পরিবার",
				donorName: gratDonor.trim(),
				bloodGroup: gratGroup,
				hospitalName: gratHospital.trim() || "হাসপাতাল ব্লাড ইউনিট",
				message: gratMessage.trim()
			});
			if (!res.syncedToCloud) setGratitudeNotes((prev) => [res.note, ...prev]);
			setGratDonor("");
			setGratHospital("");
			setGratMessage("");
			showTempNotice(lang === "bn" ? "✓ আপনার কৃতজ্ঞতা ও দোয়া বার্তা প্রকাশিত হয়েছে!" : "✓ Your gratitude note has been posted!");
		} catch (err) {
			showTempNotice(err?.message || "বার্তা পাঠাতে সমস্যা হয়েছে");
		} finally {
			setIsPostingGratitude(false);
		}
	};
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-3xl my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 text-left space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block",
						children: lang === "bn" ? "বাংলাদেশ ইমার্জেন্সি মেডিকেল টুলকিট" : "BANGLADESH EMERGENCY MEDICAL SUITE"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug",
						children: lang === "bn" ? "মাতৃত্ব সুরক্ষা, ডেঙ্গু ট্র্যাকার, অ্যাম্বুলেন্স ভাড়া ও আইডি হাব" : "Maternity Pool, Dengue Tracker, Fair Fare & ICE Hub"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0",
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none p-1 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800",
					children: [
						{
							id: "maternity",
							labelBn: "মাতৃত্ব স্ট্যান্ডবাই",
							labelEn: "Maternity Pool",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "w-3.5 h-3.5" })
						},
						{
							id: "dengue",
							labelBn: "ডেঙ্গু প্লাটিলেট",
							labelEn: "Dengue Monitor",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "w-3.5 h-3.5" })
						},
						{
							id: "ambulance",
							labelBn: "অ্যাম্বুলেন্স ও ফি চার্ট",
							labelEn: "Ambulance & Fees",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { className: "w-3.5 h-3.5" })
						},
						{
							id: "ice_wallpaper",
							labelBn: "লক-স্ক্রিন কার্ড",
							labelEn: "ICE Lock Card",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "w-3.5 h-3.5" })
						},
						{
							id: "diet",
							labelBn: "ডায়েট ও রমজান গাইড",
							labelEn: "Diet & Fasting",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Apple, { className: "w-3.5 h-3.5" })
						},
						{
							id: "gratitude",
							labelBn: "কৃতজ্ঞতা ও আইডি যাচাই",
							labelEn: "Gratitude & Verify",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-3.5 h-3.5" })
						}
					].map((tb) => {
						const active = activeTab === tb.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setActiveTab(tb.id),
							className: `min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${active ? "bg-rose-600 text-white shadow-xs" : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"}`,
							children: [tb.icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? tb.labelBn : tb.labelEn })]
						}, tb.id);
					})
				}),
				suiteNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold",
					children: suiteNotice
				}),
				activeTab === "maternity" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-black text-sm text-slate-900 dark:text-white",
									children: lang === "bn" ? "গর্ভবতী মায়ের ডেলিভারি স্ট্যান্ডবাই ডোনার প্ল্যানার" : "Safe Delivery Standby Donor Planner"
								}), eddDaysRemaining !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-bold font-mono text-rose-700 dark:text-rose-300",
									children: eddDaysRemaining >= 0 ? lang === "bn" ? `সম্ভাব্য ডেলিভারির বাকি: ${eddDaysRemaining} দিন` : `${eddDaysRemaining} days until EDD` : lang === "bn" ? "ডেলিভারি সময় উপস্থিত!" : "Delivery window active!"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-600 dark:text-slate-300 leading-relaxed",
								children: lang === "bn" ? "সিজারিয়ান বা নরমাল ডেলিভারির সময় হঠাৎ রক্তক্ষরণ (PPH) সামলাতে আগে থেকেই অন্তত ২-৩ জন ম্যাচিং রক্তদাতা স্ট্যান্ডবাই রাখুন, যাতে শেষ মুহূর্তে হাসপাতালে ছোটাছুটি করতে না হয়।" : "Keep 2–3 pre-matched donors ready before expected delivery date to prevent postpartum hemorrhage emergencies."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
								children: lang === "bn" ? "গর্ভবতী মায়ের নাম" : "Mother Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "maternityMotherName",
								type: "text",
								value: maternityPlan.motherName,
								onChange: (e) => setMaternityPlan((p) => ({
									...p,
									motherName: e.target.value
								})),
								placeholder: lang === "bn" ? "যেমন: ফারহানা ইয়াসমিন" : "Mother full name",
								className: "w-full h-10 px-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: lang === "bn" ? "রক্তের গ্রুপ" : "Blood Group"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									name: "maternityBloodGroup",
									value: maternityPlan.bloodGroup,
									onChange: (e) => setMaternityPlan((p) => ({
										...p,
										bloodGroup: e.target.value
									})),
									className: "w-full h-10 px-2.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white",
									children: ALL_BLOOD_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: g,
										children: g
									}, g))
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: lang === "bn" ? "সম্ভাব্য তারিখ (EDD)" : "Expected Date"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "maternityEddDate",
									type: "date",
									value: maternityPlan.eddDate,
									onChange: (e) => setMaternityPlan((p) => ({
										...p,
										eddDate: e.target.value
									})),
									className: "w-full h-10 px-2 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
								})] })]
							})]
						}),
						isMotherRhNegative && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-4 h-4 text-amber-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? `জরুরি সতর্কতা: মায়ের রক্ত নেগেটিভ (${maternityPlan.bloodGroup}) — Anti-D ইনজেকশন গাইড` : `Rh-Negative Mother (${maternityPlan.bloodGroup}) — Anti-D Injection Alert` })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amber-900/90 dark:text-amber-200/90 leading-relaxed",
								children: lang === "bn" ? "মা নেগেটিভ এবং বাবা পজিটিভ হলে গর্ভের ২৮ সপ্তাহে এবং সন্তান জন্মের ৭২ ঘণ্টার মধ্যে গাইনোকোলজিস্টের পরামর্শে অবশ্যই Anti-D (Rhogam) ইনজেকশন নিশ্চিত করুন এবং অন্তত ২ জন নেগেটিভ ডোনার আগে থেকে বুক রাখুন।" : "Consult your obstetrician regarding routine 28-week and post-delivery (within 72h) Anti-D Immunoglobulin prophylaxis, and secure 2 Rh-negative donors early."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleAddStandbyDonor,
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-bold text-slate-900 dark:text-white",
								children: lang === "bn" ? "+ নতুন স্ট্যান্ডবাই রক্তদাতা যুক্ত করুন" : "+ Add Standby Delivery Donor"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-4 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "standbyDonorName",
										type: "text",
										required: true,
										value: sbName,
										onChange: (e) => setSbName(e.target.value),
										placeholder: lang === "bn" ? "ডোনারের নাম" : "Donor Name",
										className: "h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "standbyDonorPhone",
										type: "tel",
										required: true,
										value: sbPhone,
										onChange: (e) => setSbPhone(e.target.value),
										placeholder: "+88017XXXXXXXX",
										className: "h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										name: "standbyDonorGroup",
										value: sbGroup,
										onChange: (e) => setSbGroup(e.target.value),
										className: "h-10 px-2.5 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white",
										children: ALL_BLOOD_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: g,
											children: g
										}, g))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "submit",
										className: "h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "যুক্ত করুন" : "Add" })]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: maternityPlan.standbyDonors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-4 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400",
								children: lang === "bn" ? "এখনও কোনো স্ট্যান্ডবাই রক্তদাতা যোগ করা হয়নি। উপরের ফর্মে প্রকৃত রক্তদাতার নাম ও ১১ ডিজিটের মোবাইল নম্বর যোগ করুন।" : "No standby donors added yet. Add real standby donors with their 11-digit mobile numbers above."
							}) : maternityPlan.standbyDonors.map((d) => {
								const hospLabel = maternityPlan.hospitalName || "হাসপাতাল";
								const smsLink = buildOfflineEmergencySmsUri(d.phone, `আসসালামু আলাইকুম ${d.name}, জরুরি ডেলিভারির জন্য হাসপাতালে (${hospLabel}) আপনার ${d.bloodGroup} রক্ত প্রয়োজন। অনুগ্রহ করে যোগাযোগ করুন।`);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2.5 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-9 h-9 rounded-xl bg-rose-600 text-white font-black flex items-center justify-center shrink-0",
											children: d.bloodGroup
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-bold text-slate-900 dark:text-white truncate",
												children: d.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-[11px] text-slate-500 font-mono tabular-nums truncate",
												children: [
													formatBangladeshPhoneDisplay(d.phone),
													" · ",
													d.relationNote
												]
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 shrink-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: async () => {
													await copyTextReliable(d.phone);
													showTempNotice(lang === "bn" ? "✓ নম্বর কপি হয়েছে!" : "✓ Phone copied!");
												},
												className: "min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold inline-flex items-center gap-1 cursor-pointer",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-3.5 h-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: `tel:${d.phone.replace(/[^0-9+]/g, "")}`,
												className: "min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold inline-flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "কল" : "Call" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: smsLink,
												className: "min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-white font-bold inline-flex items-center gap-1",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SMS" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: buildWhatsAppChatUrl(d.phone, `আসসালামু আলাইকুম ${d.name}, ডেলিভারি স্ট্যান্ডবাই রক্তদাতা হিসেবে আপনাকে স্মরণ করিয়ে দিচ্ছি (${hospLabel})।`),
												target: "_blank",
												rel: "noopener noreferrer",
												className: "min-h-[36px] px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold inline-flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WA" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setMaternityPlan((p) => ({
													...p,
													standbyDonors: p.standbyDonors.filter((x) => x.id !== d.id)
												})),
												className: "min-h-[36px] min-w-[36px] rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer",
												"aria-label": "Remove standby donor",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5" })
											})
										]
									})]
								}, d.id);
							})
						})
					]
				}),
				activeTab === "dengue" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-bold text-slate-500 block",
									children: lang === "bn" ? "সর্বশেষ প্লাটিলেট কাউন্ট" : "Latest Platelet Count"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white",
									children: [
										latestDengue.platelets.toLocaleString(),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-normal text-slate-500",
											children: "/µL"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-bold mt-1",
									children: latestDengue.platelets < 2e4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-red-600 dark:text-red-400",
										children: "🚨 ক্রিটিক্যাল বিপদ সীমা (<20,000) — দ্রুত ডাক্তারের পরামর্শে SDP/RDP প্লাটিলেট প্রস্তুত রাখুন!"
									}) : latestDengue.platelets < 5e4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-amber-600 dark:text-amber-400",
										children: "⚠ হাসপাতাল পর্যবেক্ষণ সীমা (<50,000) — রক্তক্ষরণ লক্ষণ ও HCT % নিয়মিত মনিটর করুন।"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-emerald-600 dark:text-emerald-400",
										children: "✓ স্থিতিশীল সীমা — প্রচুর তরল খাবার (ওরস্যালাইন, ডাবের পানি) চালিয়ে যান।"
									})
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									onClose();
									onOpenSOSWizard();
								},
								className: "min-h-[42px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm",
								children: lang === "bn" ? "🆘 জরুরি প্লাটিলেট SOS পাঠান" : "🆘 Request SDP Platelet SOS"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleAddDengueLog,
							className: "p-3.5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-bold text-slate-900 dark:text-white",
								children: lang === "bn" ? "নতুন সিবিসি (CBC) রিপোর্ট লগ করুন:" : "Log Latest CBC Report:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-4 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] text-slate-500 block mb-1",
										children: "Platelets (/µL)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "denguePlatelets",
										type: "number",
										required: true,
										value: pltInput,
										onChange: (e) => setPltInput(e.target.value),
										className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] text-slate-500 block mb-1",
										children: "Hematocrit (HCT %)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "dengueHct",
										type: "number",
										step: "0.1",
										value: hctInput,
										onChange: (e) => setHctInput(e.target.value),
										className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] text-slate-500 block mb-1",
										children: "Hemoglobin (g/dL)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "dengueHemoglobin",
										type: "number",
										step: "0.1",
										value: hbInput,
										onChange: (e) => setHbInput(e.target.value),
										className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											className: "w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer",
											children: lang === "bn" ? "+ রিপোর্ট যোগ করুন" : "+ Save CBC"
										})
									})
								]
							})]
						}),
						dengueLogs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400",
							children: lang === "bn" ? "এখনও কোনো সিবিসি (CBC) রিপোর্ট লগ করা হয়নি। উপরের ফর্মে রোগীর প্লাটিলেট কাউন্ট লিখে \"+ রিপোর্ট যোগ করুন\" বাটনে ক্লিক করুন।" : "No CBC reports logged yet. Enter the patient’s platelet count above and tap \"+ Save CBC\"."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs",
							children: dengueLogs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 bg-white dark:bg-[#0f172a] flex items-center justify-between gap-2 font-mono tabular-nums",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-sans font-semibold text-slate-700 dark:text-slate-300",
										children: item.dateLabel
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `font-bold ${item.platelets < 2e4 ? "text-red-600" : item.platelets < 5e4 ? "text-amber-600" : "text-emerald-600"}`,
										children: ["PLT: ", item.platelets.toLocaleString()]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-slate-600 dark:text-slate-400",
										children: [
											"HCT: ",
											item.hctPercent,
											"%"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-slate-600 dark:text-slate-400",
										children: ["Hb: ", item.hemoglobin]
									})
								]
							}, item.id))
						})
					]
				}),
				activeTab === "ambulance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-black text-sm text-slate-900 dark:text-white",
										children: lang === "bn" ? "অ্যাম্বুলেন্স ন্যায্য ভাড়া ক্যালকুলেটর (সিন্ডিকেট প্রতিরোধে)" : "Fair Ambulance Fare Estimator"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-slate-500",
										children: lang === "bn" ? "হাসপাতাল দালালদের অতিরিক্ত ভাড়া দাবি যাচাই করতে দূরত্ব ও ধরন নির্বাচন করুন" : "Estimate standard Bangladesh ambulance fare by distance & life-support tier"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right font-mono",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-slate-500 block",
											children: "সম্ভাব্য ন্যায্য ভাড়া"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-lg font-black text-emerald-600 dark:text-emerald-400",
											children: [
												"৳",
												estimatedFareRange.min.toLocaleString(),
												" – ৳",
												estimatedFareRange.max.toLocaleString()
											]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 sm:grid-cols-4 gap-2",
									children: [
										{
											id: "NON_AC",
											label: "Non-AC সাধারণ"
										},
										{
											id: "AC",
											label: "AC অ্যাম্বুলেন্স"
										},
										{
											id: "ICU",
											label: "Cardiac / ICU ভ্যান"
										},
										{
											id: "FREEZER",
											label: "ফ্রিজার ভ্যান"
										}
									].map((tItem) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setAmbType(tItem.id),
										className: `min-h-[38px] px-2.5 py-1.5 rounded-xl font-bold cursor-pointer border ${ambType === tItem.id ? "bg-rose-600 text-white border-rose-600" : "bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"}`,
										children: tItem.label
									}, tItem.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between font-bold mb-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "দূরত্ব (কিলোমিটার)" : "Distance (km)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-rose-600",
										children: [ambDistanceKm, " km"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "ambulanceDistanceKm",
									type: "range",
									min: 5,
									max: 350,
									step: 5,
									value: ambDistanceKm,
									onChange: (e) => setAmbDistanceKm(Number(e.target.value)),
									className: "w-full accent-rose-600 cursor-pointer"
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-black text-sm text-slate-900 dark:text-white",
								children: lang === "bn" ? "সরকারি ও অনুমোদিত ব্লাড স্ক্রিনিং / ক্রস-ম্যাচিং নির্ধারিত ফি চার্ট:" : "Official Blood Screening & Cross-Match Fee Reference:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-bold text-emerald-800 dark:text-emerald-300",
												children: "সরকারি মেডিকেল কলেজ হাসপাতাল"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-base font-black font-mono text-slate-900 dark:text-white mt-1",
												children: "৳২৫০ – ৳৫০০"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-slate-600 dark:text-slate-400 mt-0.5",
												children: "৫টি বাধ্যতামূলক টেস্ট ও ব্যাগ চার্জ (সন্ধানী/মেডিসিন ক্লাবে অনেক ক্ষেত্রে আরও কম)"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-bold text-blue-800 dark:text-blue-300",
												children: "রেড ক্রিসেন্ট ও কোয়ান্টাম ল্যাব"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-base font-black font-mono text-slate-900 dark:text-white mt-1",
												children: "৳৪৫০ – ৳১,১০০"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-slate-600 dark:text-slate-400 mt-0.5",
												children: "PRBC / FFP / Whole Blood প্রসেসিং ও কম্পোনেন্ট সেপারেশন চার্জ"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-bold text-amber-800 dark:text-amber-300",
												children: "প্রাইভেট হাসপাতাল ও SDP প্লাটিলেট"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-base font-black font-mono text-slate-900 dark:text-white mt-1",
												children: "৳১,২০০ – ৳২,৫০০+"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-slate-600 dark:text-slate-400 mt-0.5",
												children: "সাধারণ ক্রস-ম্যাচ ১.২–২.৫ হাজার; অ্যাফেরেসিস কিট আলাদা (সরকারি হাসপাতালে কম)"
											})
										]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
							children: [
								{
									name: "জাতীয় জরুরি অ্যাম্বুলেন্স ও পুলিশ সহায়তা",
									phone: "999"
								},
								{
									name: "স্বাস্থ্য বাতায়ন ২৪/৭ ICU ও ডাক্তার পরামর্শ",
									phone: "16263"
								},
								{
									name: "কোয়ান্টাম ল্যাব ২৪/৭ ব্লাড ও কম্পোনেন্ট হটলাইন",
									phone: "+8801714010869"
								},
								{
									name: "রেড ক্রিসেন্ট কেন্দ্রীয় ব্লাড ব্যাংক (ঢাকা)",
									phone: "+880248110184"
								}
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `tel:${h.phone}`,
								className: "p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 hover:border-rose-500",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900 dark:text-white",
									children: h.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-bold shrink-0",
									children: ["☎ ", h.phone]
								})]
							}, h.phone))
						})
					]
				}),
				activeTab === "ice_wallpaper" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-black text-sm",
							children: lang === "bn" ? "মোবাইল লক-স্ক্রিন জরুরি মেডিকেল কার্ড (1080×1920 HD .PNG)" : "Phone Lock-Screen Emergency Medical Wallpaper"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-slate-300 mt-0.5",
							children: lang === "bn" ? "রাস্তায় দুর্ঘটনা বা অচেতন অবস্থায় ফোন আনলক না করেই যেন যে কেউ আপনার রক্তের গ্রুপ ও অভিভাবকের নম্বর দেখতে পান।" : "Allows paramedics & bystanders to read your Blood Group & ICE Guardian phone without unlocking your phone."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								downloadIceLockScreenWallpaperPng({
									fullName: iceName,
									bloodGroup: iceGroup,
									guardianName: iceGuardian,
									guardianPhone: icePhone,
									secondaryPhone: iceSecondPhone,
									medicalConditions: iceConditions,
									allergies: iceAllergies,
									district: iceDistrict
								});
								showTempNotice(lang === "bn" ? "✓ আপনার HD লক-স্ক্রিন ওয়ালপেপার (.PNG) ডাউনলোড হয়েছে!" : "✓ Lock-Screen ICE Wallpaper (.PNG) downloaded!");
							},
							className: "min-h-[42px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center gap-2 cursor-pointer shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? ".PNG ওয়ালপেপার ডাউনলোড" : "Download .PNG" })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
								children: "আপনার পূর্ণ নাম"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "iceFullName",
								type: "text",
								value: iceName,
								onChange: (e) => setIceName(e.target.value),
								className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: "রক্তের গ্রুপ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									name: "iceBloodGroup",
									value: iceGroup,
									onChange: (e) => setIceGroup(e.target.value),
									className: "w-full h-10 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white",
									children: ALL_BLOOD_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: g,
										children: g
									}, g))
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: "জেলা / ঠিকানা"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "iceDistrict",
									type: "text",
									value: iceDistrict,
									onChange: (e) => setIceDistrict(e.target.value),
									className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
								children: "জরুরি অভিভাবকের নাম ও সম্পর্ক"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "iceGuardianName",
								type: "text",
								value: iceGuardian,
								onChange: (e) => setIceGuardian(e.target.value),
								className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: "জরুরি মোবাইল নম্বর"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "iceGuardianPhone",
									type: "tel",
									value: icePhone,
									onChange: (e) => setIcePhone(e.target.value),
									className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: "বিকল্প নম্বর (ঐচ্ছিক)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "iceSecondPhone",
									type: "tel",
									value: iceSecondPhone,
									onChange: (e) => setIceSecondPhone(e.target.value),
									placeholder: "+88018...",
									className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
								children: "রোগের তথ্য (ডায়াবেটিস / অ্যাজমা / প্রেসার)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "iceConditions",
								type: "text",
								value: iceConditions,
								onChange: (e) => setIceConditions(e.target.value),
								className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-slate-700 dark:text-slate-300 block mb-1",
								children: "ওষুধ বা খাবারে অ্যালার্জি"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "iceAllergies",
								type: "text",
								value: iceAllergies,
								onChange: (e) => setIceAllergies(e.target.value),
								className: "w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] })
						]
					})]
				}),
				activeTab === "diet" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3.5 text-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-black text-emerald-900 dark:text-emerald-200",
									children: "১. রক্তদানের প্রথম ২৪ ঘণ্টা (ফ্লুইড রিকভারি)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-700 dark:text-slate-300 leading-relaxed",
									children: "রক্ত দেওয়ার পর ১০-১৫ মিনিট শুয়ে বিশ্রাম নিন। অন্তত ৮-১০ গ্লাস পানি, ডাবের পানি, ফলের রস বা ওরস্যালাইন পান করুন। ৪ ঘণ্টা ভারী ওজন তোলা বা ধূমপান এড়িয়ে চলুন।"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-black text-rose-900 dark:text-rose-200",
									children: "২. ৭ দিনের হিমোগ্লোবিন ও আয়রন ডায়েট (দেশি খাবার)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-700 dark:text-slate-300 leading-relaxed",
									children: "কচুশাক, পালংশাক, ডালিম/বেদানা, খেজুর, কিসমিস, কলিজা, শিং-মাগুর মাছ ও ডিম খান। খাবারের সাথে এক টুকরো লেবু (Vitamin-C) খেলে আয়রন শোষণ ৩ গুণ বাড়ে!"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-black text-amber-900 dark:text-amber-200",
									children: "৩. সতর্কতা: খাবারের পরপরই চা/কফি পান নিষেধ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-700 dark:text-slate-300 leading-relaxed",
									children: "দুপুর বা রাতের খাবারের অন্তত ১ ঘণ্টা আগে ও পরে চা বা কফি পান করবেন না—চায়ে থাকা ট্যানিন খাবারের আয়রন শরীরে শোষিত হতে বাধা দেয়।"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-black text-blue-900 dark:text-blue-200",
									children: "৪. পবিত্র রমজান ও রোজা অবস্থায় রক্তদান গাইড"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-700 dark:text-slate-300 leading-relaxed",
									children: "ইফতারের ৩০-৪৫ মিনিট পর থেকে তারাবির পর পর্যন্ত রক্ত দেওয়ার সবচেয়ে নিরাপদ সময়। সেহরিতে পর্যাপ্ত পানি ও খেজুর খান; দিনের বেলায় একান্ত জীবন-মরণ জরুরি না হলে ইফতারের পর রক্ত দিন।"
								})]
							})
						]
					})
				}),
				activeTab === "gratitude" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-black text-slate-900 dark:text-white flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-4 h-4 text-emerald-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "স্মার্ট ডোনার আইডি / নাম যাচাই করুন" : "Verify Smart Donor ID or Name" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4 text-slate-400 absolute left-3 top-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "verifyDonorIdQuery",
										type: "text",
										value: verifyIdQuery,
										onChange: (e) => setVerifyIdQuery(e.target.value),
										placeholder: lang === "bn" ? "ডোনারের নাম বা আইডি লিখুন (যেমন: কামাল / তানভীর)..." : "Enter Donor Name or Smart ID...",
										className: "w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
									})]
								}),
								verifyIdQuery.trim().length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: verifiedDonorMatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-black text-emerald-800 dark:text-emerald-300",
										children: [
											"✓ নিবন্ধিত রক্তদাতা: ",
											verifiedDonorMatch.name,
											" (",
											verifiedDonorMatch.bloodGroup,
											")"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-[11px] text-slate-600 dark:text-slate-400",
										children: [
											"মোট রক্তদান: ",
											verifiedDonorMatch.totalDonations,
											" বার · জেলা:",
											" ",
											verifiedDonorMatch.district
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-5 h-5 text-emerald-600 shrink-0" })]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-amber-600 dark:text-amber-400 font-semibold",
									children: "এই নামে বা আইডিতে কোনো পাবলিক ডোনার কার্ড পাওয়া যায়নি।"
								}) })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handlePostGratitude,
							className: "p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/60 space-y-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-black text-slate-900 dark:text-white",
									children: lang === "bn" ? "🤲 রক্তদাতার প্রতি কৃতজ্ঞতা ও দোয়া বার্তা লিখুন" : "🤲 Post a Gratitude & Blessing Note for a Donor"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 sm:grid-cols-3 gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											name: "gratitudeAuthor",
											type: "text",
											value: gratAuthor,
											onChange: (e) => setGratAuthor(e.target.value),
											placeholder: lang === "bn" ? "আপনার নাম (রোগীর স্বজন)" : "Your Name",
											className: "h-9 px-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											name: "gratitudeDonorName",
											type: "text",
											required: true,
											value: gratDonor,
											onChange: (e) => setGratDonor(e.target.value),
											placeholder: lang === "bn" ? "রক্তদাতার নাম *" : "Donor Name *",
											className: "h-9 px-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												name: "gratitudeBloodGroup",
												value: gratGroup,
												onChange: (e) => setGratGroup(e.target.value),
												className: "w-20 h-9 px-2 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white",
												children: ALL_BLOOD_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: g,
													children: g
												}, g))
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												name: "gratitudeHospital",
												type: "text",
												value: gratHospital,
												onChange: (e) => setGratHospital(e.target.value),
												placeholder: lang === "bn" ? "হাসপাতাল" : "Hospital",
												className: "flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white min-w-0"
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col sm:flex-row gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "gratitudeMessage",
										type: "text",
										required: true,
										value: gratMessage,
										onChange: (e) => setGratMessage(e.target.value),
										placeholder: lang === "bn" ? "আপনার দোয়া ও অনুভূতির কথা লিখুন..." : "Write your thank-you message...",
										className: "flex-1 h-10 px-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										disabled: isPostingGratitude,
										className: "min-h-[40px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shrink-0",
										children: isPostingGratitude ? lang === "bn" ? "প্রকাশ হচ্ছে..." : "Posting..." : lang === "bn" ? "প্রকাশ করুন" : "Publish"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5 max-h-64 overflow-y-auto pr-1",
							children: gratitudeNotes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-black text-rose-600 dark:text-rose-400",
											children: [
												"রক্তযোদ্ধা: ",
												n.donorName,
												" (",
												n.bloodGroup,
												")"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[11px] text-slate-400",
											children: [
												n.hospitalName,
												" · ",
												n.timeLabel
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-slate-700 dark:text-slate-200 leading-relaxed",
										children: [
											"“",
											n.message,
											"”"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-slate-500 font-semibold",
										children: ["— ", n.authorName]
									})
								]
							}, n.id))
						})
					]
				})
			]
		})
	});
};
export { EmergencyCareSuiteModal };
