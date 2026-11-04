import { a as __toESM, n as createLucideIcon, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-C_MSr2-h.js";
import { Jn as CircleCheck, Xn as CircleAlert, bn as RotateCcw, o as getTranslation } from "./index-iojd0cJp.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ClipboardCheck = createLucideIcon("clipboard-check", [
	["rect", {
		width: "8",
		height: "4",
		x: "8",
		y: "2",
		rx: "1",
		ry: "1",
		key: "tgr4d6"
	}],
	["path", {
		d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
		key: "116196"
	}],
	["path", {
		d: "m9 14 2 2 4-4",
		key: "df797q"
	}]
]);
// src/components/EligibilityChecker.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var EligibilityChecker = ({ lang }) => {
	const t = getTranslation(lang);
	const [age, setAge] = (0, import_react.useState)(24);
	const [weightKg, setWeightKg] = (0, import_react.useState)(62);
	const [daysSinceLastDonation, setDaysSinceLastDonation] = (0, import_react.useState)(100);
	const [hasRecentFeverOrAntibiotics, setHasRecentFeverOrAntibiotics] = (0, import_react.useState)(false);
	const [hasRecentSurgeryOrTattoo, setHasRecentSurgeryOrTattoo] = (0, import_react.useState)(false);
	const [isPregnantOrLactating, setIsPregnantOrLactating] = (0, import_react.useState)(false);
	const [hasChronicIllness, setHasChronicIllness] = (0, import_react.useState)(false);
	const isAgeValid = age >= 18 && age <= 65;
	const isWeightValid = weightKg >= 48;
	const isCooldownValid = daysSinceLastDonation >= 90;
	const isEligible = isAgeValid && isWeightValid && isCooldownValid && !hasRecentFeverOrAntibiotics && !hasRecentSurgeryOrTattoo && !isPregnantOrLactating && !hasChronicIllness;
	const handleReset = () => {
		setAge(24);
		setWeightKg(62);
		setDaysSinceLastDonation(100);
		setHasRecentFeverOrAntibiotics(false);
		setHasRecentSurgeryOrTattoo(false);
		setIsPregnantOrLactating(false);
		setHasChronicIllness(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, { className: "w-5 h-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white",
						children: t.eligibilityTitle
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1",
					children: t.eligibilitySubtitle
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleReset,
					className: "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer self-start sm:self-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "রিসেট" : "Reset" })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pt-4",
				children: isEligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-sm sm:text-base",
						children: lang === "bn" ? "অভিনন্দন! আপনি আজ রক্তদান করতে পারেন।" : "Congratulations! You are eligible to donate blood today."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-emerald-800 dark:text-emerald-300 mt-0.5",
						children: lang === "bn" ? "আপনার বয়স, ওজন এবং রক্তদানের বিরতি নির্দেশিকা অনুযায়ী সঠিক রয়েছে। পর্যাপ্ত পানি পান করে রক্তদান কেন্দ্রে আসুন।" : "Your age, weight, and donation interval meet national blood transfusion safety standards."
					})] })]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-sm sm:text-base",
						children: lang === "bn" ? "বর্তমানে রক্তদান সাময়িকভাবে স্থগিত রাখা উচিত" : "Temporary Deferral / Not Recommended Today"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "text-xs text-amber-800 dark:text-amber-300 mt-1 space-y-1 list-disc pl-4",
						children: [
							!isAgeValid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: lang === "bn" ? "বয়স ১৮ থেকে ৬৫ বছরের মধ্যে হতে হবে।" : "Age must be between 18 and 65 years." }),
							!isWeightValid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: lang === "bn" ? "ওজন কমপক্ষে ৪৮ কেজি হতে হবে।" : "Body weight must be at least 48 kg." }),
							!isCooldownValid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: lang === "bn" ? `সর্বশেষ রক্তদানের পর কমপক্ষে ৯০ দিন (৩ মাস) বিরতি প্রয়োজন। বাকি আছে ${90 - daysSinceLastDonation} দিন।` : `At least 90 days required between donations. ${90 - daysSinceLastDonation} days remaining.` }),
							hasRecentFeverOrAntibiotics && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: lang === "bn" ? "জ্বর বা অ্যান্টিবায়োটিক গ্রহণের পর ৭ দিন অপেক্ষা করুন।" : "Wait 7 days after fever or antibiotics." }),
							hasRecentSurgeryOrTattoo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: lang === "bn" ? "বড় সার্জারি বা উল্কি আঁকার পর ৬ মাস বিরতি বাধ্যতামূলক।" : "Wait 6 months after surgery or tattoos." }),
							isPregnantOrLactating && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: lang === "bn" ? "গর্ভবতী বা স্তন্যদানকারী মায়েদের রক্তদান থেকে বিরত থাকতে হবে।" : "Blood donation is not permitted during pregnancy or lactation." }),
							hasChronicIllness && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: lang === "bn" ? "গুরুতর হৃদরোগ, ক্যান্সার বা হেপাটাইটিসে রক্তদান নিষিদ্ধ।" : "Chronic conditions require consulting a physician." })
						]
					})] })]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider",
						children: lang === "bn" ? "শারীরিক তথ্য (Physical Parameters)" : "Physical Parameters"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "বয়স (বছর)" : "Age (Years)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-rose-600 dark:text-rose-400 font-bold",
								children: [
									age,
									" ",
									lang === "bn" ? "বছর" : "years"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "eligibilityAge",
							type: "range",
							min: "15",
							max: "75",
							value: age,
							onChange: (e) => setAge(Number(e.target.value)),
							className: "w-full accent-rose-600 cursor-pointer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-[10px] text-slate-400 mt-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "১৫ বছর" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "১৮-৬৫ বছর (বৈধ)" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "৭৫ বছর" })
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "ওজন (কেজি)" : "Weight (Kg)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-rose-600 dark:text-rose-400 font-bold",
								children: [weightKg, " kg"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "eligibilityWeightKg",
							type: "range",
							min: "35",
							max: "110",
							value: weightKg,
							onChange: (e) => setWeightKg(Number(e.target.value)),
							className: "w-full accent-rose-600 cursor-pointer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-[10px] text-slate-400 mt-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "৩৫ কেজি" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ন্যূনতম ৪৮ কেজি" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "১১০ কেজি" })
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "সর্বশেষ রক্তদানের বিরতি (দিন)" : "Days Since Last Donation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-rose-600 dark:text-rose-400 font-bold",
								children: [
									daysSinceLastDonation,
									" ",
									lang === "bn" ? "দিন" : "days"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "daysSinceLastDonation",
							type: "range",
							min: "0",
							max: "180",
							value: daysSinceLastDonation,
							onChange: (e) => setDaysSinceLastDonation(Number(e.target.value)),
							className: "w-full accent-rose-600 cursor-pointer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-[10px] text-slate-400 mt-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "০ দিন" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "৯০ দিন (৩ মাস বিরতি)" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "১৮০+ দিন" })
							]
						})
					] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider",
						children: lang === "bn" ? "চিকিৎসাগত ইতিহাস (Medical Screening)" : "Medical Screening"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "hasRecentFeverOrAntibiotics",
							type: "checkbox",
							checked: hasRecentFeverOrAntibiotics,
							onChange: (e) => setHasRecentFeverOrAntibiotics(e.target.checked),
							className: "mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-700 dark:text-slate-300 font-medium",
							children: lang === "bn" ? "গত ৭ দিনে জ্বর, সর্দি, বা কোনো অ্যান্টিবায়োটিক সেবন করেছেন?" : "Fever, severe cold, or antibiotic medication in the past 7 days?"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "hasRecentSurgeryOrTattoo",
							type: "checkbox",
							checked: hasRecentSurgeryOrTattoo,
							onChange: (e) => setHasRecentSurgeryOrTattoo(e.target.checked),
							className: "mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-700 dark:text-slate-300 font-medium",
							children: lang === "bn" ? "গত ৬ মাসের মধ্যে কোনো বড় অস্ত্রোপচার বা ট্যাটু/উল্কি করিয়েছেন?" : "Major surgical operation or tattoo in the past 6 months?"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "isPregnantOrLactating",
							type: "checkbox",
							checked: isPregnantOrLactating,
							onChange: (e) => setIsPregnantOrLactating(e.target.checked),
							className: "mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-700 dark:text-slate-300 font-medium",
							children: lang === "bn" ? "বর্তমানে গর্ভবতী বা শিশুকে দুগ্ধপান করাচ্ছেন?" : "Currently pregnant or breastfeeding infant?"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "hasChronicIllness",
							type: "checkbox",
							checked: hasChronicIllness,
							onChange: (e) => setHasChronicIllness(e.target.checked),
							className: "mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-700 dark:text-slate-300 font-medium",
							children: lang === "bn" ? "হেপাটাইটিস বি/সি, এইডস বা গুরুতর ডায়াবেটিসের সমস্যা রয়েছে?" : "History of Hepatitis B/C, HIV, or severe chronic heart/kidney conditions?"
						})]
					})
				]
			})]
		})]
	});
};
export { EligibilityChecker };
