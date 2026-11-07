import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { t as createLucideIcon } from "./createLucideIcon-DRE67aPD.js";
import { t as Award } from "./award-D_tr_4pI.js";
import { t as HeartHandshake } from "./heart-handshake-B3Z27WG1.js";
import { t as QrCode } from "./qr-code-D5T-q9z-.js";
import { $ as respondToContactRequestInFirestore, $n as CalendarCheck, An as MapPin, At as calculateRecoveryCountdown, B as isUserVerifiedForWrites, C as auth, Cn as Phone, Dt as isValidBangladeshMobilePhone, Fn as LocateFixed, Ft as downloadSmartDonorIdCardPng, H as onAuthStateChanged, Hn as Droplet, I as deleteMyUserAndDonorDataInFirestore, It as getStoredDonationLogs, Jn as CircleCheck, L as getStoredDevOtpSandboxSession, Lt as ALL_BLOOD_GROUPS, Mn as LogOut, Nn as LogIn, On as MessageCircle, Ot as normalizeValidBangladeshMobileE164, Pn as Lock, Pt as downloadRoyalCertificatePng, Qn as Check, Rn as Globe, Un as Download, V as normalizeFacebookProfileUrl, Vn as ExternalLink, Xt as requestFreshHighAccuracyGPS, Y as recordCompletedDonationInFirestore, Z as registerSmartAccountInFirestore, _n as Share2, ar as isFakePersonName, c as DEFAULT_AVATAR_DATA_URI, cn as X, en as reverseGeocodeBangladeshCoords, gt as subscribeIncomingContactRequestsForDonor, hn as ShieldCheck, k as clearDevOtpSandboxSession, lt as signOutReal, mn as Sparkles, on as BrandLogo, pn as Trash2, rn as DISTRICTS, sn as useBrandConfig, un as UserPlus, xt as updateDonorAvailabilityAndConsentInFirestore, z as isBootstrappedAdminUser } from "./index-BZGxtQ_X.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var BellOff = createLucideIcon("bell-off", [
	["path", {
		d: "M10.268 21a2 2 0 0 0 3.464 0",
		key: "vwvbt9"
	}],
	["path", {
		d: "M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742",
		key: "178tsu"
	}],
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}],
	["path", {
		d: "M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05",
		key: "1hqiys"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Pencil = createLucideIcon("pencil", [["path", {
	d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
	key: "1a8usu"
}], ["path", {
	d: "m15 5 4 4",
	key: "1mk7zo"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Printer = createLucideIcon("printer", [
	["path", {
		d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
		key: "143wyd"
	}],
	["path", {
		d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",
		key: "1itne7"
	}],
	["rect", {
		x: "6",
		y: "14",
		width: "12",
		height: "8",
		rx: "1",
		key: "1ue0tg"
	}]
]);
// src/components/ecosystem/PrivacyPolicyModal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var PrivacyPolicyModal = ({ isOpen, onClose, lang }) => {
	const brand = useBrandConfig();
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-xl my-2 sm:my-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-left space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-5 h-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-base sm:text-lg font-black text-slate-900 dark:text-white",
								children: lang === "bn" ? "গোপনীয়তা ও গুগল প্লে স্টোর পলিসি" : "Privacy & Google Play Data Safety"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]",
								children: "Verified"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-slate-500 dark:text-slate-400",
							children: lang === "bn" ? "বাণিজ্যিক মানসম্পন্ন ও আন্তর্জাতিক হেলথ অ্যাপ নীতিমালা" : "Commercial-grade compliance & clinical data safety"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3.5 text-xs text-slate-700 dark:text-slate-300 max-h-[70vh] overflow-y-auto pr-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 font-bold text-slate-900 dark:text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-4 h-4 text-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "১. গুগল প্লে হেলথ ডাটা সুরক্ষা ঘোষণা" : "1. Google Play Health Data Safety" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "leading-relaxed",
									children: lang === "bn" ? `${brand.brandName} (${brand.organizationName}) কোনো ব্যক্তিগত মেডিকেল হিস্ট্রি বা সংবেদনশীল স্বাস্থ্য তথ্য তৃতীয় পক্ষের বিজ্ঞাপন নেটওয়ার্কের সাথে শেয়ার করে না। রোগীর রক্তের চাহিদা এবং রক্তদাতার ফিটনেস তথ্য শুধুমাত্র জরুরি রক্ত সংগ্রহের উদ্দেশ্যে ব্যবহৃত হয়।` : `${brand.brandName} (${brand.organizationName}) does not share personal medical history or sensitive health data with third-party advertising networks. Blood group and clinical criteria are used solely for real-time emergency transfusion matching.`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2 pt-1 font-semibold text-[11px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "এন্ড-টু-এন্ড এনক্রিপশন" : "End-to-End Encrypted" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "বিজ্ঞাপনমুক্ত সেবামূলক" : "Zero Ad Trackers" })]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 font-bold text-slate-900 dark:text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-4 h-4 text-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "২. রক্তদাতার ফোন নম্বর সুরক্ষা ও আনমাস্কিং" : "2. Phone Number Masking & Audit Trail" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "leading-relaxed",
								children: lang === "bn" ? "রক্তদাতার গোপনীয়তা নিশ্চিত করতে মোবাইল নম্বর স্বয়ংক্রিয়ভাবে মাস্ক করা থাকে (যেমন: ০১৭১২ •••• ৭৮)। শুধুমাত্র জরুরি প্রয়োজনে সম্মতি ও অডিট ট্রেইল রেকর্ড নিশ্চিত করে ফোন নম্বর দেখা সম্ভব।" : "To prevent harassment, donor phone numbers are masked by default (e.g., 01712 •••• 78). Phone reveal requests require verified purpose acknowledgment and are logged in tamper-proof security records."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "w-4 h-4 text-amber-600 dark:text-amber-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "৩. বাণিজ্যিক ব্যবহার ও প্লে স্টোর ডিপ্লয়মেন্ট" : "3. Commercial & Play Store Readiness" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amber-800 dark:text-amber-200 leading-relaxed",
								children: lang === "bn" ? "এই প্ল্যাটফর্মটি সম্পূর্ণ সেল-রেডি এবং গুগল প্লে স্টোরে আপলোডযোগ্য। এতে রয়েছে অ্যাডমিন প্যানেল, ভেরিফাইড প্রাতিষ্ঠানিক ব্লাড ব্যাংক সাবস্ক্রিপশন এবং সিএসআর স্পন্সরশিপ সাপোর্টের প্রিমিয়াম আর্কিটেকচার।" : "This application is fully production-ready for deployment or sale on Google Play Store with APK wrapping, administrative controls, institutional blood bank accounts, and commercial compliance."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 font-bold text-slate-900 dark:text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartHandshake, { className: "w-4 h-4 text-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "৪. জরুরি জাতীয় হটলাইন নম্বরসমূহ" : "4. Official Emergency Bangladesh Helplines" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: "tel:16263",
										className: "p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:border-rose-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "স্বাস্থ্য বাতায়ন (Health)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-rose-600",
											children: "16263"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: "tel:999",
										className: "p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:border-rose-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "জাতীয় জরুরি সেবা (Ambulance)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-rose-600",
											children: "999"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: "tel:029116563",
										className: "p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:border-rose-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "রেড ক্রিসেন্ট ব্লাড ব্যাংক" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-rose-600",
											children: "02-9116563"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: "tel:01714010869",
										className: "p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:border-rose-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "কোয়ান্টাম ব্লাড ল্যাব" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-rose-600",
											children: "01714-010869"
										})]
									})
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-slate-400 font-mono",
						children: "Version 2.4.0 (Commercial Build)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer",
						children: lang === "bn" ? "বুঝেছি ও একমত" : "I Understand & Agree"
					})]
				})
			]
		})
	});
};
// src/components/donor/DonorCertificateModal.tsx
var DonorCertificateModal = ({ isOpen, onClose, lang, donorName = "Hafizur Rahman (হাফিজুর)", bloodGroup = "A+", idCardNumber = "BD-2026-7821-A+", totalDonations = 6 }) => {
	const [downloadSuccess, setDownloadSuccess] = (0, import_react.useState)(false);
	const [statusMessage, setStatusMessage] = (0, import_react.useState)(null);
	if (!isOpen) return null;
	const showTempStatus = (msg) => {
		setStatusMessage(msg);
		setTimeout(() => setStatusMessage(null), 4e3);
	};
	const serialNumber = `BS-NAT-${(/* @__PURE__ */ new Date()).getFullYear()}-${idCardNumber.replace(/[^0-9A-Z]/gi, "").slice(-8) || "782146"}`;
	const issueDate = (/* @__PURE__ */ new Date()).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
		day: "numeric",
		month: "long",
		year: "numeric"
	});
	const handlePrint = () => {
		window.print();
	};
	const handleDownloadPng = () => {
		downloadRoyalCertificatePng({
			donorName,
			bloodGroup,
			serialNumber,
			totalDonations: Math.max(1, totalDonations),
			issueDate,
			lang
		});
		setDownloadSuccess(true);
		showTempStatus(lang === "bn" ? "✓ হাই-রেজোলিউশন সম্মাননা সনদপত্র (.PNG ছবি) আপনার ফোনে/পিসিতে ডাউনলোড হয়েছে!" : "✓ High-resolution Royal Certificate (.PNG image) downloaded to your device!");
		setTimeout(() => {
			setDownloadSuccess(false);
		}, 2500);
	};
	const shareMessage = `আমি BloodSearch বাংলাদেশ থেকে একজন ভেরিফাইড রক্তদাতা (${bloodGroup}) হিসেবে "জাতীয় রক্তদাতা গৌরব সনদপত্র (Certificate of Humanitarian Honor)" অর্জন করেছি।\n\nসনদ নং: ${serialNumber}\nসর্বমোট রক্তদান: ${totalDonations} বার\n\nআপনিও রক্ত দিয়ে জীবন বাঁচান: ${window.location.origin}`;
	const handleCopyShare = () => {
		navigator.clipboard.writeText(shareMessage).catch(() => {});
		showTempStatus(lang === "bn" ? "✓ সনদের বিবরণী ও লিংক কপি হয়েছে! এখন ফেসবুকে পেস্ট করে শেয়ার করুন।" : "✓ Certificate text copied! Paste and share it on your Facebook profile.");
	};
	const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/90 overflow-y-auto modal-scroll-contain",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-2xl my-2 sm:my-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111827] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-amber-500/40 transition-all text-left space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-600 text-amber-950 flex items-center justify-center shadow-lg ring-2 ring-amber-400/40 shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "w-5 h-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug",
								children: lang === "bn" ? "জাতীয় রক্তদাতা গৌরব সম্মাননা সনদপত্র" : "National Certificate of Humanitarian Honor"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-500 dark:text-slate-400",
								children: lang === "bn" ? "জরুরি রক্তদানে মানবিক অবদানের আনুষ্ঠানিক স্বীকৃতি · সরাসরি .PNG ছবি বা PDF ডাউনলোড" : "Official humanitarian citation · Download high-resolution PNG or Print PDF"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full rounded-2xl bg-gradient-to-b from-[#fffef7] via-[#fffbf0] to-[#fff8e7] dark:from-[#0d1424] dark:via-[#090e18] dark:to-[#070b13] text-slate-900 dark:text-white p-5 sm:p-8 shadow-2xl border-8 border-double border-amber-500/70 relative overflow-hidden text-center space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-amber-600 dark:border-amber-400" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-amber-600 dark:border-amber-400" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-amber-600 dark:border-amber-400" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-amber-600 dark:border-amber-400" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative z-10 space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex justify-center pb-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
										variant: "mark",
										size: "md"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 font-mono",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-3.5 h-3.5 text-amber-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BLOODSEARCH BANGLADESH · NATIONAL LIFE-SAVER REGISTRY" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "py-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "text-xl sm:text-3xl font-serif font-black tracking-wider text-slate-900 dark:text-amber-100 uppercase",
										children: lang === "bn" ? "জাতীয় রক্তদাতা সম্মাননা সনদপত্র" : "CERTIFICATE OF HUMANITARIAN HONOR"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-bold text-amber-700 dark:text-amber-400 tracking-widest uppercase block mt-0.5",
										children: lang === "bn" ? "জীবন রক্ষাকারী নিঃস্বার্থ রক্তদানের স্বীকৃতিস্বরূপ" : "IN RECOGNITION OF SELFLESS BLOOD DONATION"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[11px] text-amber-800 dark:text-amber-300 font-mono font-bold",
									children: ["সনদপত্র সিরিয়াল: ", serialNumber]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative z-10 py-2 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-slate-600 dark:text-slate-300 italic font-serif",
									children: lang === "bn" ? "অত্যন্ত কৃতজ্ঞতা, সম্মান ও জাতীয় গর্বের সাথে এই প্রশংসাপত্র প্রদান করা হচ্ছে শ্রদ্ধেয় রক্তদাতা:" : "This prestigious citation of honor is proudly bestowed upon the distinguished life-saver:"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl sm:text-3xl font-serif font-black text-rose-600 dark:text-rose-400 underline decoration-amber-500 underline-offset-8 break-words",
										children: donorName
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-lg mx-auto font-sans",
									children: lang === "bn" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										"যিনি ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: bloodGroup }),
										" রক্তের গ্রুপের ধারক হিসেবে জরুরি মুহূর্তে স্বেচ্ছায় এগিয়ে এসে এ পর্যন্ত",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [totalDonations, " বার"] }),
										" সফলভাবে রক্তদান করেছেন এবং অসংখ্য মুমূর্ষু রোগীর জীবন বাঁচাতে অবিস্মরণীয় অবদান রেখেছেন।"
									] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										"For exceptional humanitarian devotion as a regular voluntary donor of Blood Group",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: bloodGroup }),
										", having completed ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [totalDonations, " verified donations"] }),
										" to protect critical lives across Bangladesh."
									] })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2 flex items-center justify-center flex-wrap gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-rose-700 dark:text-rose-300",
											children: ["গ্রুপ: ", bloodGroup]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: "·"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-amber-800 dark:text-amber-300",
											children: [
												"অবদান: ",
												totalDonations,
												" ব্যাগ"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: "·"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-700 dark:text-emerald-300",
											children: "স্ট্যাটাস: ভেরিফাইড হিরো"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative z-10 pt-4 border-t-2 border-amber-300/70 dark:border-amber-900/60 flex items-center justify-between gap-2 text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center font-serif flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-black text-slate-800 dark:text-slate-200 border-b border-slate-400 dark:border-slate-600 pb-1 italic",
											children: "ডা. তানভীরুল ইসলাম"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-sans font-bold",
											children: "চিকিৎসা পরিচালক ও রক্ত সঞ্চালন বিশেষজ্ঞ"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[8px] text-amber-700 dark:text-amber-400 font-mono",
											children: "বাংলাদেশ স্বাস্থ্য সেবা বোর্ড"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-amber-950 flex flex-col items-center justify-center font-black shadow-xl ring-4 ring-amber-400/30 shrink-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[8px] font-mono leading-none font-black tracking-widest mt-0.5",
											children: "GOLD HONOR"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[7px] font-mono font-bold text-amber-900",
											children: "VERIFIED"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center font-serif flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-black text-slate-800 dark:text-slate-200 border-b border-slate-400 dark:border-slate-600 pb-1 italic",
											children: "জাতীয় সমন্বয়ক পর্ষদ"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-sans font-bold",
											children: "BloodSearch Bangladesh Network"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[8px] text-amber-700 dark:text-amber-400 font-mono",
											children: ["ইস্যু তারিখ: ", issueDate]
										})
									]
								})
							]
						})
					]
				}),
				statusMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: statusMessage })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleDownloadPng,
							className: "min-h-[42px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer sm:col-span-2",
							children: [downloadSuccess ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: downloadSuccess ? lang === "bn" ? "✓ .PNG ছবি সেভ হয়েছে!" : "✓ PNG Saved!" : lang === "bn" ? "সনদপত্র ডাউনলোড (.PNG ছবি)" : "Download Certificate (.PNG)" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handlePrint,
							className: "min-h-[42px] py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-300 dark:border-slate-700",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-4 h-4 text-slate-600 dark:text-slate-300" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "প্রিন্ট / PDF" : "Print / PDF" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: whatsappShareHref,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "min-h-[42px] py-2 px-2 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer",
								title: "WhatsApp-এ শেয়ার করুন",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WA" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: handleCopyShare,
								className: "min-h-[42px] py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1 border border-blue-300 dark:border-blue-800 cursor-pointer",
								title: "ফেসবুকে শেয়ারের টেক্সট কপি করুন",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "w-3.5 h-3.5 text-blue-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "FB" })]
							})]
						})
					]
				})
			]
		})
	});
};
// src/components/donor/DonorProfileView.tsx
var DonorProfileView = ({ lang, onOpenRegister, onOpenAuthModal }) => {
	const [firebaseUser, setFirebaseUser] = (0, import_react.useState)(auth.currentUser);
	const [devOtpSession, setDevOtpSession] = (0, import_react.useState)(() => getStoredDevOtpSandboxSession());
	const [currentUser, setCurrentUser] = (0, import_react.useState)(() => {
		try {
			const saved = localStorage.getItem("bloodsearch_current_user");
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed && !isFakePersonName(parsed.name) && parsed.phone && parsed.phone !== "01700000000" && parsed.phone !== "01711000000") return parsed;
			}
		} catch {}
		return null;
	});
	const [donationLogs, setDonationLogs] = (0, import_react.useState)(() => getStoredDonationLogs());
	const [statusToast, setStatusToast] = (0, import_react.useState)(null);
	const [isRebuildingDb, setIsRebuildingDb] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const syncUser = () => {
			try {
				setDevOtpSession(getStoredDevOtpSandboxSession());
				const saved = localStorage.getItem("bloodsearch_current_user");
				const parsed = saved ? JSON.parse(saved) : null;
				const safeUser = parsed && !isFakePersonName(parsed.name) && parsed.phone && parsed.phone !== "01700000000" && parsed.phone !== "01711000000" ? parsed : null;
				setCurrentUser(safeUser);
				if (safeUser && typeof safeUser.availableToDonate === "boolean") setIsAvailable(safeUser.availableToDonate);
				setDonationLogs(getStoredDonationLogs());
			} catch {}
		};
		const unsubAuth = onAuthStateChanged(auth, (u) => {
			setFirebaseUser(u);
			syncUser();
		});
		const syncDevOtp = () => {
			setDevOtpSession(getStoredDevOtpSandboxSession());
			syncUser();
		};
		window.addEventListener("bloodsearch_user_changed", syncUser);
		window.addEventListener("bloodsearch_dev_otp_changed", syncDevOtp);
		return () => {
			unsubAuth();
			window.removeEventListener("bloodsearch_user_changed", syncUser);
			window.removeEventListener("bloodsearch_dev_otp_changed", syncDevOtp);
		};
	}, []);
	const [isQrOpen, setIsQrOpen] = (0, import_react.useState)(false);
	const [isPrivacyOpen, setIsPrivacyOpen] = (0, import_react.useState)(false);
	const [isCertOpen, setIsCertOpen] = (0, import_react.useState)(false);
	const [isAvailable, setIsAvailable] = (0, import_react.useState)(currentUser?.availableToDonate ?? true);
	const [availabilityStatus, setAvailabilityStatus] = (0, import_react.useState)(currentUser?.availabilityStatus || (currentUser?.availableToDonate === false ? "TEMPORARILY_UNAVAILABLE" : "AVAILABLE"));
	const [confirmedAtMs, setConfirmedAtMs] = (0, import_react.useState)(currentUser?.availabilityConfirmedAtMs);
	const [contactVisibility, setContactVisibility] = (0, import_react.useState)(currentUser?.contactVisibility || (currentUser?.shareDirectContact === false ? "REQUEST_ONLY" : "PUBLIC_OPT_IN"));
	const [allowCall, setAllowCall] = (0, import_react.useState)(currentUser?.allowCall !== false);
	const [allowWhatsApp, setAllowWhatsApp] = (0, import_react.useState)(currentUser?.allowWhatsApp !== false);
	const [allowSms, setAllowSms] = (0, import_react.useState)(currentUser?.allowSms !== false);
	const [emergencyAlertsOptIn, setEmergencyAlertsOptIn] = (0, import_react.useState)(currentUser?.emergencyAlertsOptIn !== false);
	const [alertsPaused, setAlertsPaused] = (0, import_react.useState)(currentUser?.alertsPaused === true);
	const [isSavingConsent, setIsSavingConsent] = (0, import_react.useState)(false);
	const [incomingContactRequests, setIncomingContactRequests] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!firebaseUser?.uid) {
			setIncomingContactRequests([]);
			return;
		}
		const unsub = subscribeIncomingContactRequestsForDonor(firebaseUser.uid, (items) => {
			setIncomingContactRequests(items);
		});
		return () => unsub();
	}, [firebaseUser?.uid]);
	(0, import_react.useEffect)(() => {
		if (!currentUser) return;
		const status = currentUser.availabilityStatus || (currentUser.availableToDonate === false ? "TEMPORARILY_UNAVAILABLE" : "AVAILABLE");
		setAvailabilityStatus(status);
		setIsAvailable(status === "AVAILABLE");
		if (currentUser.availabilityConfirmedAtMs) setConfirmedAtMs(currentUser.availabilityConfirmedAtMs);
		if (currentUser.contactVisibility) setContactVisibility(currentUser.contactVisibility);
		setAllowCall(currentUser.allowCall !== false);
		setAllowWhatsApp(currentUser.allowWhatsApp !== false);
		setAllowSms(currentUser.allowSms !== false);
		setEmergencyAlertsOptIn(currentUser.emergencyAlertsOptIn !== false);
		setAlertsPaused(currentUser.alertsPaused === true);
	}, [currentUser]);
	const [isQuickEditOpen, setIsQuickEditOpen] = (0, import_react.useState)(false);
	const [editName, setEditName] = (0, import_react.useState)("");
	const [editGroup, setEditGroup] = (0, import_react.useState)("");
	const [editAge, setEditAge] = (0, import_react.useState)("");
	const [editWeight, setEditWeight] = (0, import_react.useState)("");
	const [editGender, setEditGender] = (0, import_react.useState)("");
	const [editPhone, setEditPhone] = (0, import_react.useState)("");
	const [editWhatsapp, setEditWhatsapp] = (0, import_react.useState)("");
	const [editFacebook, setEditFacebook] = (0, import_react.useState)("");
	const [editDistrict, setEditDistrict] = (0, import_react.useState)("");
	const [editArea, setEditArea] = (0, import_react.useState)("");
	const [isSavingQuickEdit, setIsSavingQuickEdit] = (0, import_react.useState)(false);
	const [isLocatingQuickGps, setIsLocatingQuickGps] = (0, import_react.useState)(false);
	const [quickEditError, setQuickEditError] = (0, import_react.useState)(null);
	const [confirmDeleteMyProfile, setConfirmDeleteMyProfile] = (0, import_react.useState)(false);
	const [isDeletingMyProfile, setIsDeletingMyProfile] = (0, import_react.useState)(false);
	const parseManualInt = (raw) => {
		const digits = String(raw || "").replace(/[০-৯]/g, (ch) => String("০১২৩৪৫৬৭৮৯".indexOf(ch))).replace(/[^0-9]/g, "");
		return digits ? parseInt(digits, 10) : NaN;
	};
	const populateQuickEditFields = (sourceUser) => {
		const hasRealSaved = Boolean(sourceUser && !isFakePersonName(sourceUser.name) && sourceUser.phone && sourceUser.phone !== "01700000000" && sourceUser.facebookUrl !== "https://facebook.com/bloodsearch.bd");
		setEditName(hasRealSaved ? sourceUser.name : "");
		setEditGroup(hasRealSaved && sourceUser?.bloodGroup ? sourceUser.bloodGroup : "");
		setEditAge(hasRealSaved && typeof sourceUser?.age === "number" && sourceUser.age >= 18 && sourceUser.age <= 65 ? String(sourceUser.age) : "");
		setEditWeight(hasRealSaved && typeof sourceUser?.weightKg === "number" && sourceUser.weightKg >= 40 && sourceUser.weightKg <= 180 ? String(sourceUser.weightKg) : "");
		setEditGender(hasRealSaved && sourceUser?.gender && [
			"MALE",
			"FEMALE",
			"OTHER"
		].includes(sourceUser.gender) ? sourceUser.gender : "");
		const cleanPhoneVal = hasRealSaved && sourceUser?.phone ? sourceUser.phone : "";
		setEditPhone(cleanPhoneVal);
		setEditWhatsapp(hasRealSaved && sourceUser?.whatsappPhone && sourceUser.whatsappPhone !== "01700000000" ? sourceUser.whatsappPhone : "");
		setEditFacebook(hasRealSaved ? normalizeFacebookProfileUrl(sourceUser?.facebookUrl) || "" : "");
		const matchedDist = DISTRICTS.find((d) => d.id === String(sourceUser?.district || "").toLowerCase() || d.nameBn === sourceUser?.district || d.nameEn.toLowerCase() === String(sourceUser?.district || "").toLowerCase());
		setEditDistrict(hasRealSaved && matchedDist ? matchedDist.id : "");
		setEditArea(hasRealSaved && sourceUser?.upazila && sourceUser.upazila !== "sadar" && sourceUser.upazila !== "সদর" ? sourceUser.upazila : "");
	};
	const openInlineQuickEdit = () => {
		setQuickEditError(null);
		populateQuickEditFields(currentUser);
		setIsQuickEditOpen(true);
	};
	(0, import_react.useEffect)(() => {
		const hasRealSaved = Boolean(currentUser && !isFakePersonName(currentUser.name) && currentUser.phone && currentUser.phone !== "01700000000" && currentUser.facebookUrl !== "https://facebook.com/bloodsearch.bd" && (!firebaseUser || !currentUser.id || currentUser.id === firebaseUser.uid));
		if (firebaseUser && !hasRealSaved) populateQuickEditFields(null);
	}, [
		firebaseUser?.uid,
		currentUser?.id,
		currentUser?.phone,
		currentUser?.facebookUrl
	]);
	const handleQuickEditGps = async () => {
		setIsLocatingQuickGps(true);
		setQuickEditError(null);
		try {
			const res = await requestFreshHighAccuracyGPS();
			if (res.isRealGps) {
				const rev = await reverseGeocodeBangladeshCoords(res.coords, lang);
				setEditDistrict(rev.districtId);
				setEditArea(rev.areaText);
			} else setQuickEditError(lang === "bn" ? "ব্রাউজারে GPS বন্ধ আছে — নিচে আপনার এলাকার নাম (যেমন: নিকেতন) লিখে দিন।" : "Browser GPS is off — simply type your area name (e.g. Niketon) below.");
		} finally {
			setIsLocatingQuickGps(false);
		}
	};
	const handleSaveQuickEdit = async (e) => {
		e.preventDefault();
		setQuickEditError(null);
		const cleanName = editName.trim();
		if (cleanName.length < 2) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে আপনার নাম লিখুন।" : "Please enter your name.");
			return;
		}
		if (!editGroup) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে আপনার রক্তের গ্রুপ নির্বাচন করুন।" : "Please select your blood group.");
			return;
		}
		const parsedAge = parseManualInt(editAge);
		if (!Number.isFinite(parsedAge) || parsedAge < 18 || parsedAge > 65) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে আপনার সঠিক বয়স লিখুন (১৮ থেকে ৬৫ বছর)।" : "Please enter your valid age (18 to 65 years).");
			return;
		}
		const parsedWeight = parseManualInt(editWeight);
		if (!Number.isFinite(parsedWeight) || parsedWeight < 40 || parsedWeight > 180) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে আপনার সঠিক ওজন (কেজি) লিখুন (৪০ থেকে ১৮০ কেজি)।" : "Please enter your weight in kg (40 to 180 kg).");
			return;
		}
		if (!editGender) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে লিঙ্গ নির্বাচন করুন।" : "Please select your gender.");
			return;
		}
		const cleanPhone = normalizeValidBangladeshMobileE164(editPhone);
		if (!cleanPhone || !isValidBangladeshMobilePhone(editPhone)) {
			setQuickEditError(lang === "bn" ? "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (যেমন: 01712345678)।" : "Please enter a valid 11-digit mobile number (e.g. 01712345678).");
			return;
		}
		const cleanWa = normalizeValidBangladeshMobileE164(editWhatsapp);
		if (!cleanWa || !isValidBangladeshMobilePhone(editWhatsapp)) {
			setQuickEditError(lang === "bn" ? "সঠিক ১১ সংখ্যার WhatsApp নম্বর দিন (অথবা \"মোবাইলের মতোই\" বাটনে চাপুন)।" : "Please enter a valid 11-digit WhatsApp number (or tap \"Same as Mobile\").");
			return;
		}
		const cleanFb = normalizeFacebookProfileUrl(editFacebook);
		if (!cleanFb) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে আপনার আসল Facebook প্রোফাইল লিংক বা ইউজারনেম দিন (যেমন: facebook.com/your.id)।" : "Please enter your Facebook profile link or username (e.g. facebook.com/your.id).");
			return;
		}
		const distObj = editDistrict ? DISTRICTS.find((d) => d.id === editDistrict) || null : null;
		if (!distObj) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে আপনার জেলা নির্বাচন করুন।" : "Please select your district.");
			return;
		}
		const trimmedArea = editArea.trim();
		if (trimmedArea.length < 2) {
			setQuickEditError(lang === "bn" ? "অনুগ্রহ করে আপনার এলাকার নাম লিখুন (যেমন: নিকেতন, ধানমন্ডি)।" : "Please enter your area name (e.g. Niketon, Dhanmondi).");
			return;
		}
		const finalArea = trimmedArea.slice(0, 120);
		setIsSavingQuickEdit(true);
		try {
			const activeUser = auth.currentUser;
			const activeDevOtp = getStoredDevOtpSandboxSession();
			const resolvedUid = activeUser?.uid || activeDevOtp?.uid || currentUser?.id || `local_donor_${cleanPhone.replace(/\D/g, "").slice(-8) || "1001"}`;
			const sameOwnerExisting = currentUser && currentUser.id === resolvedUid ? currentUser : null;
			const isSuperOwner = Boolean(activeUser && isBootstrappedAdminUser(activeUser));
			const effectiveRole = !activeUser && activeDevOtp ? "USER" : sameOwnerExisting?.role === "ADMIN" || isSuperOwner ? "ADMIN" : "USER";
			const uidShort = resolvedUid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "1001";
			const defaultCardId = effectiveRole === "ADMIN" ? `ADMIN-BD-${uidShort}` : `BS-${uidShort}`;
			const cleanCardId = sameOwnerExisting?.idCardNumber && /^[a-zA-Z0-9+-]{5,40}$/.test(sameOwnerExisting.idCardNumber) ? sameOwnerExisting.idCardNumber : defaultCardId;
			const effectiveVisibility = (!sameOwnerExisting?.phone || sameOwnerExisting.phone === "01700000000") && contactVisibility === "REQUEST_ONLY" ? "PUBLIC_OPT_IN" : contactVisibility;
			const effectiveShareDirect = effectiveVisibility !== "REQUEST_ONLY";
			const updatedAccount = {
				id: resolvedUid,
				name: cleanName,
				email: activeUser?.email || sameOwnerExisting?.email || (activeDevOtp ? `${activeDevOtp.phoneLocal}@otp-dev.bloodsearch.bd` : `${uidShort.toLowerCase()}@bloodsearch.bd`),
				phone: cleanPhone,
				whatsappPhone: cleanWa,
				facebookUrl: cleanFb,
				bloodGroup: editGroup,
				division: distObj.divisionId || "dhaka",
				district: distObj.id,
				upazila: finalArea,
				photoUrl: (sameOwnerExisting?.photoUrl && sameOwnerExisting.photoUrl !== "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E" ? sameOwnerExisting.photoUrl : "") || currentUser?.photoUrl || activeUser?.photoURL || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E",
				role: effectiveRole,
				verifiedStatus: Boolean(activeUser),
				idCardNumber: cleanCardId,
				age: parsedAge,
				gender: editGender,
				weightKg: parsedWeight,
				availableToDonate: availabilityStatus === "AVAILABLE",
				availabilityStatus,
				availabilityConfirmedAtMs: Date.now(),
				shareDirectContact: effectiveShareDirect,
				contactVisibility: effectiveVisibility,
				allowCall,
				allowWhatsApp,
				allowSms,
				emergencyAlertsOptIn,
				alertsPaused,
				lastDonationDate: sameOwnerExisting?.lastDonationDate || "",
				totalDonations: sameOwnerExisting?.totalDonations || 0,
				createdAt: sameOwnerExisting?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
			};
			const updatedDonor = {
				id: resolvedUid,
				name: cleanName,
				bloodGroup: editGroup,
				division: distObj.divisionId || "dhaka",
				district: distObj.id,
				upazila: finalArea,
				phone: cleanPhone,
				whatsappPhone: cleanWa,
				facebookUrl: cleanFb,
				available: availabilityStatus === "AVAILABLE",
				availabilityStatus,
				availabilityConfirmedAtMs: Date.now(),
				shareDirectContact: effectiveShareDirect,
				contactVisibility: effectiveVisibility,
				allowCall,
				allowWhatsApp,
				allowSms,
				emergencyAlertsOptIn,
				alertsPaused,
				isCloudRecord: Boolean(activeUser),
				lastDonatedDate: updatedAccount.lastDonationDate || "",
				totalDonations: updatedAccount.totalDonations || 0,
				verifiedBadge: effectiveRole === "ADMIN",
				rating: 5,
				reviewsCount: 0,
				age: parsedAge,
				gender: editGender,
				weightKg: parsedWeight,
				hospitalAffiliation: effectiveRole === "ADMIN" ? "অ্যাডমিন ও রক্ত সমন্বয়ক" : "স্বেচ্ছাসেবী রক্তদাতা",
				panelType: effectiveRole,
				avatar: updatedAccount.photoUrl
			};
			if (activeUser && isUserVerifiedForWrites(activeUser)) {
				await registerSmartAccountInFirestore({
					firebaseUser: activeUser,
					account: updatedAccount,
					donor: updatedDonor
				});
				localStorage.removeItem("bloodsearch_pending_profile_draft");
			} else localStorage.setItem("bloodsearch_pending_profile_draft", JSON.stringify(updatedAccount));
			if (effectiveVisibility !== contactVisibility) setContactVisibility(effectiveVisibility);
			localStorage.setItem("bloodsearch_current_user", JSON.stringify(updatedAccount));
			setCurrentUser(updatedAccount);
			window.dispatchEvent(new Event("bloodsearch_user_changed"));
			window.dispatchEvent(new CustomEvent("bloodsearch_donor_upserted", { detail: {
				donor: updatedDonor,
				account: updatedAccount
			} }));
			setIsQuickEditOpen(false);
			showToast(lang === "bn" ? "✓ আপনার প্রোফাইল, বয়স, ওজন, রক্তের গ্রুপ ও ঠিকানা সফলভাবে সেভ হয়েছে!" : "✓ Your profile, age, weight, blood group & address have been saved!");
		} catch (err) {
			console.error("Quick profile update failed:", err);
			localStorage.setItem("bloodsearch_pending_profile_draft", JSON.stringify({
				name: cleanName,
				bloodGroup: editGroup,
				age: parsedAge,
				weightKg: parsedWeight,
				gender: editGender,
				phone: cleanPhone,
				whatsappPhone: cleanWa,
				facebookUrl: cleanFb,
				division: distObj.divisionId || "dhaka",
				district: distObj.id,
				upazila: finalArea
			}));
			setQuickEditError(lang === "bn" ? "ক্লাউডে সেভ করতে পুনরায় লগইন করুন — আপনার তথ্য ড্রাফটে সংরক্ষিত আছে।" : "Please sign in below to finish saving to Cloud — your changes are preserved.");
		} finally {
			setIsSavingQuickEdit(false);
		}
	};
	const [showLogForm, setShowLogForm] = (0, import_react.useState)(false);
	const [logDate, setLogDate] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [logType, setLogType] = (0, import_react.useState)("WHOLE_BLOOD");
	const [logHospital, setLogHospital] = (0, import_react.useState)("");
	const [isLoggingDonation, setIsLoggingDonation] = (0, import_react.useState)(false);
	const [healthConditions, setHealthConditions] = (0, import_react.useState)({
		nonAlcoholic: true,
		hivNegative: true,
		rheumaticFeverNegative: true,
		covidNegative: true,
		thalassemiaNegative: true,
		hepatitisNegative: true,
		normalBloodPressure: true
	});
	const toggleCondition = (key) => {
		setHealthConditions((prev) => ({
			...prev,
			[key]: !prev[key]
		}));
	};
	const showToast = (msg) => {
		setStatusToast(msg);
		setTimeout(() => setStatusToast(null), 3500);
	};
	const applyConsentAndAvailabilityUpdate = async (overrides) => {
		const nextStatus = overrides.availabilityStatus ?? availabilityStatus;
		const nextVis = overrides.contactVisibility ?? contactVisibility;
		const nextCall = overrides.allowCall ?? allowCall;
		const nextWa = overrides.allowWhatsApp ?? allowWhatsApp;
		const nextSms = overrides.allowSms ?? allowSms;
		const nextEmerg = overrides.emergencyAlertsOptIn ?? emergencyAlertsOptIn;
		const nextPaused = overrides.alertsPaused ?? alertsPaused;
		const confirmNow = overrides.confirmNow ?? nextStatus === "AVAILABLE";
		setAvailabilityStatus(nextStatus);
		setIsAvailable(nextStatus === "AVAILABLE");
		setContactVisibility(nextVis);
		setAllowCall(nextCall);
		setAllowWhatsApp(nextWa);
		setAllowSms(nextSms);
		setEmergencyAlertsOptIn(nextEmerg);
		setAlertsPaused(nextPaused);
		if (confirmNow) setConfirmedAtMs(Date.now());
		setIsSavingConsent(true);
		try {
			const synced = await updateDonorAvailabilityAndConsentInFirestore({
				availabilityStatus: nextStatus,
				confirmNow,
				shareDirectContact: nextVis !== "REQUEST_ONLY",
				contactVisibility: nextVis,
				allowCall: nextCall,
				allowWhatsApp: nextWa,
				allowSms: nextSms,
				emergencyAlertsOptIn: nextEmerg,
				alertsPaused: nextPaused
			});
			showToast(lang === "bn" ? `✓ প্রস্তুতি ও গোপনীয়তা সেটিংস সংরক্ষিত হয়েছে (${synced ? "ক্লাউড সিঙ্কড" : "লোকাল সেভড"})।` : `✓ Availability & contact privacy updated (${synced ? "Cloud Synced" : "Saved Locally"}).`);
		} finally {
			setIsSavingConsent(false);
		}
	};
	const handleRespondContactReq = async (reqId, approve) => {
		const validDonorPhone = isValidBangladeshMobilePhone(currentUser?.phone) ? currentUser?.phone : isValidBangladeshMobilePhone(firebaseUser?.phoneNumber) ? firebaseUser?.phoneNumber || void 0 : void 0;
		const validDonorWa = isValidBangladeshMobilePhone(currentUser?.whatsappPhone) ? currentUser?.whatsappPhone : validDonorPhone;
		if (approve && !validDonorPhone) {
			showToast(lang === "bn" ? "নম্বর শেয়ার করার আগে \"প্রোফাইল / আইডি আপডেট\" বাটনে গিয়ে আপনার সচল মোবাইল নম্বর যুক্ত করুন।" : "Please add your active mobile number via \"Update Smart ID\" before approving contact sharing.");
			onOpenRegister?.("USER");
			return;
		}
		if (await respondToContactRequestInFirestore({
			contactReqId: reqId,
			approve,
			donorPhone: validDonorPhone,
			donorWhatsApp: validDonorWa
		})) showToast(approve ? lang === "bn" ? "✓ রক্তপ্রার্থীর জন্য আপনার নম্বর অনুমোদিত হয়েছে।" : "✓ Approved! This seeker can now call/WhatsApp you directly." : lang === "bn" ? "অনুরোধটি প্রত্যাখ্যান করা হয়েছে।" : "Contact request declined.");
	};
	const handleSaveDonationLog = async (e) => {
		e.preventDefault();
		if (isLoggingDonation) return;
		setIsLoggingDonation(true);
		try {
			const res = await recordCompletedDonationInFirestore({
				donationDate: logDate,
				donationType: logType,
				hospitalName: logHospital.trim() || (lang === "bn" ? "রক্ত সঞ্চালন কেন্দ্র" : "Blood Center")
			});
			setIsAvailable(false);
			setShowLogForm(false);
			setLogHospital("");
			setDonationLogs(getStoredDonationLogs());
			showToast(lang === "bn" ? `✓ অভিনন্দন! রক্তদান রেকর্ড যুক্ত হয়েছে (মোট ${res.totalDonations} বার) এবং রিকভারি টাইমার চালু হয়েছে।` : `✓ Donation logged (${res.totalDonations} total) & recovery countdown started!`);
		} finally {
			setIsLoggingDonation(false);
		}
	};
	const isLoggedIn = Boolean(firebaseUser || devOtpSession);
	const hasSavedProfile = Boolean(currentUser && !isFakePersonName(currentUser.name) && currentUser.phone && currentUser.phone !== "01700000000" && currentUser.facebookUrl !== "https://facebook.com/bloodsearch.bd" && (!firebaseUser || !currentUser.id || currentUser.id === firebaseUser.uid));
	const displayName = (hasSavedProfile ? currentUser.name : "") || (isLoggedIn ? lang === "bn" ? "নিজের প্রোফাইল তথ্য দিন" : "Complete Your Profile Below" : lang === "bn" ? "গেস্ট ভিজিটর (লগইন করুন)" : "Guest Visitor (Tap Sign In)");
	const verifiedProfilePhone = hasSavedProfile && isValidBangladeshMobilePhone(currentUser?.phone) ? currentUser.phone : "";
	const verifiedWhatsappPhone = hasSavedProfile && isValidBangladeshMobilePhone(currentUser?.whatsappPhone) ? currentUser.whatsappPhone : verifiedProfilePhone;
	const displayPhone = verifiedProfilePhone || (isLoggedIn || hasSavedProfile ? lang === "bn" ? "নম্বর যুক্ত হয়নি" : "Phone not added" : "—");
	const displayEmail = firebaseUser?.email || (devOtpSession ? `DEV OTP · ${devOtpSession.operator}` : "") || (hasSavedProfile && currentUser?.email ? currentUser.email : "") || (lang === "bn" ? "অ্যাকাউন্ট যুক্ত নয়" : "Not signed in");
	const displayGroup = hasSavedProfile && currentUser?.bloodGroup || "O+";
	const displayGroupLabel = hasSavedProfile && currentUser?.bloodGroup ? currentUser.bloodGroup : "—";
	const displayAvatar = (hasSavedProfile && currentUser?.photoUrl && currentUser.photoUrl !== "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E" ? currentUser.photoUrl : "") || firebaseUser?.photoURL || (hasSavedProfile ? currentUser?.photoUrl : "") || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E";
	const displayId = hasSavedProfile && currentUser?.idCardNumber || (firebaseUser ? `BS-${firebaseUser.uid.slice(0, 6).toUpperCase()}` : devOtpSession ? `DEV-${devOtpSession.uid.slice(-6).toUpperCase()}` : lang === "bn" ? "লগইন করলে যুক্ত হবে" : "Sign in to generate");
	const rawDistrict = hasSavedProfile && currentUser?.district || "";
	const matchedProfileDist = rawDistrict ? DISTRICTS.find((d) => d.id === rawDistrict.toLowerCase() || d.nameBn === rawDistrict || d.nameEn.toLowerCase() === rawDistrict.toLowerCase()) : void 0;
	const displayDistrict = matchedProfileDist ? lang === "bn" ? matchedProfileDist.nameBn : matchedProfileDist.nameEn : rawDistrict;
	const displayArea = hasSavedProfile && currentUser?.upazila && currentUser.upazila !== "sadar" && currentUser.upazila !== "সদর" ? currentUser.upazila : "";
	const displayFullAddress = displayArea && displayDistrict ? `${displayArea}, ${displayDistrict}` : displayArea || displayDistrict;
	const displayGender = !hasSavedProfile ? "—" : currentUser?.gender === "FEMALE" ? lang === "bn" ? "মহিলা" : "Female" : currentUser?.gender === "OTHER" ? lang === "bn" ? "অন্যান্য" : "Other" : currentUser?.gender === "MALE" ? lang === "bn" ? "পুরুষ" : "Male" : "—";
	const displayDonations = hasSavedProfile ? currentUser?.totalDonations ?? 0 : 0;
	const displayAgeText = hasSavedProfile && typeof currentUser?.age === "number" && currentUser.age >= 18 ? `${currentUser.age}${lang === "bn" ? " বছর" : "y"}` : "—";
	const displayRole = firebaseUser && (currentUser?.role === "ADMIN" || isBootstrappedAdminUser(firebaseUser)) ? "ADMIN" : "USER";
	const lastDate = currentUser?.lastDonationDate || (donationLogs[0] ? donationLogs[0].date : "");
	const lastType = currentUser?.lastDonationType || (donationLogs[0] ? donationLogs[0].type : "WHOLE_BLOOD");
	const recovery = calculateRecoveryCountdown(lastDate, lastType, lang);
	const handleDownloadSmartIdPng = () => {
		downloadSmartDonorIdCardPng({
			donorName: displayName,
			bloodGroup: displayGroup,
			idCardNumber: displayId,
			phone: verifiedProfilePhone,
			district: displayDistrict || "Bangladesh",
			totalDonations: displayDonations,
			isAvailable
		});
		showToast(lang === "bn" ? "✓ স্মার্ট ডোনার আইডি কার্ড (.PNG) আপনার গ্যালারিতে ডাউনলোড হয়েছে!" : "✓ Smart Donor ID Card (.PNG) downloaded!");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 max-w-xl mx-auto pb-8 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `${displayRole === "ADMIN" ? "section-jewel-indigo ring-1 ring-amber-400/40" : "section-jewel-emerald"} text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all text-center relative`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between pb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: `text-xs font-extrabold inline-flex items-center gap-1.5 ${displayRole === "ADMIN" ? "text-amber-300" : "text-emerald-100"}`,
							children: [displayRole === "ADMIN" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-4 h-4 text-amber-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isLoggedIn ? displayRole === "ADMIN" ? lang === "bn" ? "অ্যাডমিন ও রক্ত সমন্বয়ক অ্যাকাউন্ট" : "Admin & Coordinator Account" : lang === "bn" ? "স্বেচ্ছাসেবী ডোনার অ্যাকাউন্ট" : "Volunteer Donor Account" : lang === "bn" ? "গেস্ট মোড" : "Guest Mode" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setIsPrivacyOpen(true),
								className: "min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/14 hover:bg-white/24 border border-white/25 text-white text-xs font-semibold cursor-pointer transition-colors",
								title: "Google Play Safety",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-3.5 h-3.5 text-amber-200" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "পলিসি" : "Privacy" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setIsQrOpen(true),
								className: "min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/14 hover:bg-white/24 border border-white/25 text-white text-xs font-semibold cursor-pointer transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "w-3.5 h-3.5 text-amber-200" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "QR Pass" })]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative w-22 h-22 sm:w-24 sm:h-24 mx-auto my-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: displayAvatar,
							onError: (e) => {
								e.currentTarget.src = DEFAULT_AVATAR_DATA_URI;
							},
							referrerPolicy: "no-referrer",
							alt: displayName,
							className: `w-full h-full object-cover rounded-3xl ring-4 shadow-xl ${displayRole === "ADMIN" ? "ring-amber-400/70" : "ring-white/30"}`
						}), isLoggedIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `absolute -bottom-1 -right-1 w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow ${displayRole === "ADMIN" ? "bg-amber-500 text-slate-950" : "bg-emerald-500"}`,
							children: "✓"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg sm:text-xl font-black text-white",
						children: displayName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-white/90 mt-0.5 font-mono truncate px-2",
						children: [
							displayEmail,
							" · ",
							displayPhone
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 inline-flex items-center justify-center gap-1 text-xs font-semibold text-white/95",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-3.5 h-3.5 text-amber-300 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hasSavedProfile && displayFullAddress ? displayFullAddress : lang === "bn" ? "ঠিকানা যুক্ত হয়নি (নিচে নিজের ঠিকানা লিখুন)" : "Address not added yet" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `text-[11px] font-bold font-mono mt-0.5 ${displayRole === "ADMIN" ? "text-amber-300" : "text-emerald-200"}`,
						children: [
							lang === "bn" ? "স্মার্ট কার্ড নং:" : "Card ID:",
							" ",
							displayId
						]
					}),
					hasSavedProfile && (verifiedWhatsappPhone || normalizeFacebookProfileUrl(currentUser?.facebookUrl)) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 flex items-center justify-center gap-2 flex-wrap text-xs",
						children: [verifiedWhatsappPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `https://wa.me/${verifiedWhatsappPhone.replace(/[^0-9]/g, "")}`,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg btn-emerald font-bold text-[11px] transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["WhatsApp: ", verifiedWhatsappPhone] })]
						}), normalizeFacebookProfileUrl(currentUser?.facebookUrl) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: normalizeFacebookProfileUrl(currentUser?.facebookUrl),
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg btn-facebook font-bold text-[11px] transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Facebook Profile" })]
						})]
					}),
					statusToast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2.5 p-2.5 rounded-xl bg-black/25 border border-white/25 text-xs font-bold text-white",
						children: statusToast
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center justify-center gap-2 flex-wrap",
						children: [
							!isLoggedIn && onOpenAuthModal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onOpenAuthModal,
								className: "min-h-[44px] px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-amber-400 text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "লগইন / সাইন ইন" : "Sign In Now" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: openInlineQuickEdit,
								className: `min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${displayRole === "ADMIN" ? "btn-amber" : "btn-crimson"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hasSavedProfile ? lang === "bn" ? "প্রোফাইল তথ্য পরিবর্তন করুন" : "Edit Profile Info" : lang === "bn" ? "নিজের প্রোফাইল তথ্য লিখুন" : "Enter My Profile Info" })]
							}),
							onOpenRegister && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => onOpenRegister("USER"),
								className: "min-h-[44px] px-3.5 py-2 rounded-xl btn-sky text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "ছবি ও পূর্ণ সেটআপ" : "Photo & Full Setup" })]
							}),
							hasSavedProfile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: handleDownloadSmartIdPng,
								className: "min-h-[44px] px-3.5 py-2 rounded-xl btn-obsidian text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "আইডি কার্ড (.PNG)" : "Download ID (.PNG)" })]
							}),
							hasSavedProfile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setIsCertOpen(true),
								className: "min-h-[44px] px-3.5 py-2 rounded-xl btn-violet text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "w-3.5 h-3.5 text-amber-200 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "সম্মাননা সনদপত্র" : "Certificate" })]
							}),
							(isLoggedIn || hasSavedProfile) && (confirmDeleteMyProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: isDeletingMyProfile,
								onClick: async () => {
									setIsDeletingMyProfile(true);
									try {
										await deleteMyUserAndDonorDataInFirestore(firebaseUser);
										localStorage.removeItem("bloodsearch_current_user");
										localStorage.removeItem("bloodsearch_pending_profile_draft");
										setCurrentUser(null);
										setConfirmDeleteMyProfile(false);
										window.dispatchEvent(new Event("bloodsearch_user_changed"));
										showToast(lang === "bn" ? "✓ আপনার প্রোফাইল ও ডোনার ডাটা সম্পূর্ণ ডিলিট হয়েছে।" : "✓ Your profile & donor data have been permanently deleted.");
									} finally {
										setIsDeletingMyProfile(false);
									}
								},
								className: "min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isDeletingMyProfile ? lang === "bn" ? "ডিলিট হচ্ছে..." : "Deleting..." : lang === "bn" ? "নিশ্চিত? আমার ডাটা ডিলিট" : "Confirm Delete My Data" })]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setConfirmDeleteMyProfile(true),
								className: "min-h-[44px] px-3.5 py-2 rounded-xl bg-black/25 hover:bg-rose-600 border border-white/25 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "প্রোফাইল ডিলিট" : "Delete My Data" })]
							})),
							(isLoggedIn || hasSavedProfile) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: async () => {
									try {
										clearDevOtpSandboxSession();
										localStorage.removeItem("bloodsearch_pending_profile_draft");
										localStorage.removeItem("bloodsearch_current_user");
										await signOutReal();
									} catch {}
									setDevOtpSession(null);
									setCurrentUser(null);
									setFirebaseUser(null);
									showToast(lang === "bn" ? "আপনি সফলভাবে লগআউট হয়েছেন।" : "Logged out successfully.");
								},
								className: "min-h-[44px] px-3.5 py-2 rounded-xl btn-soft-rose text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
								title: "বর্তমান অ্যাকাউন্ট থেকে লগআউট করুন",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "লগআউট" : "Logout" })]
							})
						]
					}),
					isQuickEditOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveQuickEdit,
						className: "mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 text-left space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xs sm:text-sm font-black text-slate-900 dark:text-white",
									children: lang === "bn" ? "নিজের প্রোফাইল তথ্য দিন (নাম, বয়স, ওজন, গ্রুপ ও ঠিকানা)" : "Enter Your Profile Info (Name, Age, Weight, Group & Address)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setIsQuickEditOpen(false),
									className: "min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
								})]
							}),
							quickEditError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-200 space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: quickEditError }), onOpenAuthModal && !firebaseUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: onOpenAuthModal,
									className: "min-h-[36px] px-3.5 py-1.5 rounded-xl btn-indigo font-bold text-xs cursor-pointer inline-flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "লগইন করে সেভ সম্পন্ন করুন" : "Sign In to Finish Saving" })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "profile-edit-name",
										className: "block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1",
										children: lang === "bn" ? "আপনার নাম *" : "Your Name *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "profile-edit-name",
										name: "editName",
										type: "text",
										required: true,
										maxLength: 80,
										value: editName,
										onChange: (e) => setEditName(e.target.value),
										placeholder: lang === "bn" ? "আপনার নাম লিখুন" : "Your full name",
										className: "w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "profile-edit-phone",
										className: "block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1",
										children: lang === "bn" ? "মোবাইল নম্বর (Call) *" : "Mobile Number (Call) *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "profile-edit-phone",
										name: "editPhone",
										type: "tel",
										required: true,
										value: editPhone,
										onChange: (e) => setEditPhone(e.target.value),
										placeholder: "017XXXXXXXX",
										className: "w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-1 mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "profile-edit-whatsapp",
											className: "text-[11px] font-bold text-slate-700 dark:text-slate-300",
											children: lang === "bn" ? "WhatsApp নম্বর *" : "WhatsApp Number *"
										}), editPhone.trim() && editWhatsapp !== editPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setEditWhatsapp(editPhone),
											className: "text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer",
											children: lang === "bn" ? "মোবাইলের মতোই" : "Same as Mobile"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "profile-edit-whatsapp",
										name: "editWhatsapp",
										type: "tel",
										required: true,
										value: editWhatsapp,
										onChange: (e) => setEditWhatsapp(e.target.value),
										placeholder: "017XXXXXXXX",
										className: "w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "profile-edit-facebook",
										className: "block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1",
										children: lang === "bn" ? "Facebook প্রোফাইল লিংক / আইডি *" : "Facebook Profile Link / ID *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "w-3.5 h-3.5 text-[#1877f2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "profile-edit-facebook",
											name: "editFacebook",
											type: "text",
											required: true,
											maxLength: 200,
											value: editFacebook,
											onChange: (e) => setEditFacebook(e.target.value),
											placeholder: "https://facebook.com/your.id",
											className: "w-full h-11 pl-8 pr-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
										})]
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-3 gap-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "profile-edit-age",
										className: "block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1",
										children: lang === "bn" ? "বয়স (১৮–৬৫ বছর) *" : "Age (18–65 yrs) *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "profile-edit-age",
										name: "editAge",
										type: "text",
										inputMode: "numeric",
										required: true,
										maxLength: 3,
										value: editAge,
										onChange: (e) => setEditAge(e.target.value),
										placeholder: lang === "bn" ? "বয়স (যেমন: ২৪)" : "Age (e.g. 24)",
										className: "w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "profile-edit-weight",
										className: "block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1",
										children: lang === "bn" ? "ওজন কেজি (৪০–১৮০) *" : "Weight kg (40–180) *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "profile-edit-weight",
										name: "editWeight",
										type: "text",
										inputMode: "numeric",
										required: true,
										maxLength: 3,
										value: editWeight,
										onChange: (e) => setEditWeight(e.target.value),
										placeholder: lang === "bn" ? "ওজন (যেমন: ৬৫)" : "Weight (e.g. 65)",
										className: "w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "profile-edit-gender",
										className: "block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1",
										children: lang === "bn" ? "লিঙ্গ *" : "Gender *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										id: "profile-edit-gender",
										name: "editGender",
										required: true,
										value: editGender,
										onChange: (e) => setEditGender(e.target.value),
										className: "w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: lang === "bn" ? "-- নির্বাচন করুন --" : "-- Select --"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "MALE",
												children: lang === "bn" ? "পুরুষ (Male)" : "Male"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "FEMALE",
												children: lang === "bn" ? "মহিলা (Female)" : "Female"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "OTHER",
												children: lang === "bn" ? "অন্যান্য" : "Other"
											})
										]
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1",
								children: lang === "bn" ? "রক্তের গ্রুপ *" : "Blood Group *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-4 sm:grid-cols-8 gap-1.5",
								children: ALL_BLOOD_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setEditGroup(g),
									className: `min-h-[38px] rounded-xl font-black text-xs cursor-pointer ${editGroup === g ? "btn-crimson" : "bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"}`,
									children: g
								}, g))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[11px] font-bold text-slate-700 dark:text-slate-300",
											children: lang === "bn" ? "জেলা ও এলাকার ঠিকানা (নিজে লিখুন অথবা GPS নিন) *" : "District & Area Address (Type manually or Use GPS) *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleQuickEditGps,
											disabled: isLocatingQuickGps,
											className: "min-h-[34px] px-2.5 py-1 rounded-lg btn-sky text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocateFixed, { className: `w-3 h-3 ${isLocatingQuickGps ? "animate-spin" : ""}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isLocatingQuickGps ? lang === "bn" ? "GPS নেওয়া হচ্ছে..." : "Locating..." : lang === "bn" ? "আমার GPS নিন" : "Use My GPS" })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-12 gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											id: "profile-edit-district",
											name: "editDistrict",
											required: true,
											value: editDistrict,
											onChange: (e) => setEditDistrict(e.target.value),
											className: "sm:col-span-5 h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: lang === "bn" ? "-- জেলা নির্বাচন করুন --" : "-- Select District --"
											}), DISTRICTS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: d.id,
												children: lang === "bn" ? d.nameBn : d.nameEn
											}, d.id))]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "profile-edit-area",
											name: "editArea",
											type: "text",
											required: true,
											maxLength: 120,
											value: editArea,
											onChange: (e) => setEditArea(e.target.value),
											placeholder: lang === "bn" ? "যেমন: নিকেতন, রোড ৪ / Niketon / ধানমন্ডি..." : "e.g. Niketon, Road 4 / Gulshan-1...",
											className: "sm:col-span-7 h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
										})]
									}),
									editDistrict === "dhaka" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-1.5 flex-wrap",
										children: [
											lang === "bn" ? "নিকেতন, গুলশান-১" : "Niketon, Gulshan-1",
											lang === "bn" ? "বনানী" : "Banani",
											lang === "bn" ? "ধানমন্ডি" : "Dhanmondi",
											lang === "bn" ? "মিরপুর" : "Mirpur",
											lang === "bn" ? "উত্তরা" : "Uttara",
											lang === "bn" ? "বনশ্রী" : "Banasree"
										].map((chip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setEditArea(chip),
											className: "min-h-[30px] px-2 py-0.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer",
											children: chip
										}, chip))
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-end gap-2 pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setIsQuickEditOpen(false),
									className: "min-h-[42px] px-3.5 py-2 rounded-xl btn-surface text-xs font-bold cursor-pointer whitespace-nowrap",
									children: lang === "bn" ? "বাতিল" : "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: isSavingQuickEdit,
									className: "min-h-[42px] px-4 py-2 rounded-xl btn-emerald text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isSavingQuickEdit ? lang === "bn" ? "সেভ হচ্ছে..." : "Saving..." : lang === "bn" ? "পরিবর্তন সেভ করুন" : "Save Changes" })]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `grid ${displayDonations > 0 ? "grid-cols-4" : "grid-cols-3"} gap-2 mt-4 pt-4 border-t border-white/20`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 sm:p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-white/30 dark:border-slate-700 flex flex-col items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-slate-500 dark:text-slate-400 font-bold",
									children: lang === "bn" ? "রক্তের গ্রুপ" : "Group"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm sm:text-base font-black text-rose-600 dark:text-rose-400",
									children: displayGroupLabel
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 sm:p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-white/30 dark:border-slate-700 flex flex-col items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-slate-500 dark:text-slate-400 font-bold",
									children: lang === "bn" ? "লিঙ্গ" : "Gender"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100",
									children: displayGender
								})]
							}),
							displayDonations > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 sm:p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-white/30 dark:border-slate-700 flex flex-col items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-slate-500 dark:text-slate-400 font-bold",
									children: lang === "bn" ? "রক্তদান" : "Donated"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs sm:text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400",
									children: [
										displayDonations,
										" ",
										lang === "bn" ? "বার" : "times"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2 sm:p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-white/30 dark:border-slate-700 flex flex-col items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-slate-500 dark:text-slate-400 font-bold",
									children: lang === "bn" ? "বয়স" : "Age"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100",
									children: displayAgeText
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800 text-left space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-bold text-slate-900 dark:text-white block",
								children: lang === "bn" ? "রক্তদান প্রস্তুতি স্ট্যাটাস" : "Donation Availability"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums",
								children: confirmedAtMs ? lang === "bn" ? `সর্বশেষ নিশ্চিতকরণ: ${new Date(confirmedAtMs).toLocaleString("bn-BD")}` : `Last confirmed: ${new Date(confirmedAtMs).toLocaleString()}` : lang === "bn" ? "এখনো আজকের প্রস্তুতি নিশ্চিত করা হয়নি" : "Availability not confirmed recently"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: isSavingConsent,
								onClick: () => applyConsentAndAvailabilityUpdate({
									availabilityStatus: "AVAILABLE",
									confirmNow: true
								}),
								className: "min-h-[40px] px-3 py-1.5 rounded-xl btn-emerald text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "এখন প্রস্তুত নিশ্চিত করুন" : "Confirm Available Now" })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950",
							children: [
								{
									id: "AVAILABLE",
									bn: "রক্তদানে প্রস্তুত",
									en: "Available"
								},
								{
									id: "TEMPORARILY_UNAVAILABLE",
									bn: "সাময়িক অনুপস্থিত",
									en: "Temporarily Away"
								},
								{
									id: "DND",
									bn: "বিরতি মোড",
									en: "Do Not Disturb"
								}
							].map((opt) => {
								const active = availabilityStatus === opt.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => applyConsentAndAvailabilityUpdate({
										availabilityStatus: opt.id,
										confirmNow: opt.id === "AVAILABLE"
									}),
									className: `min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap truncate ${active ? opt.id === "AVAILABLE" ? "btn-emerald" : opt.id === "DND" ? "btn-crimson" : "btn-obsidian" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`,
									children: lang === "bn" ? opt.bn : opt.en
								}, opt.id);
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-start justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "যোগাযোগের গোপনীয়তা ও জরুরি অ্যালার্ট নিয়ন্ত্রণ" : "Contact Privacy & Emergency Alert Preferences" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-slate-600 dark:text-slate-400 mt-0.5",
							children: lang === "bn" ? "আপনার সম্মতি ছাড়া গোপন নম্বর কখনোই প্রকাশ করা হয় না। যেকোনো সময় সরাসরি কল বা অ্যালার্ট বিরত রাখতে পারবেন।" : "Your phone number is never shared without consent. Pause alerts or change who can contact you anytime."
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "profile-contact-visibility",
								className: "block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1",
								children: lang === "bn" ? "কে আপনাকে সরাসরি কল বা WhatsApp করতে পারবেন?" : "Who can view & contact you directly?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "profile-contact-visibility",
								name: "contactVisibility",
								value: contactVisibility,
								onChange: (e) => applyConsentAndAvailabilityUpdate({ contactVisibility: e.target.value }),
								className: "w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "PUBLIC_OPT_IN",
										children: lang === "bn" ? "সকল জরুরি রক্তপ্রার্থী — সরাসরি Call ও WhatsApp (দ্রুততম)" : "All Emergency Seekers — Direct Call & WhatsApp (Fastest)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "VERIFIED_SEEKERS",
										children: lang === "bn" ? "শুধু ভেরিফাইড লগইনকৃত রক্তপ্রার্থী" : "Verified Signed-In Blood Seekers Only"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "REQUEST_ONLY",
										children: lang === "bn" ? "নম্বর গোপন — ইন-অ্যাপ চ্যাট বা অনুমতি সাপেক্ষে" : "Private — In-App Chat or Consent Request Only"
									})
								]
							})] }),
							contactVisibility !== "REQUEST_ONLY" && availabilityStatus !== "DND" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "inline-flex items-center gap-2 cursor-pointer min-h-[36px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "profile-allow-call",
											name: "allowCall",
											type: "checkbox",
											checked: allowCall,
											onChange: (e) => applyConsentAndAvailabilityUpdate({ allowCall: e.target.checked }),
											className: "w-4 h-4 rounded text-emerald-600"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "ফোন কল অনুমোদিত" : "Allow Phone Call" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "inline-flex items-center gap-2 cursor-pointer min-h-[36px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "profile-allow-whatsapp",
											name: "allowWhatsApp",
											type: "checkbox",
											checked: allowWhatsApp,
											onChange: (e) => applyConsentAndAvailabilityUpdate({ allowWhatsApp: e.target.checked }),
											className: "w-4 h-4 rounded text-emerald-600"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "WhatsApp অনুমোদিত" : "Allow WhatsApp" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "inline-flex items-center gap-2 cursor-pointer min-h-[36px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "profile-allow-sms",
											name: "allowSms",
											type: "checkbox",
											checked: allowSms,
											onChange: (e) => applyConsentAndAvailabilityUpdate({ allowSms: e.target.checked }),
											className: "w-4 h-4 rounded text-emerald-600"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "SMS অনুমোদিত" : "Allow SMS" })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => applyConsentAndAvailabilityUpdate({ emergencyAlertsOptIn: !emergencyAlertsOptIn }),
									className: "min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "জরুরি রক্তের নোটিফিকেশন" : "Emergency Blood Alerts" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `font-bold ${emergencyAlertsOptIn ? "text-emerald-600" : "text-slate-400"}`,
										children: emergencyAlertsOptIn ? lang === "bn" ? "চালু" : "On" : lang === "bn" ? "বন্ধ" : "Off"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => applyConsentAndAvailabilityUpdate({ alertsPaused: !alertsPaused }),
									className: "min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "w-3.5 h-3.5 text-amber-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "নোটিফিকেশন সাময়িক বিরতি" : "Pause Notifications" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `font-bold ${alertsPaused ? "text-amber-600" : "text-slate-400"}`,
										children: alertsPaused ? lang === "bn" ? "বিরত" : "Paused" : lang === "bn" ? "সচল" : "Active"
									})]
								})]
							})
						]
					}),
					incomingContactRequests.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-xs font-bold text-slate-900 dark:text-white",
							children: lang === "bn" ? `নম্বর দেখার অনুমতি অনুরোধ (${incomingContactRequests.length})` : `Consent Contact Requests (${incomingContactRequests.length})`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: incomingContactRequests.slice(0, 6).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "font-bold text-slate-900 dark:text-white truncate",
										children: [
											item.seekerName,
											" · ",
											item.bloodGroupNeeded,
											" (",
											item.urgency,
											")"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-slate-500 dark:text-slate-400 truncate",
										children: [
											item.hospitalName,
											" · Callback: ",
											item.seekerPhone
										]
									})]
								}), item.status === "PENDING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => handleRespondContactReq(item.id, true),
										className: "min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "নম্বর শেয়ার করুন" : "Approve & Share" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => handleRespondContactReq(item.id, false),
										className: "min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer whitespace-nowrap",
										children: lang === "bn" ? "বাতিল" : "Decline"
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-mono font-bold text-slate-500 shrink-0",
									children: item.status
								})]
							}, item.id))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-bold text-sm sm:text-base text-slate-900 dark:text-white",
							children: lang === "bn" ? "রক্তদান ডায়েরি ও রিকভারি রেকর্ড" : "Donation Log & Recovery History"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-slate-600 dark:text-slate-400",
							children: lang === "bn" ? `সর্বশেষ রক্তদান: ${recovery.lastDonatedLabel} · স্ট্যাটাস: ${recovery.nextEligibleDateLabel}` : `Last donation: ${recovery.lastDonatedLabel} · Status: ${recovery.nextEligibleDateLabel}`
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setShowLogForm(!showLogForm),
							className: "min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarCheck, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "+ রক্তদান লগ করুন" : "+ Log Donation" })]
						})]
					}),
					showLogForm && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveDonationLog,
						className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "profile-log-date",
									className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: lang === "bn" ? "রক্তদানের তারিখ" : "Donation Date"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "profile-log-date",
									name: "logDate",
									type: "date",
									value: logDate,
									max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
									onChange: (e) => setLogDate(e.target.value),
									className: "w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white",
									required: true
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "profile-log-type",
									className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",
									children: lang === "bn" ? "রক্তদানের ধরন" : "Donation Type"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									id: "profile-log-type",
									name: "logType",
									value: logType,
									onChange: (e) => setLogType(e.target.value),
									className: "w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "WHOLE_BLOOD",
										children: lang === "bn" ? "পূর্ণ রক্ত / Whole Blood (৯০ দিন বিরতি)" : "Whole Blood (90d recovery)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "PLATELET",
										children: lang === "bn" ? "প্লাটিলেট / Platelet Apheresis (১৪ দিন বিরতি)" : "Platelet Apheresis (14d recovery)"
									})]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "profile-log-hospital",
								className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",
								children: lang === "bn" ? "হাসপাতাল বা ব্লাড ব্যাংকের নাম" : "Hospital or Blood Center"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "profile-log-hospital",
								name: "logHospital",
								type: "text",
								value: logHospital,
								onChange: (e) => setLogHospital(e.target.value),
								placeholder: lang === "bn" ? "যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল / রেড ক্রিসেন্ট" : "e.g. Dhaka Medical College Hospital",
								className: "w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowLogForm(false),
									className: "px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer",
									children: lang === "bn" ? "বাতিল" : "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: isLoggingDonation,
									className: "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer",
									children: isLoggingDonation ? lang === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving..." : lang === "bn" ? "✓ রেকর্ড সংরক্ষণ করুন" : "✓ Save Record"
								})]
							})
						]
					}),
					donationLogs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-500 dark:text-slate-400",
						children: lang === "bn" ? "এখনো কোনো রক্তদানের তারিখ ডায়েরিতে যুক্ত করা হয়নি। রক্তদান সম্পন্ন করলে উপরের বাটনে ক্লিক করে সংরক্ষণ করুন।" : "No completed donations logged yet. Tap \"+ Log Donation\" above to start tracking your 90-day recovery."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "divide-y divide-slate-200/70 dark:divide-slate-800",
						children: donationLogs.slice(0, 6).map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-2.5 flex items-center justify-between gap-2 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Droplet, { className: "w-4 h-4 text-rose-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-slate-900 dark:text-white truncate",
										children: log.hospital
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-slate-500 dark:text-slate-400",
										children: log.type === "PLATELET" ? lang === "bn" ? "প্লাটিলেট অ্যাফেরেসিস (১৪ দিন বিরতি)" : "Platelet Apheresis" : lang === "bn" ? "পূর্ণ রক্তদান (৯০ দিন বিরতি)" : "Whole Blood"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0",
								children: log.date
							})]
						}, log.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-sm sm:text-base text-slate-900 dark:text-white",
						children: lang === "bn" ? "স্বাস্থ্যগত মানদণ্ড" : "Health Conditions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-slate-600 dark:text-slate-400",
						children: lang === "bn" ? "চিকিৎসাগত নির্দেশিকা অনুযায়ী নিরাপত্তা যাচাই" : "Clinical safety verification parameters"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-bold text-emerald-700 dark:text-emerald-400",
						children: lang === "bn" ? "সুস্থ ও উপযুক্ত" : "Healthy"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3 pt-1",
					children: [
						{
							id: "nonAlcoholic",
							label: lang === "bn" ? "ধূমপান ও মাদকমুক্ত" : "Non-alcoholic"
						},
						{
							id: "hivNegative",
							label: lang === "bn" ? "এইচআইভি নেগেটিভ" : "HIV negative"
						},
						{
							id: "rheumaticFeverNegative",
							label: lang === "bn" ? "বাতজ্বর মুক্ত" : "No rheumatic fever"
						},
						{
							id: "covidNegative",
							label: lang === "bn" ? "সংক্রামক জ্বরমুক্ত" : "No active infection"
						},
						{
							id: "thalassemiaNegative",
							label: lang === "bn" ? "থ্যালাসেমিয়ামুক্ত" : "No thalassemia"
						},
						{
							id: "hepatitisNegative",
							label: lang === "bn" ? "হেপাটাইটিস ও জন্ডিসমুক্ত" : "Hepatitis negative"
						},
						{
							id: "normalBloodPressure",
							label: lang === "bn" ? "স্বাভাবিক রক্তচাপ" : "Normal blood pressure"
						}
					].map((item) => {
						const isChecked = healthConditions[item.id];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onClick: () => toggleCondition(item.id),
							className: "flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 transition-all",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold text-slate-800 dark:text-slate-200",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `w-9 h-5 rounded-full transition-colors relative ${isChecked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `w-4 h-4 rounded-full bg-white transition-transform shadow ${isChecked ? "translate-x-4" : "translate-x-0.5"}` })
							})]
						}, item.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-sm sm:text-base text-slate-900 dark:text-white",
						children: "App Update & Live OTA Sync"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-600 dark:text-slate-400 mt-0.5",
						children: "Installed APKs receive web updates automatically without reinstalling. Older APK versions keep working smoothly when you tap “Maybe Later”."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400",
						children: "OTA Ready"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2 pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							window.dispatchEvent(new Event("bloodsearch_manual_update_check"));
						},
						className: "min-h-[42px] px-4 py-2 rounded-xl btn-crimson text-xs font-bold cursor-pointer",
						children: "Check for App Update"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							window.dispatchEvent(new Event("bloodsearch_preview_update_modal"));
						},
						className: "min-h-[42px] px-4 py-2 rounded-xl btn-surface text-xs font-bold cursor-pointer",
						children: "Preview Update Screen"
					})]
				})]
			}),
			isQrOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] p-5 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 text-center space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-sm text-slate-900 dark:text-white",
								children: "Hospital Check-In QR Pass"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setIsQrOpen(false),
								className: "p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-5 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "w-48 h-48 bg-slate-950 rounded-xl p-3 flex flex-col justify-between",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-12 h-12 bg-white rounded p-1 flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-6 h-6 bg-slate-950" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-12 h-12 bg-white rounded p-1 flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-6 h-6 bg-slate-950" })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-center font-mono text-[9px] text-white break-all px-1",
										children: displayId
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-12 h-12 bg-white rounded p-1 flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-6 h-6 bg-slate-950" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-8 h-8 bg-rose-500 rounded flex items-center justify-center text-white font-black text-xs",
											children: displayGroup
										})]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-bold text-sm text-slate-900 dark:text-white",
							children: [
								displayName,
								" · Blood Group ",
								displayGroup
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-slate-500 mt-1",
							children: "Scan at hospital reception or blood transfusion unit for instant verification."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleDownloadSmartIdPng,
							className: "w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "স্মার্ট আইডি কার্ড (.PNG) ডাউনলোড" : "Download Smart ID (.PNG)" })]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrivacyPolicyModal, {
				isOpen: isPrivacyOpen,
				onClose: () => setIsPrivacyOpen(false),
				lang
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DonorCertificateModal, {
				isOpen: isCertOpen,
				onClose: () => setIsCertOpen(false),
				lang,
				donorName: displayName,
				bloodGroup: displayGroup,
				idCardNumber: displayId,
				totalDonations: Math.max(1, displayDonations)
			})
		]
	});
};
export { DonorProfileView };
