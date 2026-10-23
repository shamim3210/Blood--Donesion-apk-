export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'STANDARD';

export type RequestStatus = 'PENDING' | 'ACTIVE' | 'ACCEPTED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

export type PortalMode = 'showcase' | 'donor_app' | 'command_center' | 'blood_bank' | 'admin' | 'architecture';

export interface Responder {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  timestamp: string;
  notes?: string;
  avatar?: string;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  patientAge: number;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  unitsCollected: number;
  hospitalName: string;
  division: string;
  district: string;
  upazila: string;
  urgency: UrgencyLevel;
  contactName: string;
  contactPhone: string;
  requiredDate: string;
  reason: string;
  responders: Responder[];
  createdAt: string;
  status: RequestStatus;
  prescriptionImage?: string;
  distanceKm?: number;
}

export interface HealthConditions {
  nonAlcoholic: boolean;
  hivNegative: boolean;
  rheumaticFeverNegative: boolean;
  covidNegative: boolean;
  thalassemiaNegative: boolean;
  hepatitisNegative: boolean;
  normalBloodPressure: boolean;
}

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  phone: string;
  available: boolean;
  lastDonatedDate: string; // YYYY-MM-DD
  totalDonations: number;
  verifiedBadge: boolean;
  rating: number;
  reviewsCount: number;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  weightKg: number;
  hospitalAffiliation?: string;
  bio?: string;
  avatar?: string;
  healthConditions?: HealthConditions;
  reliabilityScore?: number; // 0 - 100%
  facebookUrl?: string;
  whatsappPhone?: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'UNMASK_PHONE' | 'CREATE_SOS' | 'RESPOND_SOS' | 'STATUS_CHANGE' | 'DONOR_REGISTERED' | 'DISPATCH_INCIDENT' | 'STOCK_UPDATE';
  actorName: string;
  targetDetails: string;
  timestamp: string;
  securityHash: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isVoice?: boolean;
  voiceDuration?: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  participantAvatar: string;
  bloodGroup: BloodGroup;
  hospital: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  messages: ChatMessage[];
  facebookUrl?: string;
  whatsappPhone?: string;
  participantPhone?: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  category: 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  level: 1 | 2 | 3;
  iconColor: string;
  unlocked: boolean;
  unlockedDate?: string;
  requirements: string[];
}

export interface BloodStockItem {
  bloodGroup: BloodGroup;
  unitsInStock: number;
  requiredUnits: number;
  expiryUnder15Days: number;
  expiry15To30Days: number;
  expiry30To45Days: number;
  status: 'HIGH' | 'SUFFICIENT' | 'CRITICAL';
}

export interface IncidentItem {
  id: string;
  title: string;
  type: string;
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  location: string;
  district: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'Active Incident' | 'In Progress' | 'Assigned' | 'Resolved';
  timeAgo: string;
  assignee?: string;
  lat: number;
  lng: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  photoUrl?: string;
  role: 'USER' | 'ADMIN';
  verifiedStatus: boolean;
  idCardNumber: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  weightKg: number;
  availableToDonate: boolean;
  lastDonationDate?: string;
  totalDonations: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  facebookUrl?: string;
  whatsappPhone?: string;
  createdAt: string;
}

export type ActiveTab = 
  | 'home' 
  | 'onboarding' 
  | 'search' 
  | 'sos' 
  | 'requests' 
  | 'compatibility' 
  | 'eligibility' 
  | 'security' 
  | 'chat' 
  | 'badges' 
  | 'profile' 
  | 'map' 
  | 'admin';

export type Language = 'bn' | 'en';
