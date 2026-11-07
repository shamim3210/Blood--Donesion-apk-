import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { An as MapPin, Jn as CircleCheck, Zn as ChevronRight, cn as X, hn as ShieldCheck, on as BrandLogo } from "./index-BZGxtQ_X.js";
// src/components/donor/BloodHelpOnboardingView.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var BloodHelpOnboardingView = ({ lang, onSelectGroup, onOpenSOSModal }) => {
	const [selectedGroup, setSelectedGroup] = (0, import_react.useState)("B+");
	const [currentStep, setCurrentStep] = (0, import_react.useState)("URGENT_FEED");
	const [detailModalOpen, setDetailModalOpen] = (0, import_react.useState)(false);
	const [donateSuccess, setDonateSuccess] = (0, import_react.useState)(false);
	const groups = [
		{
			group: "A+",
			letter: "A",
			posNeg: "Pos"
		},
		{
			group: "A-",
			letter: "A",
			posNeg: "Neg"
		},
		{
			group: "B+",
			letter: "B",
			posNeg: "Pos"
		},
		{
			group: "B-",
			letter: "B",
			posNeg: "Neg"
		},
		{
			group: "O+",
			letter: "O",
			posNeg: "Pos"
		},
		{
			group: "O-",
			letter: "O",
			posNeg: "Neg"
		},
		{
			group: "AB+",
			letter: "AB",
			posNeg: "Pos"
		},
		{
			group: "AB-",
			letter: "AB",
			posNeg: "Neg"
		}
	];
	const handleDonateNow = () => {
		setDonateSuccess(true);
		setTimeout(() => {
			setDonateSuccess(false);
			setDetailModalOpen(false);
		}, 2e3);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-md mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setCurrentStep("TYPE_PICKER"),
					className: `px-4 py-2 rounded-xl transition-all cursor-pointer ${currentStep === "TYPE_PICKER" ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm" : "text-slate-500"}`,
					children: lang === "bn" ? "রক্তের গ্রুপ বাছাই" : "What's Your Blood Type?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setCurrentStep("URGENT_FEED"),
					className: `px-4 py-2 rounded-xl transition-all cursor-pointer ${currentStep === "URGENT_FEED" ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm" : "text-slate-500"}`,
					children: lang === "bn" ? "কাছের জরুরি আবেদন" : "Urgent Near You"
				})]
			}),
			currentStep === "TYPE_PICKER" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-300 dark:border-slate-700 text-left space-y-5 animate-in fade-in",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
								variant: "lockup",
								size: "sm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-black text-slate-900 dark:text-white leading-tight",
								children: lang === "bn" ? "আপনার রক্তের গ্রুপ কোনটি?" : "What's your blood type?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-500 dark:text-slate-400 mt-1",
								children: "Takes 5 seconds. Lets us show you exactly when your type is urgently needed nearby."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-4 gap-2.5",
						children: groups.map((item) => {
							const isSelected = selectedGroup === item.group;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSelectedGroup(item.group),
								className: `h-16 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${isSelected ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/30 scale-105" : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-slate-400"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base font-black leading-tight",
									children: item.letter
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `text-[10px] font-semibold ${isSelected ? "text-rose-100" : "text-slate-400"}`,
									children: item.posNeg
								})]
							}, item.group);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onSelectGroup("O-"),
							className: "text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer",
							children: "Don't know your blood type? →"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							onSelectGroup(selectedGroup);
							setCurrentStep("URGENT_FEED");
						},
						className: "w-full py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-sm rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Continue →" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center pt-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onOpenSOSModal,
							className: "text-xs font-medium text-slate-400 hover:text-rose-600 cursor-pointer",
							children: "Skip — I need blood instead"
						})
					})
				]
			}),
			currentStep === "URGENT_FEED" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 animate-in fade-in",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: () => setDetailModalOpen(true),
						className: "w-full rounded-2xl p-3.5 bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between shadow-lg shadow-rose-600/25 cursor-pointer transition-transform hover:scale-[1.01]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2 py-0.5 rounded-full bg-white/20 font-mono text-[10px] font-black uppercase tracking-wider",
								children: "LIVE 3"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-bold",
								children: [selectedGroup, " needed now. Within 2.4km of you."]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-white" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-extrabold uppercase tracking-widest text-slate-400",
							children: "URGENT NEAR YOU"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDetailModalOpen(true),
							className: "text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer",
							children: "See all"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-slate-300 dark:border-slate-700 space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-extrabold text-red-500 uppercase tracking-wider block",
									children: "CRITICAL"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-bold text-sm text-slate-900 dark:text-white mt-0.5",
									children: "St. Mary's Hospital (DMCH)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-slate-600 dark:text-slate-300 font-medium",
									children: [selectedGroup, " · 2 units · 1.2 km"]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-slate-500 font-mono",
								children: "4 min ago"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setDetailModalOpen(true),
								className: "flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95",
								children: "✓ Respond Now"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer",
								children: "Later"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-slate-300 dark:border-slate-700 space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block",
									children: "NEEDED"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-bold text-sm text-slate-900 dark:text-white mt-0.5",
									children: "City Blood Bank (Shahbagh)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-slate-500 dark:text-slate-400 font-medium",
									children: [selectedGroup, " · 1 unit · 1.9 km"]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-slate-400 font-mono",
								children: "11 min ago"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setDetailModalOpen(true),
								className: "flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95",
								children: "✓ Respond Now"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer",
								children: "Later"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black text-white text-center shadow-lg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-r border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-lg font-black font-mono block",
									children: "4"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-slate-400 uppercase font-semibold",
									children: "Donations"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-r border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-lg font-black font-mono block text-rose-500",
									children: "3"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-slate-400 uppercase font-semibold",
									children: "Lives"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-lg font-black font-mono block text-emerald-400",
								children: selectedGroup
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-slate-400 uppercase font-semibold",
								children: "Your Type"
							})] })
						]
					})
				]
			}),
			detailModalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-[36px] bg-[#0c101a] text-white p-6 shadow-2xl border border-slate-800 space-y-4 text-left relative animate-in zoom-in-95",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDetailModalOpen(false),
							className: "absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-extrabold uppercase tracking-widest text-red-500 block",
							children: "● EMERGENCY REQUEST"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl p-5 bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xl shadow-red-600/30 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-4xl font-black block",
								children: selectedGroup
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-rose-100 mt-1 block",
								children: "Critical Cross-Match"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase",
									children: "Critical"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-mono block mt-2 text-rose-200",
									children: "4 min ETA"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-base font-bold text-white",
								children: "St. Mary's Hospital"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-400",
								children: "2 units needed · 1.2 km away · Posted 3 minutes ago"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl p-3 bg-slate-900 border border-slate-800 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-4 h-4 text-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-mono font-bold text-slate-300",
									children: "1.2 KM AWAY"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-rose-400 uppercase tracking-wider",
								children: "TAP TO OPEN MAPS"
							})]
						}),
						donateSuccess ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Response Dispatched! Hospital notified." })]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: handleDonateNow,
							className: "w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✓ I Can Donate Now" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 pt-1 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setDetailModalOpen(false),
								className: "text-xs font-semibold text-slate-400 hover:text-white cursor-pointer block w-full",
								children: "Remind me in 1 hour"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setDetailModalOpen(false),
								className: "text-xs text-slate-500 hover:text-slate-300 cursor-pointer block w-full",
								children: "Not this time"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-mono",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-3.5 h-3.5 text-emerald-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Verified by hospital staff · Request #BH-8847" })]
						})
					]
				})
			})
		]
	});
};
export { BloodHelpOnboardingView };
