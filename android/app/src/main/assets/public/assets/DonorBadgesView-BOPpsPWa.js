import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { t as Award } from "./award-D_tr_4pI.js";
import { C as auth, H as onAuthStateChanged, It as getStoredDonationLogs, Jn as CircleCheck, Pn as Lock, Un as Download, ar as isFakePersonName, cn as X, mn as Sparkles } from "./index-BZGxtQ_X.js";
// src/data/mockEnterpriseData.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* Clean Badge Milestone Catalog (Zero fake unlocked dates or pre-unlocked states).
* Actual unlock status is computed dynamically from the signed-in user's real donation history.
*/
var ENTERPRISE_BADGES = [
	{
		id: "badge-s1",
		title: "Silver Badge Level 1",
		category: "SILVER",
		level: 1,
		iconColor: "#3b82f6",
		unlocked: false,
		requirements: [
			"Complete 1 verified voluntary blood donation",
			"Verify phone number & profile details",
			"Maintain eligible health screening status"
		]
	},
	{
		id: "badge-s2",
		title: "Silver Badge Level 2",
		category: "SILVER",
		level: 2,
		iconColor: "#3b82f6",
		unlocked: false,
		requirements: ["Complete 2 verified voluntary blood donations", "Respond to an emergency blood request"]
	},
	{
		id: "badge-s3",
		title: "Silver Badge Level 3",
		category: "SILVER",
		level: 3,
		iconColor: "#3b82f6",
		unlocked: false,
		requirements: ["Complete 3 verified voluntary blood donations", "Maintain active availability profile"]
	},
	{
		id: "badge-g1",
		title: "Gold Badge Level 1",
		category: "GOLD",
		level: 1,
		iconColor: "#e11d48",
		unlocked: false,
		requirements: ["Reach 5 total lifetime donations", "Respond to a hospital emergency request"]
	},
	{
		id: "badge-g2",
		title: "Gold Badge Level 2",
		category: "GOLD",
		level: 2,
		iconColor: "#e11d48",
		unlocked: false,
		requirements: ["Reach 8 verified blood donations", "Maintain accurate recovery cycle records"]
	},
	{
		id: "badge-g3",
		title: "Gold Badge Level 3",
		category: "GOLD",
		level: 3,
		iconColor: "#e11d48",
		unlocked: false,
		requirements: ["Reach 10 total blood donations", "Inspire fellow voluntary donors in your district"]
	},
	{
		id: "badge-p1",
		title: "Platinum Badge Level 1",
		category: "PLATINUM",
		level: 1,
		iconColor: "#64748b",
		unlocked: false,
		requirements: ["Reach 15 verified donations across Bangladesh", "Sustained multi-year voluntary donor service"]
	},
	{
		id: "badge-p2",
		title: "Platinum Badge Level 2",
		category: "PLATINUM",
		level: 2,
		iconColor: "#64748b",
		unlocked: false,
		requirements: ["Reach 20 verified donations", "Consistent emergency hospital support"]
	},
	{
		id: "badge-p3",
		title: "Platinum Badge Level 3",
		category: "PLATINUM",
		level: 3,
		iconColor: "#64748b",
		unlocked: false,
		requirements: ["Reach 25 lifetime donations", "National voluntary blood service milestone"]
	},
	{
		id: "badge-d1",
		title: "Diamond Badge Level 1",
		category: "DIAMOND",
		level: 1,
		iconColor: "#0ea5e9",
		unlocked: false,
		requirements: ["Reach 30 lifetime donations", "Humanitarian voluntary blood service"]
	},
	{
		id: "badge-d2",
		title: "Diamond Badge Level 2",
		category: "DIAMOND",
		level: 2,
		iconColor: "#0ea5e9",
		unlocked: false,
		requirements: ["Reach 40 lifetime donations", "Community blood donor mentor"]
	},
	{
		id: "badge-d3",
		title: "Diamond Badge Level 3",
		category: "DIAMOND",
		level: 3,
		iconColor: "#0ea5e9",
		unlocked: false,
		requirements: ["Lifetime achievement: 50+ verified donations", "Extraordinary voluntary service to patients"]
	}
];
// src/components/donor/DonorBadgesView.tsx
var import_jsx_runtime = require_jsx_runtime();
var BADGE_DONATION_THRESHOLDS = {
	"badge-s1": 1,
	"badge-s2": 2,
	"badge-s3": 3,
	"badge-g1": 5,
	"badge-g2": 8,
	"badge-g3": 10,
	"badge-p1": 15,
	"badge-p2": 20,
	"badge-p3": 25,
	"badge-d1": 30,
	"badge-d2": 40,
	"badge-d3": 50
};
var DonorBadgesView = ({ lang }) => {
	const [activeFilter, setActiveFilter] = (0, import_react.useState)("ALL");
	const [selectedBadge, setSelectedBadge] = (0, import_react.useState)(null);
	const [downloadSuccess, setDownloadSuccess] = (0, import_react.useState)(false);
	const [currentUser, setCurrentUser] = (0, import_react.useState)(() => {
		try {
			const saved = localStorage.getItem("bloodsearch_current_user");
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed && !isFakePersonName(parsed.name)) return parsed;
			}
		} catch {}
		return null;
	});
	const [donationLogs, setDonationLogs] = (0, import_react.useState)(() => getStoredDonationLogs());
	(0, import_react.useEffect)(() => {
		const syncState = () => {
			try {
				const saved = localStorage.getItem("bloodsearch_current_user");
				const parsed = saved ? JSON.parse(saved) : null;
				setCurrentUser(parsed && !isFakePersonName(parsed.name) ? parsed : null);
				setDonationLogs(getStoredDonationLogs());
			} catch {}
		};
		const unsub = onAuthStateChanged(auth, () => syncState());
		window.addEventListener("bloodsearch_user_changed", syncState);
		return () => {
			unsub();
			window.removeEventListener("bloodsearch_user_changed", syncState);
		};
	}, []);
	const realDonationCount = (0, import_react.useMemo)(() => {
		if (!currentUser) return 0;
		const fromProfile = Math.max(0, Number(currentUser.totalDonations) || 0);
		return Math.max(fromProfile, donationLogs.length);
	}, [currentUser, donationLogs]);
	const computedBadges = (0, import_react.useMemo)(() => {
		const latestDate = donationLogs[0]?.date ? new Date(donationLogs[0].date).toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		}) : void 0;
		return ENTERPRISE_BADGES.map((badge) => {
			const requiredCount = BADGE_DONATION_THRESHOLDS[badge.id] ?? 999;
			const isUnlocked = Boolean(currentUser) && realDonationCount >= requiredCount;
			return {
				...badge,
				unlocked: isUnlocked,
				unlockedDate: isUnlocked ? latestDate || "Verified" : void 0
			};
		});
	}, [
		currentUser,
		realDonationCount,
		donationLogs
	]);
	const filteredBadges = computedBadges.filter((b) => {
		if (activeFilter === "EARNED") return b.unlocked;
		if (activeFilter === "LOCKED") return !b.unlocked;
		return true;
	});
	const unlockedTotal = computedBadges.filter((b) => b.unlocked).length;
	const categories = [
		"SILVER",
		"GOLD",
		"PLATINUM",
		"DIAMOND"
	];
	const handleDownloadCertificate = () => {
		setDownloadSuccess(true);
		setTimeout(() => setDownloadSuccess(false), 2500);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-5 h-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white",
							children: lang === "bn" ? "আমার ব্যাজ ও সম্মাননা" : "My Badges & Honors"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1",
						children: lang === "bn" ? `আপনার প্রকৃত রক্তদানের সংখ্যা (${realDonationCount}) অনুযায়ী স্বয়ংক্রিয়ভাবে ব্যাজ আনলক হয়` : `Automatically unlocked from your verified donation count (${realDonationCount})`
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs font-mono font-bold text-slate-500 dark:text-slate-400",
						children: [
							unlockedTotal,
							" / ",
							computedBadges.length,
							" ",
							lang === "bn" ? "টি অর্জিত" : "Unlocked"
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pt-4 flex flex-wrap items-center gap-2",
					children: [
						"ALL",
						"EARNED",
						"LOCKED"
					].map((filter) => {
						const isSelected = activeFilter === filter;
						const labels = {
							ALL: lang === "bn" ? "সকল ব্যাজ (All)" : "All Badges",
							EARNED: lang === "bn" ? `অর্জিত (${unlockedTotal})` : `Earned (${unlockedTotal})`,
							LOCKED: lang === "bn" ? `লকড (${computedBadges.length - unlockedTotal})` : `Locked (${computedBadges.length - unlockedTotal})`
						};
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setActiveFilter(filter),
							className: `px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${isSelected ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
							children: labels[filter]
						}, filter);
					})
				})]
			}),
			filteredBadges.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-center space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-8 h-8 text-slate-400 mx-auto" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-bold text-slate-900 dark:text-white",
						children: lang === "bn" ? "এখনো কোনো ব্যাজ আনলক হয়নি" : "No Badges Unlocked Yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto",
						children: lang === "bn" ? "আপনার প্রথম রক্তদান সম্পন্ন করে প্রোফাইলে রেকর্ড করলেই Silver Badge Level 1 আনলক হবে।" : "Complete and log your first voluntary blood donation in your profile to unlock Silver Badge Level 1."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-6",
				children: categories.map((cat) => {
					const catBadges = filteredBadges.filter((b) => b.category === cat);
					if (catBadges.length === 0) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400",
							children: [cat, " BADGES"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 sm:grid-cols-3 gap-2.5",
							children: catBadges.map((badge) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								onClick: () => setSelectedBadge(badge),
								className: `p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex flex-col items-center justify-between text-center group cursor-pointer hover:scale-[1.01] relative ${badge.unlocked ? "hover:border-rose-400" : "opacity-75 grayscale-[35%] hover:grayscale-0"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute top-3 right-3",
										children: badge.unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm",
											children: "✓"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-3 h-3" })
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "my-2 relative flex flex-col items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${badge.category === "SILVER" ? "bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-400 text-slate-700" : badge.category === "GOLD" ? "bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 text-amber-900" : badge.category === "PLATINUM" ? "bg-gradient-to-tr from-cyan-200 via-slate-100 to-cyan-500 text-slate-800" : "bg-gradient-to-tr from-sky-400 via-blue-200 to-indigo-600 text-white"}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "w-9 h-9" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "mt-1.5 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300",
											children: ["Level ", badge.level]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-xs sm:text-sm text-slate-900 dark:text-white",
											children: badge.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mt-1 hover:underline",
											children: lang === "bn" ? "শর্তাবলী দেখুন →" : "See Requirements →"
										})]
									})
								]
							}, badge.id))
						})]
					}, cat);
				})
			}),
			selectedBadge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80",
				onClick: () => setSelectedBadge(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-3xl bg-white dark:bg-[#1e293b] p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-center space-y-4",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSelectedBadge(null),
								className: "p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: selectedBadge.unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"Unlocked (",
								selectedBadge.unlockedDate,
								")"
							] })]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1.5 text-slate-500 font-bold text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Locked" })]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 text-amber-900 flex items-center justify-center shadow-xl ring-8 ring-amber-400/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "w-14 h-14" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight",
							children: selectedBadge.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-slate-400 font-mono",
							children: ["Category: ", selectedBadge.category]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-left p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-black uppercase tracking-wider text-slate-500 block",
								children: "REQUIREMENTS:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "text-xs text-slate-700 dark:text-slate-300 space-y-2",
								children: selectedBadge.requirements.map((req, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-rose-500 font-bold mt-0.5",
										children: "•"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: req })]
								}, i))
							})]
						}),
						selectedBadge.unlocked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleDownloadCertificate,
							className: "w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: downloadSuccess ? "Certificate Ready" : "Download Certificate" })]
						})
					]
				})
			})
		]
	});
};
export { DonorBadgesView };
