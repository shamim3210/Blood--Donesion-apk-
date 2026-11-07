import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { t as createLucideIcon } from "./createLucideIcon-DRE67aPD.js";
import { Jn as CircleCheck, Pn as Lock, dn as UserCheck, et as runSmartDatabaseHealthAndSecurityAudit, hn as ShieldCheck, o as getTranslation, s as DATABASE_COLLECTION_ARCHITECTURES, xn as RefreshCw } from "./index-BZGxtQ_X.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Server = createLucideIcon("server", [
	["rect", {
		width: "20",
		height: "8",
		x: "2",
		y: "2",
		rx: "2",
		ry: "2",
		key: "ngkwjq"
	}],
	["rect", {
		width: "20",
		height: "8",
		x: "2",
		y: "14",
		rx: "2",
		ry: "2",
		key: "iecqi9"
	}],
	["line", {
		x1: "6",
		x2: "6.01",
		y1: "6",
		y2: "6",
		key: "16zg32"
	}],
	["line", {
		x1: "6",
		x2: "6.01",
		y1: "18",
		y2: "18",
		key: "nzw8ys"
	}]
]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Terminal = createLucideIcon("terminal", [["path", {
	d: "M12 19h8",
	key: "baeox8"
}], ["path", {
	d: "m4 17 6-6-6-6",
	key: "1yngyt"
}]]);
// src/components/SecurityAuditModal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var SecurityAuditModal = ({ logs, lang }) => {
	const t = getTranslation(lang);
	const [healthReport, setHealthReport] = (0, import_react.useState)(null);
	const [isRunningAudit, setIsRunningAudit] = (0, import_react.useState)(false);
	const [tierFilter, setTierFilter] = (0, import_react.useState)("ALL");
	const executeLiveAudit = async () => {
		setIsRunningAudit(true);
		try {
			const res = await runSmartDatabaseHealthAndSecurityAudit();
			setHealthReport(res);
		} catch {} finally {
			setIsRunningAudit(false);
		}
	};
	(0, import_react.useEffect)(() => {
		executeLiveAudit();
	}, []);
	const filteredCollections = DATABASE_COLLECTION_ARCHITECTURES.filter((col) => tierFilter === "ALL" ? true : col.tier === tierFilter);
	const activeDbLayers = [
		{
			title: lang === "bn" ? "১. PII স্প্লিট আইসোলেশন (/users বনাম /donors)" : "1. Strict PII Split Isolation",
			desc: lang === "bn" ? "আসল ফোন নম্বর, WhatsApp ও ইমেইল /users/{uid} কালেকশনে লক করা (`allow list: if false`)। পাবলিক কার্ডে অবশ্যই `**` মাস্কড নম্বর (`017****00`) বাধ্যতামূলক।" : "Raw phone, WhatsApp & email stay locked inside /users/{uid} (`allow list: if false`). Public cards enforce `**` phone masking."
		},
		{
			title: lang === "bn" ? "২. অ্যান্টি-ফেক ডোনার ও বট ফায়ারওয়াল" : "2. 1-UID-1-Donor & Registered Profile Gate",
			desc: lang === "bn" ? "প্রতিটি অ্যাকাউন্ট সর্বোচ্চ ১টি ডোনার কার্ড খুলতে পারে (`donorId == uid`) এবং ভেরিফাইড `/users/{uid}` প্রোফাইল ছাড়া কেউ SOS, চ্যাট বা রিপোর্ট পোস্ট করতে পারে না।" : "Enforces `donorId == request.auth.uid` and `hasRegisteredUserProfile()` across SOS, chats, and reports."
		},
		{
			title: lang === "bn" ? "৩. সার্ভার-সাইড অ্যান্টি-XSS ও মিডিয়া শিল্ড" : "3. Kernel Anti-XSS & Safe Media Firewall",
			desc: lang === "bn" ? "Firestore কার্নেলে `isSafeText()` দিয়ে `<script>`, `javascript:` ও ক্ষতিকর HTML কোড এবং `isSafeMediaUri()` দিয়ে অনিরাপদ ফাইল লিংক সরাসরি ব্লক করা হয়েছে।" : "Server-side `isSafeText()` and `isSafeMediaUri()` reject script injection and unsafe URI schemes before storage."
		},
		{
			title: lang === "bn" ? "৪. ৯০-দিনের স্মার্ট অটো-রিকভারি ও সুপার ওনার ভল্ট" : "4. Smart 90-Day Auto-Unlock & Owner Vault",
			desc: lang === "bn" ? "রক্তদানের ৯০ দিন পূর্ণ হলে ডোনার কার্ড স্বয়ংক্রিয়ভাবে আবার \"প্রস্তুত\" হয় এবং অ্যাডমিন ভল্ট এককভাবে সুপার ওনার ও SHA-256 হ্যাশ দ্বারা সুরক্ষিত।" : "Automatically unlocks donor availability after 90 days of medical rest and locks admin elevation behind SHA-256 proofs."
		}
	];
	const consoleHardeningSteps = [
		{
			statusText: lang === "bn" ? "সক্রিয়" : "Active",
			title: lang === "bn" ? "PostgreSQL মেইন ডাটাবেস আইসোলেশন (/api/v1/*)" : "PostgreSQL Main Database Isolation (/api/v1/*)",
			desc: lang === "bn" ? "ডাটাবেস ক্রেডেনশিয়াল ও পুল শুধুমাত্র ব্যাকএন্ড সার্ভারে সীমাবদ্ধ; APK বা ব্রাউজার থেকে সরাসরি ডাটাবেসে প্রবেশ অসম্ভব।" : "Database credentials and connection pools live exclusively on the backend server; zero direct APK/browser DB access."
		},
		{
			statusText: lang === "bn" ? "সক্রিয়" : "Active",
			title: lang === "bn" ? "অ্যান্টি-স্ক্যানার, CSRF ও ইনজেকশন ফায়ারওয়াল" : "Anti-Scanner, CSRF & Injection Firewall",
			desc: lang === "bn" ? "স্বয়ংক্রিয় হ্যাকিং টুল (sqlmap/nikto), ক্রস-সাইট CSRF রিকোয়েস্ট এবং প্যারামিটারাইজড SQL কোয়েরি দ্বারা ইনজেকশন সম্পূর্ণ ব্লক।" : "Automated vulnerability scanners, cross-site CSRF mutations, and prototype/SQL injection payloads are blocked at ingress."
		},
		{
			statusText: lang === "bn" ? "সক্রিয়" : "Active",
			title: lang === "bn" ? "অ্যাডমিন ব্রুট-ফোর্স লকআউট ও টোকেন ভেরিফিকেশন" : "Admin Brute-Force Lockout & Token Gate",
			desc: lang === "bn" ? "অ্যাডমিন পরিচয় গোপন রাখা হয়েছে এবং ৫ বার ভুল চেষ্টায় স্বয়ংক্রিয়ভাবে ১৫ মিনিটের লকআউট কার্যকর হয়।" : "Admin identities are salted/hashed with zero email hints and automatic 5-attempt 15-minute brute-force lockout."
		},
		{
			statusText: lang === "bn" ? "সক্রিয়" : "Active",
			title: lang === "bn" ? "রেট-লিমিটেড ডোনার কন্টাক্ট প্রাইভেসি" : "Rate-Limited Donor Contact Protection",
			desc: lang === "bn" ? "রক্তদাতার সম্মতি অনুযায়ী কল, WhatsApp, SMS ও Facebook খোলা থাকে কিন্তু বাল্ক ডাটা স্ক্র্যাপিং সম্পূর্ণ নিষিদ্ধ।" : "Preserves opted-in Call, WhatsApp, SMS & Facebook for real seekers while blocking bulk directory scraping."
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start sm:items-center justify-between gap-4 flex-wrap pb-5 border-b border-slate-200 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-5 h-5 text-emerald-400 dark:text-emerald-600" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white",
							children: t.auditLogTitle
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1",
							children: lang === "bn" ? "সার্ভার-সাইড PostgreSQL মেইন ডাটাবেস ও জিরো-ট্রাস্ট ফায়ারওয়াল মনিটর" : "Server-Side PostgreSQL Main Database & Zero-Trust Firewall Monitor"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "সর্বোচ্চ নিরাপত্তা সক্রিয়" : "High Security Enforced" })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pt-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3 flex-wrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm sm:text-base font-bold text-slate-900 dark:text-white",
								children: lang === "bn" ? "লাইভ ক্লাউড ডাটাবেস স্ট্যাটাস ও জিরো-ট্রাস্ট পেনিট্রেশন সেলফ-টেস্ট" : "Live Cloud Database Telemetry & Zero-Trust Penetration Self-Test"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-600 dark:text-slate-400 mt-0.5",
								children: healthReport ? lang === "bn" ? `সর্বশেষ যাচাই: ${healthReport.checkedAt} · সার্ভার সংযোগ: ${healthReport.online ? "সক্রিয়" : "অফলাইন"} · রেসপন্স টাইম: ${healthReport.latencyMs} ms` : `Last checked: ${healthReport.checkedAt} · Connection: ${healthReport.online ? "Online" : "Offline"} · Latency: ${healthReport.latencyMs} ms` : lang === "bn" ? "ক্লাউড সার্ভারের সাথে সরাসরি সংযোগ ও নিরাপত্তা পরীক্ষা করা হচ্ছে..." : "Testing live Cloud Firestore latency and security rules..."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: executeLiveAudit,
								disabled: isRunningAudit,
								className: "px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `w-3.5 h-3.5 ${isRunningAudit ? "animate-spin" : ""}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isRunningAudit ? lang === "bn" ? "পরীক্ষা চলছে..." : "Testing..." : lang === "bn" ? "পুনরায় নিরাপত্তা পরীক্ষা চালান" : "Run Live Security Test" })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 sm:grid-cols-5 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-slate-500 dark:text-slate-400",
										children: lang === "bn" ? "ক্লাউড ডোনার কার্ড" : "Cloud Donors"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1",
										children: healthReport ? healthReport.counts.publicDonors : "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-slate-500 dark:text-slate-400",
										children: lang === "bn" ? "ক্লাউড SOS আবেদন" : "Cloud SOS Docs"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1",
										children: healthReport ? healthReport.counts.publicRequests : "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-slate-500 dark:text-slate-400",
										children: lang === "bn" ? "ব্লাড স্টক গ্রুপ" : "Stock Groups"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1",
										children: healthReport ? `${healthReport.counts.bloodStockGroups}/8` : "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-slate-500 dark:text-slate-400",
										children: lang === "bn" ? "কমিউনিটি বার্তা" : "Chat Messages"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1",
										children: healthReport ? healthReport.counts.communityMessages : "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-slate-500 dark:text-slate-400",
										children: lang === "bn" ? "কৃতজ্ঞতা দেয়াল" : "Gratitude Notes"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1",
										children: healthReport ? healthReport.counts.gratitudeNotes : "—"
									})]
								})
							]
						}),
						healthReport && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-left text-xs border-collapse",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2.5 px-3 font-semibold",
											children: lang === "bn" ? "লাইভ অ্যাটাক সিমুলেশন টেস্ট" : "Simulated Attack Probe"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2.5 px-3 font-semibold font-mono",
											children: lang === "bn" ? "টার্গেট পাথ" : "Target Vector"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "py-2.5 px-3 font-semibold",
											children: lang === "bn" ? "Firestore সার্ভারের সিদ্ধান্ত" : "Live Server Verdict"
										})
									]
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
									className: "divide-y divide-slate-200 dark:divide-slate-800",
									children: healthReport.probes.map((probe) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 px-3 font-semibold text-slate-900 dark:text-white",
											children: lang === "bn" ? probe.nameBn : probe.nameEn
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400",
											children: probe.attackVector
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2.5 px-3 font-mono font-semibold",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: probe.blockedAsExpected ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
												children: [probe.blockedAsExpected ? "✓ " : "✕ ", probe.serverVerdict]
											})
										})
									] }, probe.id))
								})]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-bold text-base text-slate-900 dark:text-white",
						children: lang === "bn" ? `আপনার ডাটাবেসের সম্পূর্ণ আর্কিটেকচার ম্যাপ (${DATABASE_COLLECTION_ARCHITECTURES.length}টি সুরক্ষিত পাথ)` : `Complete Cloud Firestore Architecture (${DATABASE_COLLECTION_ARCHITECTURES.length} Secured Paths)`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-600 dark:text-slate-400 mt-0.5",
						children: lang === "bn" ? "কোন কালেকশনে কী ডাটা থাকে, কে পড়তে/লিখতে পারে এবং কী কী স্মার্ট অটোমেশন চালু আছে তার পূর্ণ বিবরণ" : "Inspect every collection path, access boundary, schema fields, and smart automation rule"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-x-auto",
						children: [
							{
								id: "ALL",
								labelBn: "সবগুলো",
								labelEn: "All"
							},
							{
								id: "PRIVATE_PII",
								labelBn: "প্রাইভেট PII",
								labelEn: "Private PII"
							},
							{
								id: "PUBLIC_MASKED",
								labelBn: "পাবলিক মাস্কড",
								labelEn: "Public Masked"
							},
							{
								id: "PARTICIPANT_LOCKED",
								labelBn: "ইনবক্স লক",
								labelEn: "Inbox"
							},
							{
								id: "ADMIN_ONLY",
								labelBn: "অ্যাডমিন",
								labelEn: "Admin"
							},
							{
								id: "OWNER_VAULT",
								labelBn: "ওনার ভল্ট",
								labelEn: "Owner Vault"
							}
						].map((btn) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTierFilter(btn.id),
							className: `px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${tierFilter === btn.id ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
							children: lang === "bn" ? btn.labelBn : btn.labelEn
						}, btn.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-xs border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2.5 px-3 font-semibold",
									children: lang === "bn" ? "কালেকশন ও পাথ" : "Collection Path"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2.5 px-3 font-semibold",
									children: lang === "bn" ? "সিকিউরিটি স্তর" : "Access Policy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2.5 px-3 font-semibold",
									children: lang === "bn" ? "স্মার্ট অটোমেশন ও সুরক্ষা আচরণ" : "Smart Automation & Security Rule"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-slate-200/70 dark:divide-slate-800",
							children: filteredCollections.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-slate-50/70 dark:hover:bg-slate-800/40 align-top",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-3 px-3 min-w-[210px]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-bold text-slate-900 dark:text-white",
												children: lang === "bn" ? col.titleBn : col.titleEn
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-mono text-[11px] text-rose-600 dark:text-rose-400 mt-0.5",
												children: col.path
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1",
												children: col.fieldsSummary
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 px-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300",
										children: lang === "bn" ? col.tierLabelBn : col.tierLabelEn
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 px-3 text-slate-600 dark:text-slate-300 leading-relaxed min-w-[260px]",
										children: lang === "bn" ? col.smartBehaviorBn : col.smartBehaviorEn
									})
								]
							}, col.id))
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-2 gap-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 space-y-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCheck, { className: "w-4 h-4 text-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-bold text-sm sm:text-base text-slate-900 dark:text-white",
							children: lang === "bn" ? "ডাটাবেসে ইতিমধ্যে সক্রিয় নিরাপত্তা স্তরসমূহ" : "Active Firestore Zero-Trust Protections"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "divide-y divide-slate-200 dark:divide-slate-800",
						children: activeDbLayers.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-3 first:pt-1 last:pb-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4 text-emerald-500 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.title })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed",
								children: item.desc
							})]
						}, idx))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 space-y-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "w-4 h-4 text-blue-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-bold text-sm sm:text-base text-slate-900 dark:text-white",
							children: lang === "bn" ? "ক্লাউড কনসোল অতিরিক্ত নিরাপত্তা চেকলিস্ট (মালিকের জন্য)" : "Cloud Console Extra Hardening Checklist"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "divide-y divide-slate-200 dark:divide-slate-800",
						children: consoleHardeningSteps.map((step, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-3 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-slate-900 dark:text-white",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: step.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-400 mx-1.5",
											"aria-hidden": "true",
											children: "·"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-500 dark:text-slate-400 font-medium",
											children: step.statusText
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-slate-600 dark:text-slate-400 leading-relaxed",
									children: step.desc
								})]
							})
						}, idx))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: "w-4 h-4 text-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-bold text-sm sm:text-base text-slate-900 dark:text-white",
							children: lang === "bn" ? "সাম্প্রতিক নিরাপত্তা ও অ্যাকশন লগ" : "Real-Time Security & Action Log"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs font-mono tabular-nums text-slate-500",
						children: [
							logs.length,
							" ",
							lang === "bn" ? "টি এন্ট্রি" : "entries recorded"
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-xs border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-slate-200 dark:border-slate-800 text-slate-500",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2.5 px-3 font-semibold",
									children: lang === "bn" ? "অ্যাকশন" : "Action"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2.5 px-3 font-semibold",
									children: lang === "bn" ? "বিস্তারিত" : "Details"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2.5 px-3 font-semibold",
									children: lang === "bn" ? "সময়" : "Timestamp"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2.5 px-3 font-semibold font-mono",
									children: lang === "bn" ? "সিকিউরিটি হ্যাশ" : "Integrity Hash"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-slate-100 dark:divide-slate-800/60 font-mono tabular-nums",
							children: logs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/40",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap",
										children: log.action
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200",
										children: log.targetDetails
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 px-3 text-slate-500 whitespace-nowrap",
										children: log.timestamp
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2.5 px-3 text-slate-400 dark:text-slate-500 text-[11px]",
										children: log.securityHash
									})
								]
							}, log.id))
						})]
					})
				})]
			})
		]
	});
};
export { SecurityAuditModal };
