import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { t as createLucideIcon } from "./createLucideIcon-DRE67aPD.js";
import { An as MapPin, Jn as CircleCheck, Qn as Check, Tn as Mic, Zn as ChevronRight, vn as Send, yn as Search } from "./index-BZGxtQ_X.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Bell = createLucideIcon("bell", [["path", {
	d: "M10.268 21a2 2 0 0 0 3.464 0",
	key: "vwvbt9"
}], ["path", {
	d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
	key: "11g9vi"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LayoutGrid = createLucideIcon("layout-grid", [
	["rect", {
		width: "7",
		height: "7",
		x: "3",
		y: "3",
		rx: "1",
		key: "1g98yp"
	}],
	["rect", {
		width: "7",
		height: "7",
		x: "14",
		y: "3",
		rx: "1",
		key: "6d4xhi"
	}],
	["rect", {
		width: "7",
		height: "7",
		x: "14",
		y: "14",
		rx: "1",
		key: "nxv5o0"
	}],
	["rect", {
		width: "7",
		height: "7",
		x: "3",
		y: "14",
		rx: "1",
		key: "1bb6yr"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Pause = createLucideIcon("pause", [["rect", {
	x: "14",
	y: "3",
	width: "5",
	height: "18",
	rx: "1",
	key: "kaeet6"
}], ["rect", {
	x: "5",
	y: "3",
	width: "5",
	height: "18",
	rx: "1",
	key: "1wsw3u"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Play = createLucideIcon("play", [["path", {
	d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
	key: "10ikf1"
}]]);
// src/components/showcase/PdfExactShowcase.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var PdfExactShowcase = ({ lang, darkMode, onOpenSOSModal }) => {
	const [activePage, setActivePage] = (0, import_react.useState)("all");
	const [selectedGroup, setSelectedGroup] = (0, import_react.useState)("B+");
	const [rsvpState, setRsvpState] = (0, import_react.useState)({
		"ev-1": false,
		"ev-2": true,
		"ev-3": false
	});
	const [isPlayingAudio, setIsPlayingAudio] = (0, import_react.useState)(false);
	const [healthSwitches, setHealthSwitches] = (0, import_react.useState)({
		nonAlcoholic: true,
		hivNegative: true,
		rheumaticFever: true,
		covidNegative: true,
		thalassemiaNegative: true,
		hepatitisNegative: true,
		normalBP: true
	});
	const toggleHealth = (key) => {
		setHealthSwitches((prev) => ({
			...prev,
			[key]: !prev[key]
		}));
	};
	const toggleRsvp = (id) => {
		setRsvpState((prev) => ({
			...prev,
			[id]: !prev[id]
		}));
	};
	const PhoneMockup = ({ title, children, isLightPhone = false }) => {
		const isDark = isLightPhone ? false : true;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center my-2",
			children: [title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-2.5 uppercase tracking-wider bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `w-[320px] sm:w-[350px] h-[720px] rounded-[48px] p-2.5 shadow-2xl relative overflow-hidden flex flex-col border-[7px] transition-colors ${isDark ? "bg-[#090d16] border-[#222f44] shadow-black/80 ring-1 ring-slate-800" : "bg-[#f1f5f9] border-[#cbd5e1] shadow-slate-400/50 ring-1 ring-slate-300"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute top-4 left-1/2 -translate-x-1/2 w-26 h-6.5 bg-black rounded-full z-50 flex items-center justify-between px-3 border border-slate-800/80",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-2.5 h-2.5 rounded-full bg-slate-950 flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-1 h-1 rounded-full bg-blue-900" })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `w-full h-full rounded-[38px] overflow-y-auto overflow-x-hidden pt-8 px-4 pb-6 font-sans text-xs select-none scrollbar-none transition-colors ${isDark ? "bg-[#0f172a] text-[#f8fafc]" : "bg-[#f8fafc] text-[#0f172a]"}`,
					children
				})]
			})]
		});
	};
	const renderPage1 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-6 lg:gap-8 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				title: "Screen 1: Blood Request",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-1 border-b border-slate-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base font-bold text-slate-300 cursor-pointer",
								children: "‹"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-base font-bold text-white",
								children: "Blood Request"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold text-slate-300 block mb-1",
							children: "Request Type"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 text-white text-xs font-bold flex justify-between items-center shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Emergency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-slate-300" })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold text-slate-300 block mb-1",
							children: "Patient Details"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 text-white text-xs flex items-center gap-2.5 shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs",
								children: "👤"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold block text-white",
								children: "H. Roberts"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-slate-300",
								children: "Age: 34 · ICU Patient"
							})] })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold text-slate-300 block mb-1",
							children: "Location"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 text-white text-xs flex items-center gap-2.5 shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-4 h-4 text-rose-500 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-white block",
								children: "City Hospital (DMCH)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-slate-300",
								children: "Secretariat Road, Shahbagh, Dhaka"
							})] })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold text-slate-300 block mb-1",
								children: "Urgency"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 rounded-xl bg-[#1e293b] border border-red-500 text-white text-xs flex justify-between items-center shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-black text-rose-400",
									children: "IMMEDIATE"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-rose-200 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800",
									children: "Critical Priority"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-slate-300 mt-1.5 block",
								children: "Emit immediate high-priority alert to nearby verified donors"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onOpenSOSModal,
							className: "w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer mt-3",
							children: "Submit Request →"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				title: "Screen 2: Dashboard",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-1 border-b border-slate-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-4 h-0.5 bg-white" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-3 h-0.5 bg-white" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-base font-bold text-white",
									children: "Dashboard"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4 text-slate-300 cursor-pointer" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "w-4 h-4 text-slate-300 cursor-pointer" })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-bold text-white",
								children: "Blood type Inventory"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-rose-400 font-bold cursor-pointer hover:underline",
								children: "See all"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-2xl bg-gradient-to-b from-red-600 to-rose-700 text-white text-center flex flex-col items-center shadow-md",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base font-black",
											children: "A+"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative w-11 h-11 my-1.5 flex items-center justify-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
												className: "w-full h-full -rotate-90",
												viewBox: "0 0 36 36",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "18",
													cy: "18",
													r: "15.915",
													fill: "none",
													stroke: "rgba(255,255,255,0.25)",
													strokeWidth: "3.5"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "18",
													cy: "18",
													r: "15.915",
													fill: "none",
													stroke: "#ffffff",
													strokeWidth: "3.5",
													strokeDasharray: "85, 100"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute font-mono text-[10px] font-bold text-white",
												children: "85%"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-black text-rose-100 uppercase tracking-tight",
											children: "High Stock"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-2xl bg-[#1e293b] border border-slate-700 text-center flex flex-col items-center shadow-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base font-black text-white",
											children: "B-"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative w-11 h-11 my-1.5 flex items-center justify-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
												className: "w-full h-full -rotate-90",
												viewBox: "0 0 36 36",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "18",
													cy: "18",
													r: "15.915",
													fill: "none",
													stroke: "#334155",
													strokeWidth: "3.5"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "18",
													cy: "18",
													r: "15.915",
													fill: "none",
													stroke: "#ef4444",
													strokeWidth: "3.5",
													strokeDasharray: "12, 100"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute font-mono text-[10px] font-bold text-red-400",
												children: "12%"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-black text-red-400 uppercase tracking-tight",
											children: "Critical"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-2xl bg-[#1e293b] border border-slate-700 text-center flex flex-col items-center shadow-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base font-black text-white",
											children: "O+"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative w-11 h-11 my-1.5 flex items-center justify-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
												className: "w-full h-full -rotate-90",
												viewBox: "0 0 36 36",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "18",
													cy: "18",
													r: "15.915",
													fill: "none",
													stroke: "#334155",
													strokeWidth: "3.5"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "18",
													cy: "18",
													r: "15.915",
													fill: "none",
													stroke: "#10b981",
													strokeWidth: "3.5",
													strokeDasharray: "95, 100"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute font-mono text-[10px] font-bold text-emerald-400",
												children: "95%"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-black text-emerald-400 uppercase tracking-tight",
											children: "Sufficient"
										})
									]
								})
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-bold text-white",
								children: "Recent activity"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-rose-400 font-bold cursor-pointer hover:underline",
								children: "See all"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 flex justify-between items-center shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-xs text-white block",
										children: "Recent Recovery"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-slate-300",
										children: "3 minutes ago · City Center"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-slate-400" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 flex justify-between items-center shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-xs text-white block",
										children: "Profile verification"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-slate-300",
										children: "2 months ago · Level 3 Donor"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-slate-400" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 flex items-center justify-between shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80",
											alt: "Profile",
											className: "w-7 h-7 rounded-full object-cover"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-xs text-white block",
											children: "Profile Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-emerald-400 font-semibold",
											children: "Sufficient is succeeded"
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-slate-400" })]
								})
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-4 border-t border-slate-800 flex justify-around text-slate-300 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-rose-500 font-bold",
									children: "🏠 Home"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "💬 Chat" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "❤️ Donate" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "👤 User" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⚙️ Settings" })
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				title: "Screen 3: Donor Events",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-1 border-b border-slate-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base font-bold text-slate-300 cursor-pointer",
								children: "‹"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-base font-bold text-white",
								children: "Donor Events"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: [
								{
									id: "ev-1",
									date: "Oct 28",
									title: "City Blood Drive",
									time: "Oct 28 · 9-4pm",
									place: "Local Donation Drive at Dhaka Medical College Gate 2"
								},
								{
									id: "ev-2",
									date: "Oct 28",
									title: "Metro Health Event",
									time: "Oct 28 · 10-5pm",
									place: "Community Center, Dhanmondi 27 Red Cross Booth"
								},
								{
									id: "ev-3",
									date: "Oct 31",
									title: "Community Donor Day",
									time: "Oct 31 · 9-3pm",
									place: "Mirpur Indoor Stadium Blood Donation Camp"
								}
							].map((event) => {
								const isRsvpd = rsvpState[event.id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-2xl bg-[#1e293b] border border-slate-700 space-y-2 shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "px-2 py-1 rounded-lg bg-rose-600 text-white font-black text-[10px] uppercase",
												children: event.date
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-bold text-xs text-white",
												children: event.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-slate-300 block font-mono",
												children: event.time
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => toggleRsvp(event.id),
											className: `px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${isRsvpd ? "bg-emerald-600 text-white shadow-sm" : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"}`,
											children: isRsvpd ? "RSVP ✓" : "RSVP"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-slate-300 leading-tight",
										children: event.place
									})]
								}, event.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-6 border-t border-slate-800 flex justify-around text-slate-300 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-rose-500 font-bold",
									children: "📅 Events"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "❤️ Blood" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🔔 Alert" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "👤 Profile" })
							]
						})
					]
				})
			})
		]
	});
	const renderPage2 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-6 lg:gap-8 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 1: Type Selection",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block",
								children: "● BLOOD HELP"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xl font-black text-slate-900 mt-1",
								children: "What's your blood type?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-600 mt-1",
								children: "Takes 5 seconds. Lets us show you exactly when your type is urgently needed nearby."
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-2",
							children: [
								{
									group: "A+",
									label: "A",
									sub: "Pos"
								},
								{
									group: "A-",
									label: "A",
									sub: "Neg"
								},
								{
									group: "B+",
									label: "B",
									sub: "Pos"
								},
								{
									group: "B-",
									label: "B",
									sub: "Neg"
								},
								{
									group: "O+",
									label: "O",
									sub: "Pos"
								},
								{
									group: "O-",
									label: "O",
									sub: "Neg"
								},
								{
									group: "AB+",
									label: "AB",
									sub: "Pos"
								},
								{
									group: "AB-",
									label: "AB",
									sub: "Neg"
								}
							].map((item) => {
								const isSelected = selectedGroup === item.group;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setSelectedGroup(item.group),
									className: `h-16 rounded-2xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all ${isSelected ? "bg-rose-600 text-white border-rose-600 shadow-md scale-105" : "bg-white border-slate-300 text-slate-900 hover:border-slate-400"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-base font-black leading-tight",
										children: item.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `text-[10px] font-bold ${isSelected ? "text-rose-100" : "text-slate-600"}`,
										children: item.sub
									})]
								}, item.group);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-bold text-slate-700 hover:underline cursor-pointer",
								children: "Don't know your blood type? →"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "w-full py-3.5 bg-black hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer",
							children: "Continue →"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-semibold cursor-pointer",
								children: "Skip — I need blood instead"
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 2: Urgent Near You",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block",
							children: "● BLOOD HELP"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-rose-600 text-white flex items-center justify-between shadow-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase",
									children: "LIVE 3"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-bold",
									children: [selectedGroup, " needed now. Within 2.4km."]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-white" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-black text-slate-900 uppercase tracking-wider",
									children: "URGENT NEAR YOU"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-rose-600 font-bold cursor-pointer hover:underline",
									children: "See all"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-2.5 mb-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-start",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-black text-red-600 uppercase",
											children: "CRITICAL"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "font-bold text-xs text-slate-900 mt-0.5",
											children: "St. Mary's Hospital"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs text-slate-700 font-medium",
											children: [selectedGroup, " · 2 units · 1.2 km"]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-slate-500 font-mono font-bold",
										children: "4 min ago"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "flex-1 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-lg shadow-sm",
										children: "✓ Respond Now"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "px-3 py-1.5 bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg",
										children: "Later"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-start",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-black text-amber-600 uppercase",
											children: "NEEDED"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "font-bold text-xs text-slate-900 mt-0.5",
											children: "City Blood Bank"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs text-slate-700 font-medium",
											children: [selectedGroup, " · 1 unit · 1.9 km"]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-slate-500 font-mono font-bold",
										children: "11 min ago"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "flex-1 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-lg shadow-sm",
										children: "✓ Respond Now"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "px-3 py-1.5 bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg",
										children: "Later"
									})]
								})]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900 text-white text-center border border-slate-800",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base font-black font-mono block text-white",
									children: "4"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] text-slate-300 uppercase font-semibold",
									children: "Donations"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-x border-slate-700",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-base font-black font-mono text-rose-400 block",
										children: "3"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-slate-300 uppercase font-semibold",
										children: "Lives"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base font-black font-mono text-emerald-400 block",
									children: selectedGroup
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] text-slate-300 uppercase font-semibold",
									children: "Your Type"
								})] })
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				title: "Screen 3: Emergency Detail",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center pb-1 border-b border-slate-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-black text-red-400 uppercase",
								children: "● EMERGENCY REQUEST"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-300 font-bold cursor-pointer",
								children: "✕"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xl shadow-red-600/30",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-5xl font-black block tracking-tight",
									children: selectedGroup
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-rose-100 mt-1 block font-bold",
									children: "St. Mary's Hospital"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center text-xs text-rose-200 mt-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: "2 units needed"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-2 py-0.5 rounded-full bg-white/20 font-black uppercase text-[10px]",
										children: "Critical"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-rose-200 block mt-1 font-mono",
									children: "1.2 km away · Posted 3 minutes ago"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 flex justify-between items-center shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono font-bold text-xs text-slate-200",
								children: "1.2 KM AWAY"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-black text-rose-400 uppercase cursor-pointer hover:underline",
								children: "TAP TO OPEN MAPS"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer",
							children: "✓ I Can Donate Now"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-300 block cursor-pointer hover:underline",
								children: "Remind me in 1 hour"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-400 block cursor-pointer hover:underline",
								children: "Not this time"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pt-2 border-t border-slate-800 text-[10px] text-slate-300 text-center font-mono",
							children: "Verified by hospital staff · Request #BH-8847"
						})
					]
				})
			})
		]
	});
	const renderPage3 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-6 lg:gap-8 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 1: Set Urgency",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-1 border-b border-slate-200",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-600 font-bold cursor-pointer",
								children: "‹"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-slate-900",
								children: "Request Blood"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl border-2 border-red-500 bg-red-50 text-slate-900",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-black text-xs text-red-600 block",
										children: "Critical"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-slate-700 font-medium",
										children: "Immediate within 2 hours · 5 km emergency radius"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl border border-slate-300 bg-white text-slate-900",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-xs text-amber-600 block",
										children: "Urgent"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-slate-700 font-medium",
										children: "Needed today · 10 km radius"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl border border-slate-300 bg-white text-slate-900",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-xs text-slate-800 block",
										children: "Standard"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-slate-700 font-medium",
										children: "Scheduled surgery / 24-48 hours"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow mt-4 cursor-pointer",
							children: "Continue →"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 2: Request Sent ✓",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-center py-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-8 h-8 stroke-[3]" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-black text-slate-900",
							children: "Request Sent"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-600 font-medium block mt-1",
							children: "Dhaka Medical College Area · 1 km"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-100 text-center font-mono border border-slate-200",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-600 block font-bold",
								children: "Group"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-black text-rose-600 text-base",
								children: selectedGroup
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-600 block font-bold",
								children: "Priority"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-black text-red-600 text-base",
								children: "Critical"
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer",
							children: "Back to Home"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 3: Select Blood Group",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-1 border-b border-slate-200",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-600 font-bold cursor-pointer",
								children: "‹"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-slate-900",
								children: "Request Blood"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-2",
							children: [
								"A+",
								"A-",
								"B+",
								"B-",
								"O+",
								"O-",
								"AB+",
								"AB-"
							].map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSelectedGroup(g),
								className: `h-14 rounded-xl font-black text-sm border-2 cursor-pointer ${selectedGroup === g ? "bg-red-600 text-white border-red-600 shadow" : "bg-white border-slate-300 text-slate-900 hover:border-slate-400"}`,
								children: g
							}, g))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow mt-6 cursor-pointer",
							children: "Continue →"
						})
					]
				})
			})
		]
	});
	const renderPage5 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-6 lg:gap-8 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
			isLightPhone: true,
			title: "Light Mode (Page 5 Left)",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between pb-1 border-b border-slate-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80",
								alt: "Alex",
								className: "w-9 h-9 rounded-full object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-600 block font-semibold",
								children: "Good Morning 👋"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-bold text-xs text-slate-900",
								children: "Alex Johnson"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "w-4 h-4 text-slate-700" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3.5 rounded-2xl bg-rose-600 text-white flex items-center justify-between shadow-md",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base",
								children: "📢"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] font-black uppercase tracking-wider text-amber-200 block",
									children: "BROADCAST"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-black",
									children: "EMERGENCY REQUEST"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-rose-100 block",
									children: "Broadcast urgent need nearby"
								})
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-white" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3 rounded-xl bg-white border border-slate-300 shadow-sm flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs font-bold text-slate-900 flex items-center gap-1",
							children: ["Eligible to Donate ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3.5 h-3.5 text-emerald-600 fill-emerald-600 text-white" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-600 font-medium",
							children: "Last donation: 3 months ago"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs font-black text-slate-900",
							children: "12 : 09 : 25"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-4 gap-2 text-center text-[10px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-white border border-slate-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "🩸"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900",
									children: "Request"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-white border border-slate-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "🤝"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900",
									children: "Donor"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-white border border-slate-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "🏥"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900",
									children: "Hospital"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-white border border-slate-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "⭐"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-900",
									children: "Events"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3 rounded-2xl bg-white border border-slate-300 shadow-sm flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center",
								children: "A+"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
								className: "font-bold text-xs text-slate-900",
								children: "St. Mary's Hospital"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-600",
								children: "1.2 km away"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "px-3 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-lg cursor-pointer",
							children: "Donate Now"
						})]
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
			title: "Dark Mode (Page 5 Right)",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between pb-1 border-b border-slate-800",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80",
								alt: "Alex",
								className: "w-9 h-9 rounded-full object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-300 block font-semibold",
								children: "Good Morning 👋"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-bold text-xs text-white",
								children: "Alex Johnson"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "w-4 h-4 text-slate-300" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3.5 rounded-2xl bg-rose-600 text-white flex items-center justify-between shadow-md",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base",
								children: "📢"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] font-black uppercase tracking-wider text-amber-200 block",
									children: "BROADCAST"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-black",
									children: "EMERGENCY REQUEST"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-rose-100 block",
									children: "Broadcast urgent need nearby"
								})
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "w-4 h-4 text-white" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3 rounded-xl bg-[#1e293b] border border-slate-700 flex items-center justify-between shadow-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs font-bold text-white flex items-center gap-1",
							children: ["Eligible to Donate ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3.5 h-3.5 text-emerald-400 fill-emerald-400 text-slate-900" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-300",
							children: "Last donation: 3 months ago"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs font-black text-white",
							children: "12 : 09 : 25"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-4 gap-2 text-center text-[10px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-[#1e293b] border border-slate-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "🩸"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-200",
									children: "Request"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-[#1e293b] border border-slate-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "🤝"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-200",
									children: "Donor"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-[#1e293b] border border-slate-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "🏥"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-200",
									children: "Hospital"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-[#1e293b] border border-slate-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base block",
									children: "⭐"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-200",
									children: "Events"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3 rounded-2xl bg-[#1e293b] border border-slate-700 flex items-center justify-between shadow-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center",
								children: "A+"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
								className: "font-bold text-xs text-white",
								children: "St. Mary's Hospital"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-300",
								children: "1.2 km away"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg cursor-pointer",
							children: "Donate Now"
						})]
					})
				]
			})
		})]
	});
	const renderPage6 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-6 lg:gap-8 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
			isLightPhone: true,
			title: "Screen 1: My Badges List",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 pb-1 border-b border-slate-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-base font-bold text-slate-600 cursor-pointer",
							children: "‹"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-slate-900",
							children: "My Badges"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 text-xs font-bold text-slate-600 border-b border-slate-300 pb-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-900 border-b-2 border-rose-600 pb-1",
								children: "All Badges"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "cursor-pointer hover:text-slate-900",
								children: "Earned Badges"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "cursor-pointer hover:text-slate-900",
								children: "Locked Badges"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-black uppercase text-slate-600 block mb-2 tracking-wide",
						children: "SILVER BADGE"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl",
										children: "🎖️"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-slate-900 mt-1",
										children: "Level 1"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-emerald-600 font-bold",
										children: "✓ Unlocked"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl",
										children: "🎖️"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-slate-900 mt-1",
										children: "Level 2"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-emerald-600 font-bold",
										children: "✓ Unlocked"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl",
										children: "🎖️"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-slate-900 mt-1",
										children: "Level 3"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-emerald-600 font-bold",
										children: "✓ Unlocked"
									})
								]
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-black uppercase text-amber-600 block mb-2 tracking-wide",
						children: "GOLD BADGE"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl",
										children: "🥇"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-slate-900 mt-1",
										children: "Level 1"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-emerald-600 font-bold",
										children: "✓ Unlocked"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl",
										children: "🥇"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-slate-900 mt-1",
										children: "Level 2"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-emerald-600 font-bold",
										children: "✓ Unlocked"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-white border border-slate-300 shadow-sm flex flex-col items-center opacity-60",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl",
										children: "🔒"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold text-slate-900 mt-1",
										children: "Level 3"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-slate-500 font-semibold",
										children: "Locked"
									})
								]
							})
						]
					})] })
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
			isLightPhone: true,
			title: "Screen 2: Ribbon Medal Detail",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center text-xs pb-1 border-b border-slate-200",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-600 font-bold cursor-pointer",
								children: "‹"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]",
								children: "Unlocked ✓"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-600 font-bold cursor-pointer",
								children: "✕"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-black text-slate-900 uppercase",
							children: "SILVER BADGE"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-600 font-bold",
							children: "Level 1"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-xl ring-8 ring-amber-100",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-5xl",
							children: "⭐"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-2xl bg-slate-100 border border-slate-300 text-left space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-black uppercase text-slate-700 block tracking-wider",
							children: "REQUIREMENTS"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "text-xs text-slate-800 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-rose-600 font-bold",
										children: "•"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Each donation must meet eligibility criteria (e.g., age, weight, health status)." })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-rose-600 font-bold",
										children: "•"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Donate blood at least three times within a year." })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-rose-600 font-bold",
										children: "•"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Maintain verified status across all Bangladesh regional centers." })]
								})
							]
						})]
					})
				]
			})
		})]
	});
	const renderPage7 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-6 lg:gap-8 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
			isLightPhone: true,
			title: "Screen 1: 7 Health Switches",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3.5 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-bold text-slate-600 uppercase tracking-wider",
						children: "CLINICAL ELIGIBILITY"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "font-bold text-sm text-slate-900 mt-0.5",
						children: "Health Condition"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-600",
						children: "Clinical safety parameters for recipient trust"
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2 pt-1",
					children: [
						{
							key: "nonAlcoholic",
							label: "Non-alcoholic (মদ্যপানমুক্ত)"
						},
						{
							key: "hivNegative",
							label: "HIV negative (এইচআইভি নেগেটিভ)"
						},
						{
							key: "rheumaticFever",
							label: "Rheumatic fever negative (বাতজ্বর মুক্ত)"
						},
						{
							key: "covidNegative",
							label: "COVID negative (কোভিড নেগেটিভ)"
						},
						{
							key: "thalassemiaNegative",
							label: "Thalassemia negative (থ্যালাসেমিয়া মুক্ত)"
						},
						{
							key: "hepatitisNegative",
							label: "Hepatitis negative (হেপাটাইটিস নেগেটিভ)"
						},
						{
							key: "normalBP",
							label: "Not having low blood-pressure (স্বাভাবিক রক্তচাপ)"
						}
					].map((item) => {
						const isChecked = healthSwitches[item.key];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onClick: () => toggleHealth(item.key),
							className: "p-2.5 rounded-xl bg-white border border-slate-300 flex items-center justify-between cursor-pointer shadow-xs hover:border-slate-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-slate-900",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `w-9 h-5 rounded-full transition-colors relative ${isChecked ? "bg-emerald-600" : "bg-slate-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `w-4 h-4 rounded-full bg-white transition-transform shadow ${isChecked ? "translate-x-4.5" : "translate-x-0.5"}` })
							})]
						}, item.key);
					})
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
			title: "Screen 2: Donor Responds",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-extrabold uppercase tracking-widest text-rose-400 block pb-1 border-b border-slate-800",
						children: "● DONOR RESPONDS TO REQUEST"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-2xl bg-[#1e293b] border border-slate-700 space-y-3 shadow-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-12 h-12 rounded-xl bg-rose-600 text-white font-black text-lg flex items-center justify-center",
									children: "A+"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "font-bold text-xs text-white",
									children: "Emergency for Delivery Patient"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-slate-300",
									children: "Dhaka Medical College Hospital"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-[#0f172a] border border-slate-800 text-xs font-mono flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-300",
									children: "Masked Phone:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-rose-400",
									children: "01674333969"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer",
									children: "Confirm Request"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "px-3 py-2.5 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl cursor-pointer",
									children: "Cancel"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl block",
								children: "🎉"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
								className: "font-bold text-xs text-emerald-400",
								children: "Thank You!"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-200",
								children: "Your life-saving response has been sent to the patient's family."
							})
						]
					})
				]
			})
		})]
	});
	const renderPage8 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-4xl mx-auto py-2 text-left space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4 rounded-2xl bg-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg",
						children: "🚨"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-black uppercase tracking-wider text-amber-200 block",
							children: "INCIDENT COMMAND CENTER · PAGE 8 & 14"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-black",
							children: "Evacuation Alert / Blood Disaster Alert"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-red-100",
							children: "Building A & surrounding areas · ID: INC-2025-0412 · Main Campus"
						})
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2 self-start sm:self-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "px-3 py-1 bg-white text-red-600 font-black text-xs rounded-full",
						children: "Active Incident"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-600 dark:text-slate-300 block font-bold",
							children: "People at Risk"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xl font-black font-mono text-slate-900 dark:text-white",
							children: "1,248"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-600 dark:text-slate-300 block font-bold",
							children: "Units Dispatched"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xl font-black font-mono text-rose-600 dark:text-rose-400",
							children: "84"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-600 dark:text-slate-300 block font-bold",
							children: "Teams Deployed"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xl font-black font-mono text-blue-600 dark:text-blue-400",
							children: "12"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-600 dark:text-slate-300 block font-bold",
							children: "Shelters Open"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400",
							children: "3"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300",
						children: "Priority Overview (Donut Chart)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-24 h-24 rounded-full border-8 border-rose-500 border-t-amber-500 border-r-blue-500 flex items-center justify-center font-bold text-xs text-slate-900 dark:text-white",
							children: "100%"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1 text-xs text-slate-700 dark:text-slate-300",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-3 h-3 rounded-full bg-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "High Priority: 45% (Critical Bleeding)" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-3 h-3 rounded-full bg-amber-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Medium Priority: 35% (Surgery Prep)" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-3 h-3 rounded-full bg-blue-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Standard Priority: 20% (Plasma reserve)" })]
								})
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300",
						children: "Incident Response Tasks"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-2.5 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex justify-between items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-slate-900 dark:text-white block",
								children: "Building A Evacuation"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-slate-500 dark:text-slate-400",
								children: "Team Alpha · ETA 8 mins"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold text-[10px]",
								children: "In Progress"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-2.5 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex justify-between items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-slate-900 dark:text-white block",
								children: "Dispatch 20 O- Units to DMCH"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-slate-500 dark:text-slate-400",
								children: "Team Bravo · ETA 15 mins"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]",
								children: "En Route"
							})]
						})]
					})]
				})]
			})
		]
	});
	const renderPage18 = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-6 lg:gap-8 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 1: Post A Request",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3.5 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pb-1 border-b border-slate-200",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-base font-bold text-slate-600 cursor-pointer",
								children: "‹"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-slate-900",
								children: "Post A Request"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] font-bold text-slate-700 block mb-1",
							children: "Select Patient Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-2.5 rounded-xl bg-white border border-slate-300 flex items-center gap-2 text-xs text-slate-900 font-semibold shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "👤" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "H. Roberts (Patient)" })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] font-bold text-slate-700 block mb-1",
							children: "Select Blood Group"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-1.5",
							children: [
								"A+",
								"A-",
								"B+",
								"B-",
								"O+",
								"O-",
								"AB+",
								"AB-"
							].map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSelectedGroup(g),
								className: `py-2 rounded-xl font-bold text-xs border cursor-pointer ${selectedGroup === g ? "bg-rose-600 text-white border-rose-600 shadow" : "bg-white border-slate-300 text-slate-900 hover:border-slate-400"}`,
								children: g
							}, g))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Select Blood Unit" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-rose-600 font-black",
								children: "2 Unit"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "mockupBloodUnit",
							type: "range",
							min: "1",
							max: "5",
							defaultValue: "2",
							className: "w-full accent-rose-600 cursor-pointer"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] font-bold text-slate-700 block mb-1",
							children: "Mobile Number"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "mockupMobileNumber",
							type: "text",
							defaultValue: "+88017XXXXXXXX",
							className: "w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] font-bold text-slate-700 block mb-1",
							children: "Select A Location"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							name: "mockupLocation",
							className: "w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Dhaka Sadar / Shahbagh (DMCH)" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Chittagong Medical College" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Sylhet MAG Osmani Medical" })
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer mt-2",
							children: "Send Request"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 2: Inbox",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3.5 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-1 border-b border-slate-200",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-600 font-bold cursor-pointer",
									children: "‹"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-bold text-slate-900",
									children: "Inbox"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "p-1 rounded-full bg-rose-600 text-white text-[10px] cursor-pointer",
									children: "✏️"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-2 rounded-xl bg-slate-200 flex items-center gap-2 text-xs text-slate-700 border border-slate-300",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "mockupInboxSearch",
								type: "text",
								placeholder: "Search conversations...",
								className: "bg-transparent focus:outline-none flex-1 text-slate-900 text-xs"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: [
								{
									name: "Benjamin Jack",
									text: "Audio note: I am coming to DMCH ward 4",
									unread: 2
								},
								{
									name: "Michel Lucas",
									text: "Confirmed 1 unit O+ ready",
									unread: 1
								},
								{
									name: "Liam Elijah",
									text: "Hospital receptionist confirmed arrival",
									unread: 1
								},
								{
									name: "Daniel Henry",
									text: "Thank you for your response",
									unread: 0
								},
								{
									name: "Archer Noah",
									text: "Blood bank coordinator contacted",
									unread: 0
								},
								{
									name: "Oliver James",
									text: "Emergency SOS acknowledged",
									unread: 0
								}
							].map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-white border border-slate-300 flex items-center justify-between shadow-xs hover:border-slate-400 cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-black flex items-center justify-center text-xs",
										children: item.name[0]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
										className: "font-bold text-xs text-slate-900",
										children: item.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-slate-600 font-medium truncate block max-w-[130px]",
										children: item.text
									})] })]
								}), item.unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center",
									children: item.unread
								})]
							}, i))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
				isLightPhone: true,
				title: "Screen 3: Benjamin Jack Chat",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 text-left h-full flex flex-col justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-2 border-b border-slate-200",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-600 font-bold cursor-pointer",
									children: "‹"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-bold text-xs text-slate-900",
										children: "Benjamin Jack"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-emerald-700 font-black block",
										children: "● Online"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-600 font-bold cursor-pointer",
									children: "..."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center my-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] text-slate-600 font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-full",
								children: "Today"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-2xl bg-rose-600 text-white text-[11px] rounded-br-none max-w-[85%] ml-auto shadow-sm",
									children: ["I am on my way to DMCH Ward 4. Ready to donate.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-rose-100 block text-right mt-1 font-mono",
										children: "9:31 ✓✓"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-2xl bg-slate-200 text-slate-900 text-[11px] rounded-bl-none max-w-[85%] shadow-sm",
									children: ["Thank you so much! Please call the patient relative directly.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] text-slate-600 block text-right mt-1 font-mono",
										children: "9:31"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-2xl bg-rose-600 text-white flex items-center gap-2 max-w-[85%] ml-auto shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setIsPlayingAudio(!isPlayingAudio),
										className: "w-7 h-7 rounded-full bg-white text-rose-600 flex items-center justify-center cursor-pointer shadow-sm shrink-0",
										children: isPlayingAudio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "w-3.5 h-3.5 ml-0.5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-center gap-0.5 h-4",
											children: [
												4,
												8,
												14,
												10,
												18,
												12,
												16,
												20,
												14,
												8,
												16,
												12,
												6,
												10,
												14,
												8,
												4
											].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `w-0.5 rounded-full ${isPlayingAudio ? "bg-white animate-pulse" : "bg-rose-200"}`,
												style: { height: `${h}px` }
											}, i))
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] text-rose-100 font-mono block text-right",
											children: "09:31 ✓✓"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-2.5 rounded-2xl bg-slate-200 text-slate-900 flex items-center gap-2 max-w-[85%] shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setIsPlayingAudio(!isPlayingAudio),
										className: "w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer shadow-sm shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "w-3.5 h-3.5 ml-0.5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-center gap-0.5 h-4",
											children: [
												4,
												8,
												14,
												10,
												18,
												12,
												16,
												20,
												14,
												8,
												16,
												12,
												6,
												10,
												14,
												8,
												4
											].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-0.5 rounded-full bg-slate-600",
												style: { height: `${h}px` }
											}, i))
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] text-slate-600 font-mono block text-right",
											children: "09:31"
										})]
									})]
								})
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-2 rounded-2xl bg-white border border-slate-300 flex items-center gap-2 shadow-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "mockupChatMessage",
								type: "text",
								placeholder: "Type A Message...",
								className: "flex-1 text-xs text-slate-900 focus:outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "w-4 h-4 text-rose-600 cursor-pointer" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center cursor-pointer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "w-3 h-3" })
							})
						]
					})]
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#161c28] border border-slate-300 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider",
							children: "PDF Match Showcase"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base sm:text-lg font-bold text-slate-900 dark:text-white",
							children: lang === "bn" ? "পিডিএফ স্ক্রিন অনুযায়ী মোবাইল ভিউ" : "Exact PDF Screen Presentation Showcase"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-700 dark:text-slate-300 mt-1",
						children: lang === "bn" ? "আপনার দেওয়া PDF-এর প্রতিটি স্লাইডের হুবহু মোবাইল স্ক্রিন নিচে সুন্দরভাবে সাজানো রয়েছে।" : "Directly view the authentic multi-phone side-by-side screens from your reference document."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActivePage("all"),
							className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${activePage === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-[#1f2736] text-slate-700 dark:text-slate-300"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "সব স্লাইড একসাথে দেখুন" : "View All Slides" })]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pt-3 flex items-center gap-2 overflow-x-auto scrollbar-none",
					children: [
						{
							id: "all",
							label: "📱 All Slides (Presentation Deck)"
						},
						{
							id: "page1",
							label: "📄 Page 1: Dashboard & Events Trio"
						},
						{
							id: "page2",
							label: "📄 Page 2: Blood Help & Match Trio"
						},
						{
							id: "page3",
							label: "📄 Page 3: Request & Sent Trio"
						},
						{
							id: "page5",
							label: "📄 Page 5: Light & Dark Mode Duo"
						},
						{
							id: "page6",
							label: "📄 Page 6: My Badges & Medal Duo"
						},
						{
							id: "page7",
							label: "📄 Page 7: Clinical Profile & Request"
						},
						{
							id: "page8",
							label: "📄 Page 8 & 14: Incident Command"
						},
						{
							id: "page18",
							label: "📄 Page 18: Post Request & Audio Chat"
						}
					].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setActivePage(item.id),
						className: `px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activePage === item.id ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "bg-slate-100 dark:bg-[#1f2736] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
						children: item.label
					}, item.id))
				})]
			}),
			activePage === "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 1 · Blood Request, Inventory Dashboard & Donor Events"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 1 (3 Screens)"
							})]
						}), renderPage1()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 2 · Blood Help Onboarding & Urgent Near You Feed"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 2 (3 Screens)"
							})]
						}), renderPage2()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 3 · Set Urgency, Request Sent Checkmark & Blood Type Selector"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 3 (3 Screens)"
							})]
						}), renderPage3()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 4 · Side-by-Side Dual Light & Dark Mode Comparison"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 5 (2 Screens)"
							})]
						}), renderPage5()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 5 · My Badges List & Golden Star Ribbon Medal Detail"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 6 & 12 (2 Screens)"
							})]
						}), renderPage6()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 6 · Clinical Health Screening (7 Switches) & Donor Responds Modal"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 7 (2 Screens)"
							})]
						}), renderPage7()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 7 · Emergency Incident Command Center (Evacuation Alert INC-2025-0412)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 8, 10, 14"
							})]
						}), renderPage8()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400",
								children: "PDF Slide 8 · Post A Request, Inbox & Benjamin Jack Audio Waveform Chat"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-500 font-mono",
								children: "Page 18 (3 Screens)"
							})]
						}), renderPage18()]
					})
				]
			}),
			activePage === "page1" && renderPage1(),
			activePage === "page2" && renderPage2(),
			activePage === "page3" && renderPage3(),
			activePage === "page5" && renderPage5(),
			activePage === "page6" && renderPage6(),
			activePage === "page7" && renderPage7(),
			activePage === "page8" && renderPage8(),
			activePage === "page18" && renderPage18()
		]
	});
};
export { PdfExactShowcase };
