import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { t as createLucideIcon } from "./createLucideIcon-DRE67aPD.js";
import { t as QrCode } from "./qr-code-D5T-q9z-.js";
import { An as MapPin, Cn as Phone, In as Hospital, Lt as ALL_BLOOD_GROUPS, Mt as downloadEmergencyPosterPng, Qn as Check, Un as Download, Wn as Copy, _n as Share2, cn as X, hn as ShieldCheck } from "./index-BZGxtQ_X.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Flame = createLucideIcon("flame", [["path", {
	d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",
	key: "1slcih"
}]]);
// src/components/ecosystem/EmergencyPosterModal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var EmergencyPosterModal = ({ isOpen, onClose, lang, initialRequest }) => {
	const [bloodGroup, setBloodGroup] = (0, import_react.useState)(initialRequest?.bloodGroup || "O-");
	const [patientName, setPatientName] = (0, import_react.useState)(initialRequest?.patientName || "রোকেয়া বেগম");
	const [unitsNeeded, setUnitsNeeded] = (0, import_react.useState)(initialRequest?.unitsNeeded || 2);
	const [hospitalName, setHospitalName] = (0, import_react.useState)(initialRequest?.hospitalName || "ঢাকা মেডিকেল কলেজ হাসপাতাল");
	const [location, setLocation] = (0, import_react.useState)(initialRequest ? `${initialRequest.upazila}, ${initialRequest.district}` : "শাহবাগ, ঢাকা");
	const [contactPhone, setContactPhone] = (0, import_react.useState)(initialRequest?.contactPhone || "01712-345678");
	const [requiredDate, setRequiredDate] = (0, import_react.useState)(initialRequest?.requiredDate || "আজ জরুরি ভিত্তিতে");
	const [reason, setReason] = (0, import_react.useState)(initialRequest?.reason || "জরুরি সার্জারি ও সিজারিয়ান ডেলিভারি");
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [downloadNotice, setDownloadNotice] = (0, import_react.useState)(false);
	if (!isOpen) return null;
	const shareText = `🚨 *জরুরি রক্তের আবেদন (Emergency Blood Needed)* 🚨
🩸 রক্তের গ্রুপ: *${bloodGroup}* (${unitsNeeded} ব্যাগ)
🏥 হাসপাতাল: *${hospitalName}*
📍 অবস্থান: *${location}*
📅 প্রয়োজন: *${requiredDate}*
⚠️ কারণ: *${reason}*
📞 যোগাযোগ: *${contactPhone}*

সরাসরি রক্ত দিতে বা লাইভ ট্র্যাকিং করতে ভিজিট করুন: ${window.location.origin}`;
	const handleCopyText = () => {
		navigator.clipboard.writeText(shareText).catch(() => {});
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	};
	const handleDownloadRealPng = () => {
		downloadEmergencyPosterPng({
			bloodGroup,
			unitsNeeded,
			patientName,
			hospitalName,
			location,
			contactPhone,
			requiredDate,
			reason
		});
		setDownloadNotice(true);
		setTimeout(() => setDownloadNotice(false), 3200);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/85 overflow-y-auto modal-scroll-contain",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-lg my-2 sm:my-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-colors text-left space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center shadow-sm shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "w-5 h-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base sm:text-lg font-black text-slate-900 dark:text-white",
							children: lang === "bn" ? "জরুরি রক্তের সোশ্যাল মিডিয়া পোস্টার (.PNG)" : "Emergency Blood Poster (.PNG)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-slate-500 dark:text-slate-400",
							children: lang === "bn" ? "ফেসবুক, হোয়াটসঅ্যাপ ও মেসেঞ্জারে শেয়ারের জন্য ১০৮০×১০৮০ HD পোস্টার" : "Download crisp 1080×1080 square HD poster for Facebook & WhatsApp"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					id: "emergency-poster-card",
					className: "w-full rounded-2xl bg-gradient-to-br from-slate-950 via-[#18090d] to-slate-950 text-white p-4 sm:p-5 shadow-xl border-2 border-rose-600/70 relative overflow-hidden space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pb-2.5 border-b border-rose-900/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 rounded-full bg-red-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-black text-xs uppercase tracking-widest text-red-400 font-mono",
									children: lang === "bn" ? "জরুরি রক্তের আবেদন" : "EMERGENCY BLOOD NEEDED"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 text-[11px] font-bold text-slate-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-3.5 h-3.5 text-emerald-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BloodSearch BD" })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3 py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-bold uppercase text-slate-400 tracking-wider",
									children: lang === "bn" ? "রক্তের গ্রুপ প্রয়োজন:" : "REQUIRED BLOOD TYPE:"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-4xl sm:text-5xl font-black text-white tracking-tight",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-rose-500 font-mono",
										children: bloodGroup
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-bold text-amber-300 block mt-0.5",
									children: [
										unitsNeeded,
										" ",
										lang === "bn" ? "ব্যাগ রক্ত প্রয়োজন" : "Bags Needed",
										" · ",
										requiredDate
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 rounded-xl bg-white text-slate-900 flex flex-col items-center justify-center shadow-md shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "w-14 h-14" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[8px] font-bold font-mono mt-0.5",
									children: "BLOODSEARCH"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hospital, { className: "w-4 h-4 text-rose-500 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-slate-100",
										children: hospitalName
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-slate-300",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-4 h-4 text-rose-500 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: location })]
								}),
								reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[11px] text-slate-400 pt-1 border-t border-slate-800/80",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-300 font-semibold",
											children: lang === "bn" ? "রোগী: " : "Patient: "
										}),
										patientName,
										" (",
										reason,
										")"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-rose-100 uppercase font-bold block leading-none",
									children: lang === "bn" ? "সরাসরি যোগাযোগ:" : "DIRECT CONTACT:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base sm:text-lg font-black font-mono tracking-wider",
									children: contactPhone
								})] })]
							}), contactPhone.replace(/[^0-9+]/g, "").length >= 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `tel:${contactPhone.replace(/[^0-9+]/g, "")}`,
								className: "px-3 py-1.5 rounded-lg bg-white text-rose-600 font-black text-xs hover:bg-slate-100",
								children: lang === "bn" ? "কল দিন" : "Call"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center text-[10px] text-slate-400 pt-1 font-mono",
							children: "রক্ত দিন, জীবন বাঁচান · BloodSearch National Network"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2.5 pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 flex-wrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-bold text-slate-700 dark:text-slate-300",
							children: lang === "bn" ? "ব্লাড গ্রুপ নির্বাচন:" : "Select Blood Group:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none",
							children: ALL_BLOOD_GROUPS.map((bg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setBloodGroup(bg),
								className: `px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${bloodGroup === bg ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`,
								children: bg
							}, bg))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-[11px] font-semibold text-slate-500 mb-0.5",
								children: lang === "bn" ? "রোগীর নাম" : "Patient Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "posterPatientName",
								type: "text",
								value: patientName,
								onChange: (e) => setPatientName(e.target.value),
								className: "w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-[11px] font-semibold text-slate-500 mb-0.5",
								children: lang === "bn" ? "ব্যাগ সংখ্যা ও সময়" : "Bags & Timing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									name: "posterUnitsNeeded",
									value: unitsNeeded,
									onChange: (e) => setUnitsNeeded(Number(e.target.value)),
									className: "w-20 h-9 px-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white",
									children: [
										1,
										2,
										3,
										4,
										5,
										6
									].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: n,
										children: [n, " ব্যাগ"]
									}, n))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "posterRequiredDate",
									type: "text",
									value: requiredDate,
									onChange: (e) => setRequiredDate(e.target.value),
									className: "flex-1 h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-[11px] font-semibold text-slate-500 mb-0.5",
								children: lang === "bn" ? "হাসপাতাল" : "Hospital"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "posterHospitalName",
								type: "text",
								value: hospitalName,
								onChange: (e) => setHospitalName(e.target.value),
								className: "w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-[11px] font-semibold text-slate-500 mb-0.5",
								children: lang === "bn" ? "মোবাইল নম্বর" : "Contact Phone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "posterContactPhone",
								type: "text",
								value: contactPhone,
								onChange: (e) => setContactPhone(e.target.value),
								className: "w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-[11px] font-semibold text-slate-500 mb-0.5",
								children: lang === "bn" ? "এলাকা / জেলা" : "Location"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "posterLocation",
								type: "text",
								value: location,
								onChange: (e) => setLocation(e.target.value),
								className: "w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-[11px] font-semibold text-slate-500 mb-0.5",
								children: lang === "bn" ? "রক্তের কারণ" : "Medical Reason"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "posterMedicalReason",
								type: "text",
								value: reason,
								onChange: (e) => setReason(e.target.value),
								className: "w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
							})] })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: handleDownloadRealPng,
						className: "w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: downloadNotice ? lang === "bn" ? "✓ ১০৮০×১০৮০ HD পোস্টার (.PNG) গ্যালারিতে ডাউনলোড হয়েছে!" : "✓ 1080×1080 HD Poster (.PNG) Downloaded!" : lang === "bn" ? "এইচডি পোস্টার ইমেজ (.PNG) ডাউনলোড করুন" : "Download HD Poster Image (.PNG)" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleCopyText,
							className: "min-h-[40px] py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700",
							children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4 text-emerald-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-4 h-4 text-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copied ? lang === "bn" ? "টেক্সট কপি হয়েছে!" : "Copied!" : lang === "bn" ? "ক্যাপশন কপি করুন" : "Copy Caption" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "min-h-[40px] py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "হোয়াটসঅ্যাপে পাঠান" : "Share WhatsApp" })]
						})]
					})]
				})
			]
		})
	});
};
export { EmergencyPosterModal };
