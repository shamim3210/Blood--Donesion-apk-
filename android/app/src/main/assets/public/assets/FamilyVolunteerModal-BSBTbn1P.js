import { a as __toESM, r as require_react, t as require_jsx_runtime } from "./jsx-runtime-C_MSr2-h.js";
import { t as HeartHandshake } from "./heart-handshake-kR5eoUQy.js";
import { Cn as Phone, Jn as CircleCheck, cn as X, hn as ShieldCheck, ln as Users, pn as Trash2, un as UserPlus } from "./index-iojd0cJp.js";
// src/components/ecosystem/FamilyVolunteerModal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var OFFICIAL_BLOOD_HOTLINES = [
	{
		id: "hl-999",
		nameBn: "জাতীয় জরুরি সেবা (অ্যাম্বুলেন্স ও পুলিশ)",
		nameEn: "National Emergency Service (Ambulance & Rescue)",
		zoneBn: "সারাদেশ ২৪/৭ টোল-ফ্রি",
		zoneEn: "Nationwide 24/7 Toll-Free",
		phone: "999"
	},
	{
		id: "hl-rc",
		nameBn: "বাংলাদেশ রেড ক্রিসেন্ট ব্লাড সেন্টার",
		nameEn: "Bangladesh Red Crescent Blood Center",
		zoneBn: "আওরঙ্গজেব রোড, মোহাম্মদপুর, ঢাকা",
		zoneEn: "Aurangzeb Road, Mohammadpur, Dhaka",
		phone: "+880248110188"
	},
	{
		id: "hl-quantum",
		nameBn: "কোয়ান্টাম ফাউন্ডেশন ব্লাড ল্যাব",
		nameEn: "Quantum Foundation Voluntary Blood Lab",
		zoneBn: "শান্তিনগর, ঢাকা (২৪ ঘণ্টা ল্যাব)",
		zoneEn: "Shantinagar, Dhaka (24h Lab)",
		phone: "+8801714010869"
	},
	{
		id: "hl-health",
		nameBn: "স্বাস্থ্য বাতায়ন (সরকারি মেডিকেল হেল্পলাইন)",
		nameEn: "Shasthyo Batayon (Gov Medical Helpline)",
		zoneBn: "সারাদেশ ২৪/৭",
		zoneEn: "Nationwide 24/7",
		phone: "16263"
	}
];
var FamilyVolunteerModal = ({ isOpen, onClose, lang, onOpenSOSWithGroup }) => {
	const [activeTab, setActiveTab] = (0, import_react.useState)("family");
	const [successNotice, setSuccessNotice] = (0, import_react.useState)(null);
	const [familyMembers, setFamilyMembers] = (0, import_react.useState)(() => {
		try {
			const saved = localStorage.getItem("bloodsearch_family_members");
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed)) return parsed.filter((m) => m && typeof m.id === "string" && !/^fam-[1-4]$/.test(m.id));
			}
		} catch {}
		return [];
	});
	const [isAddingFamily, setIsAddingFamily] = (0, import_react.useState)(false);
	const [newFamName, setNewFamName] = (0, import_react.useState)("");
	const [newFamRelation, setNewFamRelation] = (0, import_react.useState)("Sibling");
	const [newFamGroup, setNewFamGroup] = (0, import_react.useState)("A+");
	const [newFamPhone, setNewFamPhone] = (0, import_react.useState)("");
	if (!isOpen) return null;
	const handleAddFamilyMember = (e) => {
		e.preventDefault();
		if (!newFamName.trim()) return;
		const newMember = {
			id: `fam-${Date.now()}`,
			name: newFamName.trim(),
			relation: newFamRelation,
			bloodGroup: newFamGroup,
			phone: newFamPhone.trim() || (lang === "bn" ? "সংরক্ষিত নয়" : "Not provided"),
			emergencyContact: true
		};
		setFamilyMembers((prev) => {
			const next = [newMember, ...prev];
			try {
				localStorage.setItem("bloodsearch_family_members", JSON.stringify(next));
			} catch {}
			return next;
		});
		setIsAddingFamily(false);
		setNewFamName("");
		setNewFamPhone("");
		setSuccessNotice(lang === "bn" ? "পারিবারিক সদস্য সফলভাবে সংরক্ষিত হয়েছে।" : "Family member saved to your emergency circle.");
		setTimeout(() => setSuccessNotice(null), 2500);
	};
	const handleDeleteFamilyMember = (id) => {
		setFamilyMembers((prev) => {
			const next = prev.filter((m) => m.id !== id);
			try {
				localStorage.setItem("bloodsearch_family_members", JSON.stringify(next));
			} catch {}
			return next;
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-xl my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#0f172a] p-4 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all text-left",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-5 h-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base sm:text-lg font-bold text-slate-900 dark:text-white",
							children: lang === "bn" ? "ফ্যামিলি রক্ত সুরক্ষা ও জরুরি হটলাইন" : "Family Blood Circle & Official Hotlines"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-slate-500 dark:text-slate-400",
							children: lang === "bn" ? "নিজের পরিবারের রক্তের গ্রুপ সংরক্ষণ ও ভেরিফাইড ব্লাড সেন্টার নম্বর" : "Save your family blood groups & call verified institutional blood banks"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
					})]
				}),
				successNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: successNotice })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl my-5 text-xs font-bold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setActiveTab("family"),
						className: `py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === "family" ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							lang === "bn" ? "পারিবারিক তালিকা" : "Family Circle",
							" (",
							familyMembers.length,
							")"
						] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setActiveTab("volunteers"),
						className: `py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === "volunteers" ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartHandshake, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "অফিশিয়াল হটলাইন" : "Official Hotlines" })]
					})]
				}),
				activeTab === "family" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-bold text-slate-900 dark:text-white block",
								children: lang === "bn" ? "সংরক্ষিত পরিবারের সদস্য" : "Saved Family Members"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-slate-500 dark:text-slate-400",
								children: lang === "bn" ? "আপনার ডিভাইসে ব্যক্তিগতভাবে সংরক্ষিত থাকে" : "Stored privately on your device for instant 1-tap SOS"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setIsAddingFamily(!isAddingFamily),
								className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAddingFamily ? lang === "bn" ? "বাতিল" : "Cancel" : lang === "bn" ? "+ সদস্য যুক্ত করুন" : "+ Add Member" })]
							})]
						}),
						isAddingFamily && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleAddFamilyMember,
							className: "p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",
										children: lang === "bn" ? "সদস্যের নাম *" : "Member Name *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "familyMemberName",
										type: "text",
										placeholder: lang === "bn" ? "নাম লিখুন" : "Full name",
										value: newFamName,
										onChange: (e) => setNewFamName(e.target.value),
										className: "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white",
										required: true
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",
										children: lang === "bn" ? "সম্পর্ক" : "Relation"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										name: "familyMemberRelation",
										value: newFamRelation,
										onChange: (e) => setNewFamRelation(e.target.value),
										className: "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Father",
												children: "Father (বাবা)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Mother",
												children: "Mother (মা)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Spouse",
												children: "Spouse (স্ত্রী/স্বামী)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Child",
												children: "Child (সন্তান)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Sibling",
												children: "Sibling (ভাই/বোন)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Relative",
												children: "Other Relative"
											})
										]
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",
										children: lang === "bn" ? "ব্লাড গ্রুপ" : "Blood Group"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										name: "familyMemberBloodGroup",
										value: newFamGroup,
										onChange: (e) => setNewFamGroup(e.target.value),
										className: "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold text-rose-600",
										children: [
											"A+",
											"A-",
											"B+",
											"B-",
											"AB+",
											"AB-",
											"O+",
											"O-"
										].map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: g,
											children: g
										}, g))
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",
										children: lang === "bn" ? "মোবাইল নম্বর (ঐচ্ছিক)" : "Phone Number (Optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "familyMemberPhone",
										type: "tel",
										placeholder: "01XXXXXXXXX",
										value: newFamPhone,
										onChange: (e) => setNewFamPhone(e.target.value),
										className: "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer",
									children: lang === "bn" ? "সদস্য সংরক্ষণ করুন" : "Save Family Member"
								})
							]
						}),
						familyMembers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-7 h-7 text-slate-400 mx-auto" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-bold text-slate-800 dark:text-slate-200",
									children: lang === "bn" ? "এখনো পরিবারের কোনো সদস্য যুক্ত করা হয়নি" : "No family members added yet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-slate-500 dark:text-slate-400",
									children: lang === "bn" ? "উপরের \"+ সদস্য যুক্ত করুন\" বাটনে চাপ দিয়ে বাবা, মা বা পরিবারের সদস্যদের রক্তের গ্রুপ সংরক্ষণ করে রাখুন।" : "Tap \"+ Add Member\" above to save your family blood groups for instant emergency access."
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: familyMembers.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0",
										children: member.bloodGroup
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate",
											children: member.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate",
											children: [
												member.relation,
												" · ",
												member.phone
											]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											if (onOpenSOSWithGroup) {
												onOpenSOSWithGroup(member.bloodGroup);
												onClose();
											}
										},
										className: "px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap",
										children: "1-Tap SOS"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => handleDeleteFamilyMember(member.id),
										className: "p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer",
										title: "Remove",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-4 h-4" })
									})]
								})]
							}, member.id))
						})
					]
				}),
				activeTab === "volunteers" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-slate-900 dark:text-white block",
								children: lang === "bn" ? "ভেরিফাইড জাতীয় ব্লাড ব্যাংক ও জরুরি হটলাইন" : "Verified National Blood Bank & Emergency Hotlines"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-slate-600 dark:text-slate-400 mt-0.5",
								children: lang === "bn" ? "সরাসরি অনুমোদিত ব্লাড সেন্টার ও জাতীয় হেল্পলাইনে কল করুন।" : "Call authorized institutional blood labs and national emergency lines directly."
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2.5",
						children: OFFICIAL_BLOOD_HOTLINES.map((hl) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-bold text-xs sm:text-sm text-slate-900 dark:text-white",
								children: lang === "bn" ? hl.nameBn : hl.nameEn
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[11px] text-slate-500 dark:text-slate-400 mt-0.5",
								children: [
									lang === "bn" ? hl.zoneBn : hl.zoneEn,
									" ·",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono font-semibold text-rose-600 dark:text-rose-400",
										children: hl.phone
									})
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `tel:${hl.phone}`,
								className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "কল করুন" : "Call Now" })]
							})]
						}, hl.id))
					})]
				})
			]
		})
	});
};
export { FamilyVolunteerModal };
