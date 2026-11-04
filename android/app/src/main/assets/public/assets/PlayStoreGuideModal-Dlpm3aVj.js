import { a as __toESM, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-C_MSr2-h.js";
import { t as Smartphone } from "./smartphone-DzTSJnQf.js";
import { Jn as CircleCheck, Un as Download, _n as Share2, an as usePWAInstall, cn as X, on as BrandLogo } from "./index-iojd0cJp.js";
// src/components/ecosystem/PlayStoreGuideModal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var PlayStoreGuideModal = ({ isOpen, onClose, lang }) => {
	const [installNotice, setInstallNotice] = (0, import_react.useState)(null);
	const { isInstallable, isInstalled, isIOS, isInIframe, promptInstall } = usePWAInstall();
	if (!isOpen) return null;
	const handleInstallClick = async () => {
		setInstallNotice(null);
		if (isInstalled) {
			setInstallNotice(lang === "bn" ? "অ্যাপটি ইতিমধ্যে আপনার ডিভাইসে ইনস্টল করা আছে।" : "BloodSearch is already installed on your device.");
			return;
		}
		if (isInstallable) {
			if (await promptInstall() === "accepted") setInstallNotice(lang === "bn" ? "অ্যাপ ইনস্টল শুরু হয়েছে! হোম স্ক্রিনে BloodSearch আইকন দেখুন।" : "Installation started! Check your home screen for BloodSearch.");
			return;
		}
		if (isIOS) {
			setInstallNotice(lang === "bn" ? "Safari ব্রাউজারের নিচে Share বাটনে ট্যাপ করে \"Add to Home Screen\" চাপুন।" : "Tap the Share button in Safari below, then choose \"Add to Home Screen\".");
			return;
		}
		if (isInIframe) {
			setInstallNotice(lang === "bn" ? "সরাসরি ইনস্টল করতে অ্যাপের মূল লিংকটি আপনার ফোনের Chrome বা Safari ব্রাউজারে খুলুন।" : "Open the live app link in Chrome or Safari on your phone to install directly.");
			return;
		}
		setInstallNotice(lang === "bn" ? "ব্রাউজারের উপরের মেন্যু (⋮) থেকে \"Install app\" বা \"Add to Home screen\" চাপুন।" : "Open your browser menu (⋮) and tap \"Install app\" or \"Add to Home screen\".");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-left",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "section-jewel-sapphire px-5 py-4 text-white flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, { size: "sm" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-black tracking-tight text-white truncate",
							children: lang === "bn" ? "BloodSearch অ্যাপ ইনস্টল করুন" : "Install BloodSearch App"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-sky-100/90 truncate",
							children: lang === "bn" ? "ফোনের হোম স্ক্রিনে ১-ট্যাপ দ্রুত ব্যবহারের জন্য" : "Add to your phone home screen for fast 1-tap access"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					"aria-label": "Close",
					className: "w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-4",
				children: [
					isInstalled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "BloodSearch অ্যাপ আপনার ডিভাইসে ইনস্টল করা আছে।" : "BloodSearch App is installed on your device." })]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: handleInstallClick,
						className: "w-full min-h-[48px] px-4 py-3 rounded-2xl btn-crimson font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "এখনই অ্যাপ ইনস্টল করুন" : "Install App Now" })]
					}),
					installNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs font-medium text-sky-900 dark:text-sky-200 leading-relaxed",
						children: installNotice
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "Android ফোনে (Chrome)" : "On Android (Chrome)" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-600 dark:text-slate-300 leading-relaxed",
								children: lang === "bn" ? "ব্রাউজারের উপরের ডানদিকে মেন্যু (⋮) চাপুন এবং \"Install app\" অথবা \"Add to Home screen\" নির্বাচন করুন।" : "Tap the browser menu (⋮) at the top right and select \"Install app\" or \"Add to Home screen\"."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "iPhone / iPad (Safari)" : "On iPhone / iPad (Safari)" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-600 dark:text-slate-300 leading-relaxed",
								children: lang === "bn" ? "Safari ব্রাউজারের নিচে Share বাটনে ট্যাপ করে \"Add to Home Screen\" বেছে নিন।" : "Tap the Share button at the bottom of Safari and choose \"Add to Home Screen\"."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "w-full min-h-[42px] px-4 py-2 rounded-xl btn-surface text-xs font-bold cursor-pointer",
						children: lang === "bn" ? "বন্ধ করুন" : "Close"
					})
				]
			})]
		})
	});
};
export { PlayStoreGuideModal };
