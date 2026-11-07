import { n as __toESM } from "./rolldown-runtime-CO0Nlsmt.js";
import { r as require_react, t as require_jsx_runtime } from "./vendor-react-CdEWa3tD.js";
import { t as createLucideIcon } from "./createLucideIcon-DRE67aPD.js";
import { An as MapPin, Cn as Phone, Hn as Droplet, On as MessageCircle, Qn as Check, Vn as ExternalLink, Wn as Copy, cn as X, er as Building2, hn as ShieldCheck, in as DIVISIONS, yn as Search } from "./index-BZGxtQ_X.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Ambulance = createLucideIcon("ambulance", [
	["path", {
		d: "M10 10H6",
		key: "1bsnug"
	}],
	["path", {
		d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
		key: "wrbu53"
	}],
	["path", {
		d: "M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14",
		key: "lrkjwd"
	}],
	["path", {
		d: "M8 8v4",
		key: "1fwk8c"
	}],
	["path", {
		d: "M9 18h6",
		key: "x1upvd"
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
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var HeartPulse = createLucideIcon("heart-pulse", [["path", {
	d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
	key: "mvr1a0"
}], ["path", {
	d: "M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",
	key: "auskq0"
}]]);
// src/components/ecosystem/EmergencyDirectoryModal.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var EMERGENCY_ORGANIZATIONS = [
	{
		id: "org-1",
		nameBn: "বাংলাদেশ রেড ক্রিসেন্ট জাতীয় রক্ত কেন্দ্র",
		nameEn: "Bangladesh Red Crescent National Blood Center",
		divisionId: "dhaka",
		locationBn: "৭/৫ ঔরঙ্গজেব রোড, মোহাম্মদপুর, ঢাকা",
		locationEn: "7/5 Aurangzeb Road, Mohammadpur, Dhaka",
		phone: "02-9116563",
		altPhone: "+8801811458524",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা (24/7)",
		verified: true
	},
	{
		id: "org-2",
		nameBn: "কোয়ান্টাম রক্তদান ল্যাব ও ব্যাংক (শান্তিনগর)",
		nameEn: "Quantum Blood Lab & Bank (Shantinagar)",
		divisionId: "dhaka",
		locationBn: "৩১/ভি, শিল্পাচার্য জয়নুল আবেদিন সড়ক, শান্তিনগর, ঢাকা",
		locationEn: "31/V Shantinagar, Dhaka",
		phone: "01714-010869",
		altPhone: "02-9351969",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা (24/7)",
		verified: true
	},
	{
		id: "org-3",
		nameBn: "সন্ধানী (ঢাকা মেডিকেল কলেজ হাসপাতাল ইউনিট)",
		nameEn: "Sandhani (DMCH Central Unit)",
		divisionId: "dhaka",
		locationBn: "ঢাকা মেডিকেল কলেজ হাসপাতাল কম্পাউন্ড, শাহবাগ, ঢাকা",
		locationEn: "DMCH Compound, Shahbagh, Dhaka",
		phone: "02-9668690",
		altPhone: "02-55165088",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-4",
		nameBn: "বাঁধন (কেন্দ্রীয় কার্যালয়, টিএসসি)",
		nameEn: "Badhan (Central Office, DU TSC)",
		divisionId: "dhaka",
		locationBn: "টিএসসি (নিচতলা), ঢাকা বিশ্ববিদ্যালয়, ঢাকা",
		locationEn: "TSC Ground Floor, Dhaka University",
		phone: "01534-982674",
		altPhone: "02-9667788",
		type: "BLOOD_BANK",
		timing: "সকাল ৯:০০ - রাত ৯:০০",
		verified: true
	},
	{
		id: "org-5",
		nameBn: "কেন্দ্রীয় পুলিশ ব্লাড ব্যাংক (রাজারবাগ)",
		nameEn: "Central Police Blood Bank (Rajarbagh)",
		divisionId: "dhaka",
		locationBn: "কেন্দ্রীয় পুলিশ হাসপাতাল, রাজারবাগ, ঢাকা",
		locationEn: "Central Police Hospital, Rajarbagh, Dhaka",
		phone: "01713-398386",
		altPhone: "02-9362573",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা (24/7)",
		verified: true
	},
	{
		id: "org-6",
		nameBn: "বিএসএমএমইউ রক্ত সঞ্চালন বিভাগ (পিজি হাসপাতাল)",
		nameEn: "BSMMU Transfusion Medicine Department",
		divisionId: "dhaka",
		locationBn: "শাহবাগ মোড়, ঢাকা",
		locationEn: "Shahbagh, Dhaka",
		phone: "02-9661051",
		altPhone: "02-55165760",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা (24/7)",
		verified: true
	},
	{
		id: "org-7",
		nameBn: "জাতীয় হৃদরোগ ইনস্টিটিউট ব্লাড ব্যাংক (NICVD)",
		nameEn: "National Heart Institute Blood Bank (NICVD)",
		divisionId: "dhaka",
		locationBn: "শের-ই-বাংলা নগর, আগারগাঁও, ঢাকা",
		locationEn: "Sher-e-Bangla Nagar, Dhaka",
		phone: "02-9122560",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি কার্ডিয়াক রক্ত সেবা",
		verified: true
	},
	{
		id: "org-8",
		nameBn: "জাতীয় বার্ন ও প্লাস্টিক সার্জারি ইনস্টিটিউট ব্লাড ব্যাংক",
		nameEn: "National Institute of Burn & Plastic Surgery Blood Bank",
		divisionId: "dhaka",
		locationBn: "চাঁনখারপুল, ঢাকা",
		locationEn: "Chankharpul, Dhaka",
		phone: "02-47651200",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা প্লাজমা ও রক্ত সেবা",
		verified: true
	},
	{
		id: "org-9",
		nameBn: "বাংলাদেশ থ্যালাসেমিয়া ফাউন্ডেশন ব্লাড ব্যাংক",
		nameEn: "Bangladesh Thalassemia Foundation Blood Bank",
		divisionId: "dhaka",
		locationBn: "৩০ চামেলীবাগ, শান্তিনগর, ঢাকা",
		locationEn: "30 Chamelibagh, Shantinagar, Dhaka",
		phone: "02-48316116",
		altPhone: "01755-587479",
		type: "BLOOD_BANK",
		timing: "সকাল ৮:০০ - রাত ১০:০০",
		verified: true
	},
	{
		id: "org-10",
		nameBn: "শহীদ তাজউদ্দীন আহমদ মেডিকেল ব্লাড ব্যাংক, গাজীপুর",
		nameEn: "Shaheed Tajuddin Ahmad Medical Blood Bank, Gazipur",
		divisionId: "dhaka",
		locationBn: "জয়দেবপুর হাসপাতাল রোড, গাজীপুর",
		locationEn: "Joydebpur, Gazipur",
		phone: "02-9263532",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা",
		verified: true
	},
	{
		id: "org-11",
		nameBn: "রেড ক্রিসেন্ট ফাতেমা বেগম ব্লাড সেন্টার, চট্টগ্রাম",
		nameEn: "Red Crescent Blood Center, Chittagong",
		divisionId: "chittagong",
		locationBn: "৩৯৫ আন্দরকিল্লা, চট্টগ্রাম",
		locationEn: "395 Anderkilla, Chittagong",
		phone: "031-616335",
		altPhone: "+8801819385623",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা (24/7)",
		verified: true
	},
	{
		id: "org-12",
		nameBn: "সন্ধানী (চট্টগ্রাম মেডিকেল কলেজ ইউনিট)",
		nameEn: "Sandhani (CMCH Unit, Chittagong)",
		divisionId: "chittagong",
		locationBn: "কে বি ফজলুল কাদের রোড, পাঁচলাইশ, চট্টগ্রাম",
		locationEn: "KB Fazlul Kader Road, Chittagong",
		phone: "031-616891",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-13",
		nameBn: "কুমিল্লা মেডিকেল কলেজ রক্ত সঞ্চালন কেন্দ্র (সন্ধানী)",
		nameEn: "Cumilla Medical College Transfusion Unit",
		divisionId: "chittagong",
		locationBn: "কুচাইতলী, কুমিল্লা সদর, কুমিল্লা",
		locationEn: "Kuchaitoli, Cumilla",
		phone: "081-76402",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-14",
		nameBn: "কক্সবাজার সদর হাসপাতাল ব্লাড ব্যাংক",
		nameEn: "Coxs Bazar District Sadar Hospital Blood Bank",
		divisionId: "chittagong",
		locationBn: "হাসপাতাল সড়ক, কক্সবাজার সদর",
		locationEn: "Hospital Road, Coxs Bazar",
		phone: "0341-64066",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা",
		verified: true
	},
	{
		id: "org-15",
		nameBn: "রেড ক্রিসেন্ট ব্লাড সেন্টার, রাজশাহী",
		nameEn: "Red Crescent Blood Center, Rajshahi",
		divisionId: "rajshahi",
		locationBn: "লক্ষ্মীপুর মোড়, রাজশাহী সদর",
		locationEn: "Laxmipur Mor, Rajshahi",
		phone: "0721-772186",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা",
		verified: true
	},
	{
		id: "org-16",
		nameBn: "সন্ধানী (রাজশাহী মেডিকেল কলেজ হাসপাতাল ইউনিট)",
		nameEn: "Sandhani (RMCH Unit, Rajshahi)",
		divisionId: "rajshahi",
		locationBn: "লক্ষ্মীপুর, রাজশাহী মেডিকেল কলেজ হাসপাতাল",
		locationEn: "RMCH Campus, Rajshahi",
		phone: "0721-772150",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-17",
		nameBn: "শহীদ জিয়াউর রহমান মেডিকেল কলেজ ব্লাড ব্যাংক, বগুড়া",
		nameEn: "SZMC Hospital Transfusion Unit, Bogura",
		divisionId: "rajshahi",
		locationBn: "ছিলিমপুর, বগুড়া সদর, বগুড়া",
		locationEn: "Silimpur, Bogura",
		phone: "051-69965",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা",
		verified: true
	},
	{
		id: "org-18",
		nameBn: "সন্ধানী (খুলনা মেডিকেল কলেজ হাসপাতাল ইউনিট)",
		nameEn: "Sandhani (KMC Unit, Khulna)",
		divisionId: "khulna",
		locationBn: "বয়রা, খুলনা সদর, খুলনা",
		locationEn: "Boyra, Khulna",
		phone: "041-760350",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-19",
		nameBn: "রেড ক্রিসেন্ট ব্লাড ব্যাংক, যশোর",
		nameEn: "Red Crescent Blood Center, Jashore",
		divisionId: "khulna",
		locationBn: "মুন্সী মেহেরুল্লাহ রোড, যশোর সদর",
		locationEn: "Munshi Meherullah Road, Jashore",
		phone: "0421-68755",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা",
		verified: true
	},
	{
		id: "org-20",
		nameBn: "মুজিব-জাহান রেড ক্রিসেন্ট ব্লাড ব্যাংক, সিলেট",
		nameEn: "Mujib-Jahan Red Crescent Blood Center, Sylhet",
		divisionId: "sylhet",
		locationBn: "চৌহাট্টা, সিলেট সদর, সিলেট",
		locationEn: "Chouhatta, Sylhet",
		phone: "0821-714989",
		altPhone: "01711-947933",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা",
		verified: true
	},
	{
		id: "org-21",
		nameBn: "সন্ধানী (সিলেট এমএজি ওসমানী মেডিকেল কলেজ ইউনিট)",
		nameEn: "Sandhani (SOMCH Unit, Sylhet)",
		divisionId: "sylhet",
		locationBn: "মেডিকেল রোড, কাজলশাহ, সিলেট",
		locationEn: "Kajolshah, Sylhet",
		phone: "0821-713487",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-22",
		nameBn: "শের-ই-বাংলা মেডিকেল কলেজ রক্ত সঞ্চালন ও সন্ধানী, বরিশাল",
		nameEn: "Sher-e-Bangla Medical College (SBMCH) Blood Bank, Barisal",
		divisionId: "barisal",
		locationBn: "বান্দ রোড, বরিশাল সদর, বরিশাল",
		locationEn: "Band Road, Barisal",
		phone: "0431-2173547",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-23",
		nameBn: "রেড ক্রিসেন্ট ব্লাড সেন্টার, বরিশাল",
		nameEn: "Red Crescent Blood Center, Barisal",
		divisionId: "barisal",
		locationBn: "আলেকান্দা হাসপাতাল রোড, বরিশাল",
		locationEn: "Alekanda, Barisal",
		phone: "0431-64399",
		type: "BLOOD_BANK",
		timing: "সকাল ৯:০০ - রাত ৯:০০",
		verified: true
	},
	{
		id: "org-24",
		nameBn: "রংপুর মেডিকেল কলেজ হাসপাতাল ব্লাড ব্যাংক ও সন্ধানী",
		nameEn: "Rangpur Medical College Hospital Blood Bank & Sandhani",
		divisionId: "rangpur",
		locationBn: "ধাপ, জেল রোড, রংপুর সদর",
		locationEn: "Dhap, Jail Road, Rangpur",
		phone: "0521-62160",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা (24/7)",
		verified: true
	},
	{
		id: "org-25",
		nameBn: "এম আব্দুর রহিম মেডিকেল কলেজ ব্লাড ব্যাংক, দিনাজপুর",
		nameEn: "Dinajpur Medical College Transfusion Center",
		divisionId: "rangpur",
		locationBn: "উপশহর, দিনাজপুর সদর, দিনাজপুর",
		locationEn: "Upashahar, Dinajpur",
		phone: "0531-64787",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা জরুরি সেবা",
		verified: true
	},
	{
		id: "org-26",
		nameBn: "ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল ব্লাড ব্যাংক ও সন্ধানী",
		nameEn: "Mymensingh Medical College Hospital (MMCH) Blood Bank",
		divisionId: "mymensingh",
		locationBn: "চরপাড়া মোড়, ময়মনসিংহ সদর",
		locationEn: "Charpara, Mymensingh",
		phone: "091-66063",
		type: "BLOOD_BANK",
		timing: "২৪ ঘণ্টা খোলা (24/7)",
		verified: true
	},
	{
		id: "amb-1",
		nameBn: "জাতীয় জরুরি সেবা (৯৯৯ অ্যাম্বুলেন্স ডিসপ্যাচ)",
		nameEn: "National Emergency 999 Ambulance Service",
		divisionId: "dhaka",
		locationBn: "সারাদেশে ৬৪ জেলায় জরুরি অ্যাম্বুলেন্স ও পুলিশ সহায়তা",
		locationEn: "Nationwide 64 Districts (Toll-Free)",
		phone: "999",
		type: "AMBULANCE",
		timing: "টোল ফ্রি · ২৪ ঘণ্টা চালু",
		verified: true
	},
	{
		id: "amb-2",
		nameBn: "ফায়ার সার্ভিস ও সিভিল ডিফেন্স রেসকিউ অ্যাম্বুলেন্স",
		nameEn: "Fire Service & Civil Defence Emergency Ambulance",
		divisionId: "dhaka",
		locationBn: "সারাদেশে দুর্ঘটনা ও জরুরি রোগী পরিবহন হটলাইন",
		locationEn: "Nationwide Emergency Rescue Ambulance",
		phone: "16163",
		altPhone: "02-223355555",
		type: "AMBULANCE",
		timing: "২৪ ঘণ্টা জরুরি রেসকিউ",
		verified: true
	},
	{
		id: "amb-3",
		nameBn: "স্বাস্থ্য বাতায়ন সরকারি টেলিমেডিসিন ও অ্যাম্বুলেন্স",
		nameEn: "Shastho Batayon Telemedicine & Ambulance",
		divisionId: "dhaka",
		locationBn: "স্বাস্থ্য ও পরিবার কল্যাণ মন্ত্রণালয় (সকল জেলা)",
		locationEn: "Ministry of Health and Family Welfare",
		phone: "16263",
		type: "AMBULANCE",
		timing: "২৪ ঘণ্টা ডাক্তার পরামর্শ ও অ্যাম্বুলেন্স",
		verified: true
	},
	{
		id: "amb-4",
		nameBn: "আঞ্জুমান মুফিদুল ইসলাম ফ্রি অ্যাম্বুলেন্স সার্ভিস",
		nameEn: "Anjuman Mufidul Islam Free Ambulance Service",
		divisionId: "dhaka",
		locationBn: "কাকরাইল ও গেন্ডারিয়া, ঢাকা (বিনামূল্যে মানবিক সেবা)",
		locationEn: "Kakrail, Dhaka",
		phone: "02-9336611",
		altPhone: "01711-854672",
		type: "AMBULANCE",
		timing: "২৪ ঘণ্টা ফ্রি অ্যাম্বুলেন্স সেবা",
		verified: true
	},
	{
		id: "amb-5",
		nameBn: "রেড ক্রিসেন্ট জাতীয় আইসিইউ ও অক্সিজেন অ্যাম্বুলেন্স",
		nameEn: "Red Crescent National ICU & Oxygen Ambulance",
		divisionId: "dhaka",
		locationBn: "মগবাজার ও মোহাম্মদপুর, ঢাকা (সারাদেশে পরিবহন)",
		locationEn: "Moghbazar, Dhaka & Nationwide",
		phone: "02-9330188",
		altPhone: "01811-458542",
		type: "AMBULANCE",
		timing: "২৪ ঘণ্টা অক্সিজেন ও আইসিইউ সাপোর্ট",
		verified: true
	},
	{
		id: "amb-6",
		nameBn: "আল-মারকাজুল ইসলামী অ্যাম্বুলেন্স ও ফ্রিজিং ভ্যান",
		nameEn: "Al-Markazul Islami Ambulance & Freezing Service",
		divisionId: "dhaka",
		locationBn: "শ্যামলী ও মোহাম্মদপুর, ঢাকা",
		locationEn: "Shyamoli, Dhaka",
		phone: "02-9127867",
		altPhone: "01711-828555",
		type: "AMBULANCE",
		timing: "২৪ ঘণ্টা রোগী ও ফ্রিজিং ভ্যান",
		verified: true
	},
	{
		id: "amb-7",
		nameBn: "চট্টগ্রাম মেডিকেল জরুরি অ্যাম্বুলেন্স কন্ট্রোল",
		nameEn: "Chittagong Emergency Ambulance Control",
		divisionId: "chittagong",
		locationBn: "পাঁচলাইশ ও আন্দরকিল্লা, চট্টগ্রাম",
		locationEn: "Panchlaish, Chittagong",
		phone: "031-619599",
		type: "AMBULANCE",
		timing: "২৪ ঘণ্টা চালু",
		verified: true
	},
	{
		id: "amb-8",
		nameBn: "সিলেট ওসমানী জরুরি অ্যাম্বুলেন্স সার্ভিস",
		nameEn: "Sylhet Emergency Ambulance Dispatch",
		divisionId: "sylhet",
		locationBn: "কাজলশাহ ও চৌহাট্টা, সিলেট",
		locationEn: "Kajolshah, Sylhet",
		phone: "0821-713667",
		type: "AMBULANCE",
		timing: "২৪ ঘণ্টা চালু",
		verified: true
	}
];
var EmergencyDirectoryModal = ({ isOpen, onClose, lang }) => {
	const [selectedDivision, setSelectedDivision] = (0, import_react.useState)("ALL");
	const [selectedType, setSelectedType] = (0, import_react.useState)("ALL");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [copiedId, setCopiedId] = (0, import_react.useState)(null);
	if (!isOpen) return null;
	const filteredOrgs = EMERGENCY_ORGANIZATIONS.filter((org) => {
		if (selectedDivision !== "ALL" && org.divisionId !== selectedDivision) return false;
		if (selectedType !== "ALL" && org.type !== selectedType) return false;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			const matchName = org.nameBn.toLowerCase().includes(q) || org.nameEn.toLowerCase().includes(q);
			const matchLoc = org.locationBn.toLowerCase().includes(q) || org.locationEn.toLowerCase().includes(q);
			const matchPhone = org.phone.includes(q) || org.altPhone && org.altPhone.includes(q);
			if (!matchName && !matchLoc && !matchPhone) return false;
		}
		return true;
	});
	const handleCopyNumber = (id, phone) => {
		navigator.clipboard.writeText(phone).catch(() => {});
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2e3);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-2xl my-2 sm:my-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-left space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center shadow-md shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "w-5 h-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug",
								children: lang === "bn" ? "৮ বিভাগীয় ব্লাড ব্যাংক, মেডিকেল ও ২৪/৭ অ্যাম্বুলেন্স হাব" : "8-Division Blood Banks, Medical Colleges & 24/7 Ambulance Hub"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-500 dark:text-slate-400",
								children: lang === "bn" ? `${EMERGENCY_ORGANIZATIONS.length}টি ভেরিফাইড সরকারি মেডিকেল, রেড ক্রিসেন্ট, সন্ধানী ও অ্যাম্বুলেন্স হটলাইন` : `${EMERGENCY_ORGANIZATIONS.length} verified blood banks, medical transfusion units & dispatch lines`
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "tel:999",
							className: "p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between gap-1.5 text-red-700 dark:text-red-300 font-bold text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🚨 জরুরি ৯৯৯" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5 shrink-0" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "tel:16163",
							className: "p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🚑 ফায়ার ১৬১৬৩" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5 shrink-0" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "tel:16263",
							className: "p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🩺 স্বাস্থ্য ১৬২৬৩" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5 shrink-0" })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4 absolute left-3 top-3 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "directorySearch",
							type: "text",
							value: searchQuery,
							onChange: (e) => setSearchQuery(e.target.value),
							placeholder: lang === "bn" ? "ব্লাড ব্যাংক, মেডিকেল কলেজ, জেলা বা নম্বর দিয়ে খুঁজুন..." : "Search blood bank, medical college, city, or phone...",
							className: "w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 flex-wrap text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 bg-slate-100 dark:bg-[#0f172a] p-1 rounded-xl border border-slate-200 dark:border-slate-800",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setSelectedType("ALL"),
									className: `px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${selectedType === "ALL" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"}`,
									children: lang === "bn" ? `সব (${filteredOrgs.length})` : `All (${filteredOrgs.length})`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setSelectedType("BLOOD_BANK"),
									className: `px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${selectedType === "BLOOD_BANK" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Droplet, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "ব্লাড ব্যাংক" : "Blood Bank" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setSelectedType("AMBULANCE"),
									className: `px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${selectedType === "AMBULANCE" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ambulance, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "অ্যাম্বুলেন্স" : "Ambulance" })]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							name: "directoryDivision",
							value: selectedDivision,
							onChange: (e) => setSelectedDivision(e.target.value),
							className: "h-9 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "ALL",
								children: lang === "bn" ? "সকল ৮ বিভাগ" : "All 8 Divisions"
							}), DIVISIONS.map((div) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: div.id,
								children: lang === "bn" ? div.nameBn : div.nameEn
							}, div.id))]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3 max-h-[54vh] overflow-y-auto modal-scroll-contain pr-1",
					children: filteredOrgs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-8 text-center text-slate-400 text-xs",
						children: lang === "bn" ? "কোনো ব্লাড ব্যাংক বা হটলাইন পাওয়া যায়নি" : "No emergency centers found matching your search."
					}) : filteredOrgs.map((org) => {
						const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${org.nameEn} ${org.locationEn}`)}`;
						const waShareHref = `https://wa.me/?text=${encodeURIComponent(`${org.nameBn}\nঠিকানা: ${org.locationBn}\nজরুরি ফোন: ${org.phone}${org.altPhone ? `, ${org.altPhone}` : ""}\nসময়: ${org.timing}`)}`;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3.5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-rose-400 transition-all space-y-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-start justify-between gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-2.5 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold ${org.type === "AMBULANCE" ? "bg-amber-500" : "bg-rose-600"}`,
										children: org.type === "AMBULANCE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ambulance, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartPulse, { className: "w-4 h-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 flex-wrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight",
												children: lang === "bn" ? org.nameBn : org.nameEn
											}), org.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-blue-500 shrink-0",
												title: "অফিসিয়াল কেন্দ্র",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-3.5 h-3.5 fill-blue-500 text-white" })
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "w-3 h-3 text-rose-500 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? org.locationBn : org.locationEn })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													"aria-hidden": "true",
													children: "·"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-emerald-700 dark:text-emerald-400 font-semibold",
													children: org.timing
												})
											]
										})]
									})]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-mono text-xs font-bold text-slate-700 dark:text-slate-200",
									children: [org.phone, org.altPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-slate-400 font-normal ml-1",
										children: ["/ ", org.altPhone]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 shrink-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => handleCopyNumber(org.id, org.phone),
											className: "min-h-[34px] px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer",
											title: "নম্বর কপি করুন",
											children: [copiedId === org.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3.5 h-3.5 text-emerald-600" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copiedId === org.id ? "কপি!" : lang === "bn" ? "কপি" : "Copy" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: mapsHref,
											target: "_blank",
											rel: "noopener noreferrer",
											className: "min-h-[34px] px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1",
											title: "Google Maps-এ লোকেশন দেখুন",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Map" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: waShareHref,
											target: "_blank",
											rel: "noopener noreferrer",
											className: "min-h-[34px] px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 text-[11px] font-black flex items-center gap-1",
											title: "রোগীর স্বজনকে WhatsApp-এ পাঠান",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WA" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: `tel:${org.phone.replace(/[^0-9+]/g, "")}`,
											className: "min-h-[34px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "কল" : "Call" })]
										})
									]
								})]
							})]
						}, org.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lang === "bn" ? "জাতীয় জরুরি প্রয়োজনে ৯৯৯, ১৬১৬৩ (ফায়ার সার্ভিস) বা ১৬২৬৩ ডায়াল করুন" : "Dial 999, 16163 (Fire Rescue) or 16263 for national emergency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer",
						children: lang === "bn" ? "বন্ধ করুন" : "Close"
					})]
				})
			]
		})
	});
};
export { EmergencyDirectoryModal };
