import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SadadLogo } from './components/SadadLogo';
import { InteractiveCursorLighting } from './components/InteractiveCursorLighting';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';

declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

interface MessageItem {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  subject?: string;
  message?: string;
  timestamp?: number;
  isRead?: boolean;
  reply?: string;
  repliedAt?: number | null;
  userAgent?: string;
}

interface SocialLinks {
  instagram: string;
  youtube: string;
  googleChat: string;
  telegram: string;
  whatsapp: string;
  [key: string]: string;
}

interface NoticeBannerData {
  enabled: boolean;
  text: string;
  type: string;
  buttonText: string;
  link: string;
}

interface ExecutiveMember {
  id?: string;
  name: string;
  role: string;
  badge: string;
  avatar: string;
  quote: string;
  email: string;
  phone: string;
}

interface InitiativeItem {
  id: string;
  category: 'academic' | 'cultural' | 'welfare' | 'tech';
  title: string;
  status: string;
  progress: number;
  budget: string;
  lead: string;
  desc: string;
}

interface AppGalleryItem {
  id: string;
  title: string;
  category: 'academic' | 'utility' | 'community' | 'media';
  status: string;
  version: string;
  icon: string;
  tag: string;
  badgeColor: string;
  gradient: string;
  description: string;
  features: string[];
  link: string;
  isExternal: boolean;
}

interface FaqItem {
  id?: string;
  q: string;
  a: string;
}

// ==========================================
// FIREBASE SETUP WITH ENVIRONMENT INJECTION
// ==========================================
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let appId = 'sadad-class-union';

const defaultFirebaseConfig = {
  apiKey: "",
  authDomain: "sadad-class-union.firebaseapp.com",
  projectId: "sadad-class-union",
  storageBucket: "sadad-class-union.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

try {
  const configRaw = typeof __firebase_config !== 'undefined' ? __firebase_config : (typeof window !== 'undefined' ? window.__firebase_config : undefined);
  const firebaseConfig = configRaw ? JSON.parse(configRaw) : null;
  
  if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '') {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.info("Firebase API key not configured. Running in local state mode.");
  }
  
  const envAppId = typeof __app_id !== 'undefined' ? __app_id : (typeof window !== 'undefined' ? window.__app_id : undefined);
  appId = envAppId || 'sadad-class-union';
} catch (e) {
  console.info("Firebase setup deferred, local fallback active.");
}

// ==========================================
// AI COLOR THEMES & ACCENT CONFIGURATIONS
// ==========================================
interface AIColorTheme {
  id: string;
  name: string;
  colorDot: string;
  gradientBrand: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  textAccent: string;
  bgGlowTop: string;
  bgGlowBottom: string;
  headingGradient: string;
  btnGradient: string;
  hoverBorder: string;
  ringFocus: string;
  iconBg: string;
  iconText: string;
  cardGlow: string;
}

const AI_COLOR_THEMES: Record<string, AIColorTheme> = {
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    colorDot: '#06b6d4',
    gradientBrand: 'from-cyan-500 via-teal-500 to-blue-600',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-400/30',
    textAccent: 'text-cyan-400',
    bgGlowTop: 'bg-cyan-950/80',
    bgGlowBottom: 'bg-teal-950/80',
    headingGradient: 'from-white via-cyan-100 to-teal-300',
    btnGradient: 'from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
    hoverBorder: 'hover:border-cyan-400/50',
    ringFocus: 'focus:ring-cyan-400',
    iconBg: 'bg-cyan-500/15',
    iconText: 'text-cyan-300',
    cardGlow: 'shadow-glow-cyan',
  },
  violet: {
    id: 'violet',
    name: 'Electric Violet',
    colorDot: '#8b5cf6',
    gradientBrand: 'from-indigo-600 via-purple-600 to-pink-500',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-400/30',
    textAccent: 'text-purple-400',
    bgGlowTop: 'bg-indigo-950/80',
    bgGlowBottom: 'bg-purple-950/80',
    headingGradient: 'from-white via-purple-100 to-pink-300',
    btnGradient: 'from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
    hoverBorder: 'hover:border-purple-400/50',
    ringFocus: 'focus:ring-purple-400',
    iconBg: 'bg-purple-500/15',
    iconText: 'text-purple-300',
    cardGlow: 'shadow-glow-purple',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    colorDot: '#10b981',
    gradientBrand: 'from-emerald-500 via-teal-500 to-cyan-600',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-400/30',
    textAccent: 'text-emerald-400',
    bgGlowTop: 'bg-emerald-950/80',
    bgGlowBottom: 'bg-teal-950/80',
    headingGradient: 'from-white via-emerald-100 to-teal-300',
    btnGradient: 'from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-400',
    hoverBorder: 'hover:border-emerald-400/50',
    ringFocus: 'focus:ring-emerald-400',
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-300',
    cardGlow: 'shadow-glow-emerald',
  },
  rose: {
    id: 'rose',
    name: 'Solar Rose',
    colorDot: '#f43f5e',
    gradientBrand: 'from-rose-500 via-pink-600 to-amber-500',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-400/30',
    textAccent: 'text-rose-400',
    bgGlowTop: 'bg-rose-950/80',
    bgGlowBottom: 'bg-pink-950/80',
    headingGradient: 'from-white via-rose-100 to-amber-300',
    btnGradient: 'from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-pink-500',
    hoverBorder: 'hover:border-rose-400/50',
    ringFocus: 'focus:ring-rose-400',
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-300',
    cardGlow: 'shadow-glow-pink',
  },
  amber: {
    id: 'amber',
    name: 'Neon Amber',
    colorDot: '#f59e0b',
    gradientBrand: 'from-amber-500 via-orange-500 to-yellow-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/30',
    textAccent: 'text-amber-400',
    bgGlowTop: 'bg-amber-950/80',
    bgGlowBottom: 'bg-orange-950/80',
    headingGradient: 'from-white via-amber-100 to-yellow-300',
    btnGradient: 'from-amber-600 via-orange-600 to-yellow-500 hover:from-amber-500 hover:to-orange-400',
    hoverBorder: 'hover:border-amber-400/50',
    ringFocus: 'focus:ring-amber-400',
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-300',
    cardGlow: 'shadow-glow-amber',
  }
};

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(true);
  const [aiColorKey, setAiColorKey] = useState<string>('cyan');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const activeTheme = AI_COLOR_THEMES[aiColorKey] || AI_COLOR_THEMES.cyan;

  // Interactive Cursor & Spotlight State
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  // Auth User
  const [user, setUser] = useState<User | null>(null);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState('');

  // Real-time Messages & Settings
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: 'https://www.instagram.com/_sadad_official_/',
    facebook: 'https://www.facebook.com/sadadstudentunion',
    youtube: 'https://www.youtube.com/@sadad.studentsunion',
    googleChat: 'https://lovable.dev/preview/org9Avkzh8tmWwVhYzcVhCmD4tUepLnk',
    telegram: 'https://t.me/sadad_class_union',
    whatsapp: 'https://wa.me/917025150544',
    linkedin: 'https://www.linkedin.com/company/sadad-class-union',
    github: 'https://github.com/sadad-class-union',
    liveChat: 'https://lovable.dev/preview/pGcJXaoufhhXlHLvmD7Br8mOszlzoQqQ',
    gallery: 'https://photos.app.goo.gl/kF1XeerBu2vA5Hje6'
  });

  const [contactInfo, setContactInfo] = useState({
    phone: '+91 70251 50544',
    email: 'sadadclassunion@gmail.com',
    address: 'Akode Islamic Centre, Kerala, India',
    officeHoursWeekdays: '9:00 AM – 5:00 PM',
    officeHoursSaturday: '9:00 AM – 1:00 PM',
    officeHoursSunday: 'Holiday (Closed)',
    liveChatEnabled: true
  });

  const [copyToast, setCopyToast] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopyToast(`${label} copied to clipboard!`);
      setTimeout(() => setCopyToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Notice Banner & Site Control State
  const [noticeBanner, setNoticeBanner] = useState<NoticeBannerData>({
    enabled: true,
    text: '📢 Admissions open for SADAD Academic Peer Mentorship & Digital Skills Program 2026 at Akode.',
    type: 'ANNOUNCEMENT',
    buttonText: 'Join Program',
    link: '#contact'
  });

  // Dynamic Content Data States (Controlled via Admin Panel)
  const [executives, setExecutives] = useState<ExecutiveMember[]>([
    {
      name: 'Sinan K.A.',
      role: 'Union Coordinator & Tech Lead',
      badge: 'President / Lead Coordinator',
      avatar: '👨‍💼',
      quote: 'Building a connected, empowered student union through tech and integrity.',
      email: 'sadadclassunion@gmail.com',
      phone: '+91 70251 50544'
    },
    {
      name: 'Muhammed Rashid',
      role: 'General Secretary',
      badge: 'Administration & Operations',
      avatar: '📜',
      quote: 'Ensuring efficient execution of every union event and academic program.',
      email: 'rashid.sadad@gmail.com',
      phone: '+91 70251 50544'
    },
    {
      name: 'Faris Ahmed',
      role: 'Treasurer & Welfare Officer',
      badge: 'Finance & Student Relief',
      avatar: '⚖️',
      quote: 'Accountability and transparent allocation of union welfare resources.',
      email: 'welfare.sadad@gmail.com',
      phone: '+91 70251 50544'
    },
    {
      name: 'Bilal Hassan',
      role: 'Cultural & Academic Secretary',
      badge: 'Events & Education',
      avatar: '🎓',
      quote: 'Cultivating moral excellence and vibrant student talent.',
      email: 'academic.sadad@gmail.com',
      phone: '+91 70251 50544'
    }
  ]);

  const [initiatives, setInitiatives] = useState<InitiativeItem[]>([
    {
      id: 'init-1',
      category: 'academic',
      title: 'SADAD Knowledge Portal & Exam Notes Drive',
      status: 'Active',
      progress: 92,
      budget: 'Academic Fund',
      lead: 'Academic Committee',
      desc: 'Comprehensive repository of digitized lecture notes, question banks, and video explanations for upcoming examinations.'
    },
    {
      id: 'init-2',
      category: 'cultural',
      title: 'Grand Annual SADAD Fest & Literary Expo',
      status: 'Upcoming',
      progress: 75,
      budget: 'Union Fest Grant',
      lead: 'Cultural Board',
      desc: 'A 3-day flagship festival featuring debates, Islamic calligraphy exhibitions, quiz competitions, and cultural performances.'
    },
    {
      id: 'init-3',
      category: 'welfare',
      title: 'Student Emergency Welfare & Textbook Assistance',
      status: 'Ongoing',
      progress: 88,
      budget: 'Welfare Direct',
      lead: 'Welfare Cell',
      desc: 'Direct distribution of textbooks, stationery, and financial assistance to students requiring temporary relief.'
    },
    {
      id: 'init-4',
      category: 'tech',
      title: 'SADAD Real-time Union Portal & Chat System',
      status: 'Live',
      progress: 100,
      budget: 'Tech Guild',
      lead: 'Digital Team',
      desc: 'Custom web portal with real-time feedback forms, Firestore data persistence, Google Chat integrations, and admin panel.'
    },
    {
      id: 'init-5',
      category: 'cultural',
      title: 'Community Iftar & Ethical Leadership Meet',
      status: 'Scheduled',
      progress: 60,
      budget: 'Community Fund',
      lead: 'Executive Board',
      desc: 'Gathering for students, faculty, and alumni to discuss leadership ethics and strengthen brotherhood at Akode.'
    }
  ]);

  const [appsGallery, setAppsGallery] = useState<AppGalleryItem[]>([
    {
      id: 'app-portal',
      title: 'SADAD Digital Union Portal',
      category: 'utility',
      status: 'Live Platform',
      version: 'v2.4.0',
      icon: '🌐',
      tag: 'Core System',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      gradient: 'from-cyan-600 via-teal-600 to-blue-600',
      description: 'The primary digital hub featuring real-time student communications, Firestore persistent feedback, and an administrative control console.',
      features: ['Firestore Realtime Sync', 'Admin Feedback Console', 'Aura Theme Engine', 'Direct Union Chat Integration'],
      link: '#home',
      isExternal: false
    },
    {
      id: 'app-notes',
      title: 'SADAD Exam & Notes Vault',
      category: 'academic',
      status: 'Active App',
      version: 'v1.8.2',
      icon: '📚',
      tag: 'Academic Drive',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      description: 'A centralized digital library providing digitized class notes, exam model papers, audio study guides, and subject syllabi.',
      features: ['Categorized Subject Folders', 'Searchable Question Bank', 'Downloadable PDF Notes', 'Peer Contributor Ratings'],
      link: 'https://lovable.dev/preview/org9Avkzh8tmWwVhYzcVhCmD4tUepLnk',
      isExternal: true
    },
    {
      id: 'app-welfare',
      title: 'Union Welfare & Relief Tool',
      category: 'utility',
      status: 'Active Tool',
      version: 'v1.2.0',
      icon: '🤝',
      tag: 'Student Relief',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      gradient: 'from-purple-600 via-indigo-600 to-pink-600',
      description: 'Discreet digital application tool for book grants, exam fee relief, emergency medical assistance, and textbook distribution.',
      features: ['Encrypted Application Form', 'Instant Status Tracking', 'Transparent Fund Analytics', 'Confidential Board Review'],
      link: '#contact',
      isExternal: false
    },
    {
      id: 'app-chat',
      title: 'Google Chat Student Hub',
      category: 'community',
      status: 'Live Group',
      version: 'v3.0.1',
      icon: '💬',
      tag: 'Discussion',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
      description: 'Real-time student discussion room for class discussions, project collaborations, announcements, and peer Q&A.',
      features: ['Instant Class Chat', 'Topic Channels', 'File Sharing Support', 'Mobile & Desktop App Sync'],
      link: 'https://lovable.dev/preview/org9Avkzh8tmWwVhYzcVhCmD4tUepLnk',
      isExternal: true
    },
    {
      id: 'app-calendar',
      title: 'Islamic Academic Calendar Sync',
      category: 'utility',
      status: 'Active Portal',
      version: 'v2.1.0',
      icon: '🕌',
      tag: 'Schedule',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      gradient: 'from-amber-600 via-orange-600 to-yellow-500',
      description: 'Integrated calendar providing prayer time reminders, Islamic fest dates, exam schedules, and union event agendas.',
      features: ['Hijri & Gregorian Sync', 'Akode Prayer Schedules', 'Exam Countdown Timers', 'Event Reminder Alerts'],
      link: '#pillars',
      isExternal: false
    },
    {
      id: 'app-media',
      title: 'SADAD Cultural & Media Archive',
      category: 'media',
      status: 'Showcase',
      version: 'v1.5.0',
      icon: '📸',
      tag: 'Media Vault',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      gradient: 'from-rose-600 via-pink-600 to-amber-600',
      description: 'High-definition digital gallery documenting SADAD annual fests, literary expos, calligraphy exhibitions, and class history.',
      features: ['4K Event Photo Vault', 'Annual Fest Video Recaps', 'Literary Competition Logs', 'Alumni Memory Collection'],
      link: 'https://www.youtube.com/@sadad.studentsunion',
      isExternal: true
    }
  ]);

  const [faqs, setFaqs] = useState<FaqItem[]>([
    {
      q: "How can I contact the class union?",
      a: "You can contact the SADAD Class Union anytime via our Contact Form, by phone at +91 70251 50544, by email at sadadclassunion@gmail.com, or through WhatsApp & Live Chat. We respond to all inquiries as quickly as possible."
    },
    {
      q: "How do I submit suggestions?",
      a: "You can submit suggestions directly through our Contact Form on this page by selecting 'Project Suggestion' or typing your idea in the message box. All student and alumni suggestions are logged securely in our database and reviewed during executive board meetings."
    },
    {
      q: "How can I participate in events?",
      a: "Announcements for upcoming academic competitions, cultural fests, and workshops are posted on our Telegram channel, WhatsApp group, and the Events section of this portal. Contact our Cultural & Academic Secretary or submit an inquiry form to register."
    },
    {
      q: "Who manages the website?",
      a: "The website is designed, developed, and managed by the SADAD Digital & Tech Team at Akode Islamic Centre, led by Union Coordinator Sinan K.A."
    },
    {
      q: "What are the working hours of the union office?",
      a: "Our physical union office at Akode Islamic Centre is open Monday to Friday from 9:00 AM – 5:00 PM, and Saturday from 9:00 AM – 1:00 PM. Sundays are holidays, though our digital portals and contact forms remain accessible 24/7."
    },
    {
      q: "How can I apply for student welfare relief?",
      a: "Students requiring assistance with textbooks, tuition fees, or emergency support can submit a message under 'Welfare Assistance' or speak directly to Welfare Officer Faris Ahmed in complete confidence."
    }
  ]);

  // Admin Dashboard Active Tab & Form Editing States
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  
  const [adminTab, setAdminTab] = useState<'messages' | 'notice' | 'contact' | 'socials' | 'executives' | 'initiatives' | 'apps' | 'faqs'>('messages');
  const [adminSaveMsg, setAdminSaveMsg] = useState<string | null>(null);

  // Forms for editing items in admin panel
  const [editingLeaderIndex, setEditingLeaderIndex] = useState<number | 'new' | null>(null);
  const [leaderForm, setLeaderForm] = useState<ExecutiveMember>({ name: '', role: '', badge: '', avatar: '👨‍💼', quote: '', email: '', phone: '' });

  const [editingInitIndex, setEditingInitIndex] = useState<number | 'new' | null>(null);
  const [initForm, setInitForm] = useState<InitiativeItem>({ id: '', category: 'academic', title: '', status: 'Active', progress: 50, budget: 'Union Fund', lead: '', desc: '' });

  const [editingAppIndex, setEditingAppIndex] = useState<number | 'new' | null>(null);
  const [appForm, setAppForm] = useState<AppGalleryItem>({ id: '', title: '', category: 'utility', status: 'Active', version: 'v1.0.0', icon: '⚡', tag: 'Tool', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', gradient: 'from-cyan-600 via-teal-600 to-blue-600', description: '', features: ['Feature 1'], link: '#', isExternal: false });

  const [editingFaqIndex, setEditingFaqIndex] = useState<number | 'new' | null>(null);
  const [faqForm, setFaqForm] = useState<FaqItem>({ q: '', a: '' });

  // Accordion & Search FAQ State
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true });
  const [faqSearch, setFaqSearch] = useState('');

  // Active Initiatives Tab Filter
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'cultural' | 'welfare' | 'tech'>('all');
  const [selectedModalItem, setSelectedModalItem] = useState<any | null>(null);

  // Apps Gallery State
  const [appCategory, setAppCategory] = useState<'all' | 'academic' | 'utility' | 'community' | 'media'>('all');
  const [appSearch, setAppSearch] = useState('');
  const [selectedAppModal, setSelectedAppModal] = useState<any | null>(null);

  // Form Limits & Rate Limit Simulation
  const MESSAGE_LIMIT = 500;
  const [lastSubmitted, setLastSubmitted] = useState(0);

  // -----------------------------------------
  // Mouse Tracking & Scroll Listeners
  // -----------------------------------------
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // -----------------------------------------
  // Auth & Firestore Subscriptions
  // -----------------------------------------
  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
      try {
        const authToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : (typeof window !== 'undefined' ? window.__initial_auth_token : undefined);
        if (authToken) {
          await signInWithCustomToken(auth, authToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Authentication Error", err);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to public messages & settings in Firestore
  useEffect(() => {
    if (!db || !user) return;

    const messagesCollection = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubscribe = onSnapshot(
      messagesCollection,
      (snapshot) => {
        const msgs: MessageItem[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...(doc.data() as Omit<MessageItem, 'id'>) });
        });
        msgs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setMessages(msgs);
      },
      (error) => {
        console.error("Firestore read error: ", error);
      }
    );

    const socialsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'socials');
    const unsubscribeSocials = onSnapshot(socialsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSocialLinks(prev => ({ ...prev, ...(docSnap.data() as SocialLinks) }));
      }
    }, (error) => {
      console.warn("Firestore social settings fetch failed: ", error);
    });

    const noticeDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'notice');
    const unsubNotice = onSnapshot(noticeDocRef, (snap) => {
      if (snap.exists()) setNoticeBanner(snap.data() as NoticeBannerData);
    });

    const contactDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'contact');
    const unsubContact = onSnapshot(contactDocRef, (snap) => {
      if (snap.exists()) setContactInfo(snap.data() as typeof contactInfo);
    });

    const execDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'executives');
    const unsubExec = onSnapshot(execDocRef, (snap) => {
      if (snap.exists() && snap.data().items) setExecutives(snap.data().items);
    });

    const initDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'initiatives');
    const unsubInit = onSnapshot(initDocRef, (snap) => {
      if (snap.exists() && snap.data().items) setInitiatives(snap.data().items);
    });

    const appsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'appsGallery');
    const unsubApps = onSnapshot(appsDocRef, (snap) => {
      if (snap.exists() && snap.data().items) setAppsGallery(snap.data().items);
    });

    const faqsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'faqs');
    const unsubFaqs = onSnapshot(faqsDocRef, (snap) => {
      if (snap.exists() && snap.data().items) setFaqs(snap.data().items);
    });

    return () => {
      unsubscribe();
      unsubscribeSocials();
      unsubNotice();
      unsubContact();
      unsubExec();
      unsubInit();
      unsubApps();
      unsubFaqs();
    };
  }, [user]);

  // Form Input Change Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > MESSAGE_LIMIT) return;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;

    if (!form.fullName.trim()) errors.fullName = "Full name is required";
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (form.phoneNumber.trim() && !phoneRegex.test(form.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
    }
    if (!form.subject.trim()) errors.subject = "Subject is required";
    if (!form.message.trim()) {
      errors.message = "Message is required";
    } else if (form.message.length < 10) {
      errors.message = "Message should be at least 10 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Contact Form
  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(false);
    setFormErrorMsg('');

    if (!validateForm()) return;

    const now = Date.now();
    if (now - lastSubmitted < 30000) {
      setFormErrorMsg("Submission throttled. Please wait 30 seconds between requests.");
      return;
    }

    setIsSubmitting(true);

    try {
      const msgPayload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || 'N/A',
        subject: form.subject.trim(),
        message: form.message.trim(),
        timestamp: Date.now(),
        isRead: false,
        reply: '',
        repliedAt: null,
        userAgent: navigator.userAgent
      };

      if (db) {
        const messagesCollection = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
        await addDoc(messagesCollection, msgPayload);
      } else {
        setMessages(prev => [
          { id: Math.random().toString(36).substring(7), ...msgPayload },
          ...prev
        ]);
      }

      setFormSuccess(true);
      setLastSubmitted(now);
      setForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error(err);
      setFormErrorMsg("Failed to deliver message. Please reach out directly via phone or email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill subject chip
  const setQuickSubject = (subj: string) => {
    setForm(prev => ({ ...prev, subject: subj }));
    if (formErrors.subject) setFormErrors(prev => ({ ...prev, subject: '' }));
  };

  // Trigger Ripple
  const triggerRipple = (name: string) => {
    const el = document.getElementById(`btn-${name}`);
    if (el) {
      el.classList.add('scale-95');
      setTimeout(() => el.classList.remove('scale-95'), 150);
    }
  };

  // Toggle FAQ
  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Helper to save setting document to Firestore
  const saveFirestoreSettingDoc = async (key: string, data: any) => {
    if (db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', key);
        await setDoc(docRef, data, { merge: true });
        setAdminSaveMsg(`Published ${key.toUpperCase()} settings live!`);
      } catch (err) {
        console.error(`Error writing ${key} setting to Firestore`, err);
        setAdminSaveMsg(`Saved locally (Firestore offline)`);
      }
    } else {
      setAdminSaveMsg(`Saved locally!`);
    }
    setTimeout(() => setAdminSaveMsg(null), 3500);
  };

  // Executive Leaders Admin CRUD
  const saveLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderForm.name.trim() || !leaderForm.role.trim()) return;

    let updated: ExecutiveMember[];
    if (editingLeaderIndex === 'new') {
      updated = [...executives, { ...leaderForm, id: `exec-${Date.now()}` }];
    } else if (typeof editingLeaderIndex === 'number') {
      updated = executives.map((m, idx) => idx === editingLeaderIndex ? { ...leaderForm } : m);
    } else {
      return;
    }
    setExecutives(updated);
    saveFirestoreSettingDoc('executives', { items: updated });
    setEditingLeaderIndex(null);
  };

  const deleteLeader = (index: number) => {
    if (!confirm("Are you sure you want to remove this executive leader?")) return;
    const updated = executives.filter((_, idx) => idx !== index);
    setExecutives(updated);
    saveFirestoreSettingDoc('executives', { items: updated });
  };

  // Initiatives Admin CRUD
  const saveInitiative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initForm.title.trim() || !initForm.lead.trim()) return;

    let updated: InitiativeItem[];
    if (editingInitIndex === 'new') {
      updated = [...initiatives, { ...initForm, id: `init-${Date.now()}` }];
    } else if (typeof editingInitIndex === 'number') {
      updated = initiatives.map((i, idx) => idx === editingInitIndex ? { ...initForm } : i);
    } else {
      return;
    }
    setInitiatives(updated);
    saveFirestoreSettingDoc('initiatives', { items: updated });
    setEditingInitIndex(null);
  };

  const deleteInitiative = (index: number) => {
    if (!confirm("Remove this initiative record?")) return;
    const updated = initiatives.filter((_, idx) => idx !== index);
    setInitiatives(updated);
    saveFirestoreSettingDoc('initiatives', { items: updated });
  };

  // Apps Gallery Admin CRUD
  const saveApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.title.trim()) return;

    let updated: AppGalleryItem[];
    if (editingAppIndex === 'new') {
      updated = [...appsGallery, { ...appForm, id: `app-${Date.now()}` }];
    } else if (typeof editingAppIndex === 'number') {
      updated = appsGallery.map((a, idx) => idx === editingAppIndex ? { ...appForm } : a);
    } else {
      return;
    }
    setAppsGallery(updated);
    saveFirestoreSettingDoc('appsGallery', { items: updated });
    setEditingAppIndex(null);
  };

  const deleteApp = (index: number) => {
    if (!confirm("Remove this app from the digital gallery?")) return;
    const updated = appsGallery.filter((_, idx) => idx !== index);
    setAppsGallery(updated);
    saveFirestoreSettingDoc('appsGallery', { items: updated });
  };

  // FAQs Admin CRUD
  const saveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.q.trim() || !faqForm.a.trim()) return;

    let updated: FaqItem[];
    if (editingFaqIndex === 'new') {
      updated = [...faqs, { ...faqForm, id: `faq-${Date.now()}` }];
    } else if (typeof editingFaqIndex === 'number') {
      updated = faqs.map((f, idx) => idx === editingFaqIndex ? { ...faqForm } : f);
    } else {
      return;
    }
    setFaqs(updated);
    saveFirestoreSettingDoc('faqs', { items: updated });
    setEditingFaqIndex(null);
  };

  const deleteFaq = (index: number) => {
    if (!confirm("Delete this FAQ item?")) return;
    const updated = faqs.filter((_, idx) => idx !== index);
    setFaqs(updated);
    saveFirestoreSettingDoc('faqs', { items: updated });
  };

  // Admin Auth & Handlers
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'sinan') {
      setIsAdminAuthenticated(true);
      setAdminError('');
    } else {
      setAdminError('Invalid access key password.');
    }
  };

  const toggleMessageRead = async (msgId: string, currentStatus?: boolean) => {
    if (!db) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await updateDoc(docRef, { isRead: !currentStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm("Permanently remove this message log?")) return;
    if (!db) {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      return;
    }
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(err);
    }
  };

  const sendAdminReply = async (msgId: string) => {
    const text = replyText[msgId];
    if (!text || !text.trim()) return;

    if (!db) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reply: text, repliedAt: Date.now() } : m));
      setReplyingToId(null);
      return;
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId);
      await updateDoc(docRef, {
        reply: text.trim(),
        repliedAt: Date.now(),
        isRead: true
      });
      setReplyText(prev => ({ ...prev, [msgId]: '' }));
      setReplyingToId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const exportMessagesJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sadad_union_messages_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportMessagesCSV = () => {
    if (messages.length === 0) return;
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Subject', 'Message', 'Date', 'Status'];
    const rows = messages.map(m => [
      `"${m.id}"`,
      `"${(m.fullName || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.phoneNumber || '').replace(/"/g, '""')}"`,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      `"${m.timestamp ? new Date(m.timestamp).toLocaleString() : ''}"`,
      `"${m.isRead ? 'Read' : 'Unread'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', `sadad_union_messages_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (adminFilter === 'unread' && m.isRead) return false;
      if (adminFilter === 'read' && !m.isRead) return false;

      const q = adminSearch.toLowerCase();
      if (!q) return true;
      return (
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q) ||
        m.phoneNumber?.toLowerCase().includes(q)
      );
    });
  }, [messages, adminFilter, adminSearch]);

  const unreadCount = useMemo(() => messages.filter(m => !m.isRead).length, [messages]);

  // Core Pillars Data
  const pillars = [
    {
      id: 'academic',
      title: 'Academic Excellence',
      icon: '🎓',
      desc: 'Peer tutoring, study circles, syllabus guidance, and exam preparation resources.',
      details: 'SADAD Class Union organizes weekly peer-led discussion panels, provides digital study materials, and coordinates faculty mentorship sessions to ensure top performance for all students.',
      color: 'from-cyan-500 to-blue-600',
      badge: '100% Student Mentorship'
    },
    {
      id: 'welfare',
      title: 'Student Welfare & Relief',
      icon: '🤝',
      desc: 'Emergency assistance funds, book grants, and dedicated student health support.',
      details: 'Our welfare committee discreetly aids students in need, ensuring equal access to books, exam fees, medical aid, and campus necessities.',
      color: 'from-emerald-500 to-teal-600',
      badge: '₹85,000+ Distributed'
    },
    {
      id: 'spiritual',
      title: 'Spiritual & Cultural Harmony',
      icon: '🕌',
      desc: 'Moral guidance, Islamic cultural fests, ethics workshops, and community dinners.',
      details: 'Rooted at Akode Islamic Centre, we foster character building, respectful dialogues, annual cultural fests, and spirit-lifting gatherings.',
      color: 'from-purple-500 to-indigo-600',
      badge: 'Annual Fest & Workshops'
    },
    {
      id: 'innovation',
      title: 'Digital & Tech Innovation',
      icon: '⚡',
      desc: 'Student web portals, real-time union tools, coding bootcamps, and creative media.',
      details: 'We build digital tools for real-time union communications, event registration, tech skill workshops, and creative photography projects.',
      color: 'from-amber-500 to-orange-600',
      badge: 'Realtime Web Platform'
    }
  ];

  const filteredInitiatives = useMemo(() => {
    if (activeTab === 'all') return initiatives;
    return initiatives.filter(i => i.category === activeTab);
  }, [activeTab, initiatives]);

  const filteredApps = useMemo(() => {
    return appsGallery.filter(app => {
      if (appCategory !== 'all' && app.category !== appCategory) return false;
      if (!appSearch.trim()) return true;
      const q = appSearch.toLowerCase();
      return (
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.tag.toLowerCase().includes(q) ||
        app.features.some(f => f.toLowerCase().includes(q))
      );
    });
  }, [appCategory, appSearch, appsGallery]);

  // Timeline Events
  const timeline = [
    { year: '2024', title: 'Union Charter Established', desc: 'SADAD Class Union was formed at Akode Islamic Centre to represent student voices and foster unity.' },
    { year: '2025', title: 'Welfare & Academic Support Drive', desc: 'Distributed ₹85,000+ in textbook grants and launched peer study circles for exam excellence.' },
    { year: '2025', title: 'Grand Annual Fest & Expo', desc: 'Hosted 300+ attendees in literary events, Islamic arts, and inter-class competitions.' },
    { year: '2026', title: 'Next-Gen Realtime Digital Portal', desc: 'Deployed award-winning digital portal with Firestore synchronization, instant feedback, and AI color themes.' }
  ];

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqs;
    const q = faqSearch.toLowerCase();
    return faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [faqSearch, faqs]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ease-in-out relative selection:bg-white selection:text-black ${darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-900 text-white'}`}>
      
      {/* 1. ULTRA-PREMIUM INTERACTIVE CURSOR LIGHTING SYSTEM */}
      <InteractiveCursorLighting activeThemeKey={aiColorKey} darkMode={darkMode} />

      {/* 2. MULTI-LAYER ANIMATED AURORA & MESH BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-15%] left-[-15%] w-[65%] h-[55%] rounded-full blur-[160px] opacity-30 animate-blob-1 ${activeTheme.bgGlowTop}`}></div>
        <div className={`absolute top-[25%] right-[-15%] w-[60%] h-[60%] rounded-full blur-[170px] opacity-25 animate-blob-2 ${activeTheme.bgGlowBottom}`}></div>
        <div className="absolute top-[55%] left-[25%] w-[50%] h-[50%] rounded-full blur-[180px] opacity-15 animate-blob-3 bg-neutral-800/50"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[55%] h-[45%] rounded-full blur-[150px] opacity-20 animate-blob-1 bg-neutral-900/80"></div>
        
        {/* Subtle Cyber Matrix Grid */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px]"></div>
      </div>

      {/* 3. FLOATING GLASS NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/15 shadow-2xl shadow-black/80 py-3.5' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          
          {/* Logo & Brand */}
          <a href="#home" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/20 bg-black shadow-lg shadow-black/50 transition-all duration-300 group-hover:scale-110 group-hover:border-cyan-400 shrink-0 ring-2 ring-white/10">
              <SadadLogo className="w-full h-full" alt="SADAD Logo" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight block bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">SADAD</span>
              <span className={`text-[10px] tracking-widest ${activeTheme.textAccent} font-extrabold block uppercase`}>Class Union</span>
            </div>
          </a>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-extrabold tracking-wide uppercase">
            {[
              { label: "Home", href: "#home" },
              { label: "FAQ", href: "#faq" },
              { label: "Gallery", href: socialLinks.gallery, external: true },
              { label: "Contact", href: "#contact" },
            ].map((item) => (
              <a 
                key={item.label} 
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                className="text-slate-300 hover:text-cyan-300 transition-all duration-200 hover:scale-105 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 hover:after:w-full after:transition-all"
              >
                {item.label} {item.external && <span className="text-[10px] text-amber-400">↗</span>}
              </a>
            ))}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center space-x-3">
            
            {/* AI Theme Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-10 h-10 rounded-full border border-white/20 bg-neutral-900/90 text-white hover:bg-neutral-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-black/40 transition-all hover:scale-105"
                title="Change AI Accent Color Palette"
              >
                <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/30 transition-transform hover:scale-125 shadow-sm" style={{ backgroundColor: activeTheme.colorDot }}></span>
                <span className="text-[11px]">🎨</span>
              </button>

              {showColorPicker && (
                <div className="absolute right-0 mt-3 w-56 p-3 rounded-3xl border border-white/15 bg-neutral-900/95 text-white shadow-2xl backdrop-blur-2xl z-50 transition-all">
                  <div className="text-[10px] uppercase font-black tracking-widest text-neutral-400 px-2 py-1 mb-1.5 flex justify-between items-center">
                    <span>AI Color Theme</span>
                    <span>✨</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.values(AI_COLOR_THEMES).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setAiColorKey(t.id);
                          setShowColorPicker(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${aiColorKey === t.id ? `${t.badgeBg} ${t.badgeText} border ${t.badgeBorder} shadow-md` : 'hover:bg-neutral-800 text-neutral-300'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: t.colorDot }}></span>
                          <span>{t.name}</span>
                        </div>
                        {aiColorKey === t.id && <span className="text-xs font-black text-white">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Console Toggle */}
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className={`relative px-4 py-2 rounded-full text-xs font-extrabold ${activeTheme.badgeBg} ${activeTheme.badgeText} border ${activeTheme.badgeBorder} transition-all flex items-center gap-2 cursor-pointer hover:scale-105 shadow-md`}
              title="SADAD Union Admin Portal"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${unreadCount > 0 ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
              </span>
              <span>Admin</span>
              {unreadCount > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full text-[9px] font-black px-1.5 py-0.5 ml-0.5 animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* 4. ADMIN PANEL DRAWER */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex justify-center items-start pt-20 px-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-6 p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-slate-900/95 text-slate-100 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>🛡️</span>
                  <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">SADAD Control Console</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">Authorized Personnel</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Real-time Firestore feedback database, admin replies, social portal management.</p>
              </div>
              <button 
                onClick={() => setShowAdmin(false)} 
                className="p-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition border border-white/10"
              >
                ✕ Close
              </button>
            </div>

            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto p-8 rounded-3xl border border-white/15 bg-slate-950/90 text-center shadow-2xl backdrop-blur-xl">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/30 mb-4">
                  🔑
                </div>
                <h3 className="text-xl font-extrabold text-white">Class Admin Credentials</h3>
                <p className="text-xs text-slate-400 mt-1.5 mb-6">Enter access key password to view live student submissions.</p>
                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-slate-900 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner font-mono"
                  />
                  {adminError && <p className="text-xs text-rose-400 font-bold">{adminError}</p>}
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-2xl text-sm font-extrabold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Authenticate Console
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl border border-cyan-500/20 bg-slate-950/60 shadow-lg">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-extrabold block">Total Messages</span>
                    <span className="text-3xl font-black text-white">{messages.length}</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-slate-950/60 shadow-lg">
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest font-extrabold block">Unread Items</span>
                    <span className="text-3xl font-black text-amber-400">{unreadCount}</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-slate-950/60 shadow-lg">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold block">Response Rate</span>
                    <span className="text-3xl font-black text-emerald-400">
                      {messages.length ? Math.round((messages.filter(m => m.reply).length / messages.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button 
                      onClick={exportMessagesCSV}
                      className="px-3.5 py-3 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer transition-all hover:scale-105"
                      title="Export Messages to CSV File"
                    >
                      <span>📊</span> Export CSV
                    </button>
                    <button 
                      onClick={exportMessagesJSON}
                      className="px-3.5 py-3 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-105"
                      title="Export Messages to JSON File"
                    >
                      <span>📥</span> Export JSON
                    </button>
                    <button 
                      onClick={() => setIsAdminAuthenticated(false)}
                      className="px-3.5 py-3 rounded-2xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 cursor-pointer transition-all"
                    >
                      Lock Console
                    </button>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      placeholder="Search name, message, email..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl border border-white/10 bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                    />
                    <span className="absolute left-3.5 top-3 text-xs text-slate-400">🔍</span>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    {(['all', 'unread', 'read'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setAdminFilter(f)}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer ${adminFilter === f ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages Listing */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/80 max-h-[400px] overflow-y-auto">
                  {filteredMessages.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No messages match the filter.</div>
                  ) : (
                    <div className="divide-y divide-slate-800/80">
                      {filteredMessages.map((msg) => (
                        <div key={msg.id} className={`p-5 transition-colors ${!msg.isRead ? 'bg-cyan-950/30' : ''}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white">{msg.fullName || 'Anonymous'}</span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${msg.isRead ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                {msg.isRead ? 'Reviewed' : 'New Submission'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'N/A'}
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-slate-400 font-bold mb-1">Subject <span className="text-cyan-400">{msg.subject}</span></div>
                            <p className="text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-white/5">{msg.message}</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex gap-4 text-slate-400">
                              <span>📧 <a href={`mailto:${msg.email}`} className="underline hover:text-cyan-400 font-semibold">{msg.email}</a></span>
                              {msg.phoneNumber && msg.phoneNumber !== 'N/A' && <span>📞 <a href={`tel:${msg.phoneNumber}`} className="underline hover:text-cyan-400 font-semibold">{msg.phoneNumber}</a></span>}
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleMessageRead(msg.id, msg.isRead)}
                                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${msg.isRead ? 'bg-slate-800 text-slate-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}
                              >
                                {msg.isRead ? 'Mark Unread' : 'Mark Reviewed'}
                              </button>
                              <button
                                onClick={() => setReplyingToId(replyingToId === msg.id ? null : msg.id)}
                                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] font-bold transition cursor-pointer"
                              >
                                {msg.reply ? 'Edit Reply' : 'Draft Reply'}
                              </button>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 text-[11px] font-bold transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {(replyingToId === msg.id || msg.reply) && (
                            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/20">
                              {msg.reply && (
                                <div className="mb-2 text-xs">
                                  <span className="font-extrabold text-emerald-400">Published Reply:</span>
                                  <p className="text-slate-200 italic mt-0.5">"{msg.reply}"</p>
                                </div>
                              )}

                              {replyingToId === msg.id && (
                                <div className="space-y-2.5 mt-2">
                                  <textarea
                                    placeholder="Type official reply..."
                                    value={replyText[msg.id] || ''}
                                    onChange={(e) => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                                    className="w-full text-xs p-3 rounded-xl border border-white/10 focus:ring-2 focus:ring-cyan-500 bg-slate-950 text-white"
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setReplyingToId(null)}
                                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => sendAdminReply(msg.id)}
                                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-extrabold cursor-pointer shadow-md"
                                    >
                                      Publish Reply
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. CINEMATIC HERO EXPERIENCE */}
      <section id="home" className="relative z-10 pt-32 pb-20 px-4 max-w-7xl mx-auto">
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Shimmer Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 backdrop-blur-md shadow-lg shadow-cyan-500/10">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">
              SADAD CLASS UNION • AKODE ISLAMIC CENTRE
            </span>
            <span className="text-xs">⚡</span>
          </div>

          {/* Giant Multi-Stop Gradient Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
            Uniting Students, <br />
            <span className={`bg-gradient-to-r ${activeTheme.headingGradient} bg-clip-text text-transparent`}>
              Fostering Excellence.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Empowering student innovation, academic support, welfare relief, and cultural brotherhood through transparent, unified leadership at Akode Islamic Centre.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={socialLinks.gallery}
              target="_blank"
              rel="noreferrer"
              className={`px-7 py-4 rounded-2xl bg-gradient-to-r ${activeTheme.btnGradient} text-white font-extrabold text-sm tracking-wide shadow-xl ${activeTheme.cardGlow} transition-all duration-300 hover:scale-105 flex items-center gap-2`}
            >
              <span>📸 Photo Gallery</span>
              <span className="text-sm">↗</span>
            </a>

            <a
              href={socialLinks.googleChat}
              target="_blank"
              rel="noreferrer"
              className="px-7 py-4 rounded-2xl border border-white/20 bg-slate-900/80 hover:bg-slate-800/90 text-white font-extrabold text-sm tracking-wide shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <span>💬 Google Chat Portal</span>
            </a>

            <a
              href="#contact"
              className="px-6 py-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-sm tracking-wide transition-all"
            >
              Quick Contact
            </a>
          </div>

        </div>

      </section>

      {/* 11. INTERACTIVE FAQS ACCORDION */}
      <section id="faq" className="relative z-10 py-20 px-4 max-w-5xl mx-auto border-t border-white/10">
        
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/50 px-4 py-1.5 rounded-full border border-cyan-500/20 inline-block mb-3">
            Knowledge Base
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">Find instant answers regarding SADAD Class Union procedures and contact options.</p>

          {/* Search bar */}
          <div className="max-w-md mx-auto mt-6 relative">
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl border border-white/15 bg-slate-900/90 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xl"
            />
            <span className="absolute right-4 top-3.5 text-xs text-slate-400">🔍</span>
          </div>
        </div>

        <div className="space-y-4">
          {filteredFaqs.map((f, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-white/15 bg-slate-900/80 backdrop-blur-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-6 text-left flex justify-between items-center cursor-pointer font-extrabold text-sm sm:text-base text-white hover:text-cyan-300 transition-colors"
              >
                <span>{f.q}</span>
                <span className="text-cyan-400 text-xl font-bold ml-4">{faqOpen[idx] ? '−' : '+'}</span>
              </button>

              {faqOpen[idx] && (
                <div className="px-6 pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* 12. REAL-TIME CONTACT & FEEDBACK HUB (PRD COMPLIANT) */}
      <section id="contact" className="relative z-10 py-20 px-4 max-w-7xl mx-auto border-t border-white/10">
        
        {/* HERO SUB-SECTION */}
        <div className="text-center max-w-4xl mx-auto mb-16 relative">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-widest mb-4 shadow-lg shadow-cyan-500/10 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Reach Out Anytime</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4">
            Get in <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">Touch</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Have a question, suggestion, or need assistance? We're here to help. Connect with the SADAD Class Union anytime.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-bold">
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>⚡ Average Response &lt; 1 Hour</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-cyan-300 flex items-center gap-2">
              <span>🛡️ 100% Confidential & Secure</span>
            </div>
            <a 
              href="#contact-form-block"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:scale-105 transition flex items-center gap-1"
            >
              <span>Scroll to Form</span>
              <span>↓</span>
            </a>
          </div>
        </div>

        {/* QUICK ACTION BUTTONS GRID */}
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <a
            id="btn-call"
            href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`}
            onClick={() => triggerRipple('call')}
            className="spotlight-card p-6 rounded-3xl border border-emerald-500/30 bg-slate-900/80 hover:bg-emerald-950/40 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/20 group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-500 via-emerald-500 to-teal-400 text-white flex items-center justify-center p-2.5 shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform shrink-0 border border-emerald-300/30">
                <svg className="w-full h-full fill-current text-white" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">Direct Hotline</span>
                <span className="text-sm font-extrabold text-white block">Call Now</span>
                <span className="text-xs text-slate-400 font-mono">{contactInfo.phone}</span>
              </div>
            </div>
            <span className="text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">➔</span>
          </a>

          <a
            id="btn-email"
            href={`mailto:${contactInfo.email}`}
            onClick={() => triggerRipple('email')}
            className="spotlight-card p-6 rounded-3xl border border-cyan-500/30 bg-slate-900/80 hover:bg-cyan-950/40 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/20 group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-white p-2.5 shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-transform shrink-0 flex items-center justify-center border border-white/20">
                <svg className="w-full h-full" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M45,16.2l-5,2.75V37h6c1.1,0,2-0.9,2-2V18.3C48,17.2,46.3,16,45,16.2z"/>
                  <path fill="#34A853" d="M3,37h6V18.95l-5-2.75C2.7,16,1,17.2,1,18.3V35C1,36.1,1.9,37,3,37z"/>
                  <path fill="#EA4335" d="M12,11.5L24,20l12-8.5V37h4V14c0-2.3-2.6-3.7-4.5-2.3L24,19.5L12.5,11.7C10.6,10.3,8,11.7,8,14v23h4V11.5z"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 block">Official Mail</span>
                <span className="text-sm font-extrabold text-white block">Send Email</span>
                <span className="text-xs text-slate-400 font-mono truncate max-w-[120px] block">{contactInfo.email}</span>
              </div>
            </div>
            <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">➔</span>
          </a>

          <a
            id="btn-instagram"
            href={socialLinks.instagram}
            target="_blank"
            rel="noreferrer"
            onClick={() => triggerRipple('instagram')}
            className="spotlight-card p-6 rounded-3xl border border-pink-500/30 bg-slate-900/80 hover:bg-pink-950/40 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-pink-500/20 group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#cc2366] text-white flex items-center justify-center p-2.5 shadow-lg shadow-pink-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform shrink-0 border border-pink-300/30">
                <svg className="w-full h-full fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-pink-400 block">Instagram</span>
                <span className="text-sm font-extrabold text-white block">Follow Us</span>
                <span className="text-xs text-slate-400 font-mono truncate max-w-[110px] block">@_sadad_official_</span>
              </div>
            </div>
            <span className="text-pink-400 font-bold group-hover:translate-x-1 transition-transform">↗</span>
          </a>

          <a
            id="btn-whatsapp"
            href={socialLinks.whatsapp}
            target="_blank"
            rel="noreferrer"
            onClick={() => triggerRipple('whatsapp')}
            className="spotlight-card p-6 rounded-3xl border border-teal-500/30 bg-slate-900/80 hover:bg-teal-950/40 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-teal-500/20 group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center p-2.5 shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform shrink-0 border border-emerald-300/30">
                <svg className="w-full h-full fill-current text-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.285-.143-1.687-.833-1.947-.928-.26-.095-.45-.143-.639.143-.19.285-.736.928-.902 1.118-.167.19-.333.214-.618.071-.285-.143-1.207-.445-2.299-1.418-.849-.757-1.422-1.692-1.588-1.977-.167-.285-.018-.439.125-.581.128-.128.285-.333.428-.499.143-.167.19-.285.285-.476.095-.19.048-.357-.024-.5-.071-.143-.639-1.543-.876-2.11-.23-.553-.464-.478-.639-.487-.165-.008-.356-.01-.547-.01-.19 0-.5.071-.761.357-.26.285-.999.976-.999 2.38 0 1.404 1.023 2.76 1.166 2.951.143.19 2.013 3.074 4.877 4.31.682.294 1.213.469 1.628.601.684.217 1.307.186 1.799.113.548-.081 1.687-.689 1.925-1.355.238-.666.238-1.236.167-1.355-.071-.12-.26-.19-.546-.333z"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-teal-400 block">Instant Chat</span>
                <span className="text-sm font-extrabold text-white block">WhatsApp</span>
                <span className="text-xs text-slate-400">Direct Message</span>
              </div>
            </div>
            <span className="text-teal-400 font-bold group-hover:translate-x-1 transition-transform">↗</span>
          </a>

          <a
            id="btn-maps"
            href="https://www.google.com/maps/search/?api=1&query=Akode+Islamic+Centre+Kerala+India"
            target="_blank"
            rel="noreferrer"
            onClick={() => triggerRipple('maps')}
            className="spotlight-card p-6 rounded-3xl border border-purple-500/30 bg-slate-900/80 hover:bg-purple-950/40 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 group relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-white p-2.5 shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-transform shrink-0 flex items-center justify-center border border-white/20">
                <svg className="w-full h-full" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24,4.5C15.4,4.5,8.5,11.4,8.5,20c0,11.6,13.7,22.4,14.3,22.8c0.4,0.3,0.9,0.3,1.3,0c0.6-0.4,14.3-11.2,14.3-22.8C39.5,11.4,32.6,4.5,24,4.5z"/>
                  <circle cx="24" cy="20" r="6" fill="#FFFFFF"/>
                  <circle cx="24" cy="20" r="3.5" fill="#4285F4"/>
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 block">GPS Location</span>
                <span className="text-sm font-extrabold text-white block">Get Directions</span>
                <span className="text-xs text-slate-400">Akode, Kerala</span>
              </div>
            </div>
            <span className="text-purple-400 font-bold group-hover:translate-x-1 transition-transform">↗</span>
          </a>
        </div>

        {/* MAIN CONTACT LAYOUT (GRID) */}
        <div id="contact-form-block" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* LEFT CONTACT INFO CARD & OFFICE HOURS (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* GLASSMORPHISM CONTACT INFO CARD */}
            <div className="p-8 rounded-3xl border border-white/15 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] uppercase font-black text-cyan-400 tracking-widest block">Official Contact Card</span>
                  <h3 className="text-2xl font-black text-white">SADAD Class Union</h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center font-black text-xs">
                  SCU
                </div>
              </div>

              <div className="space-y-6 text-xs">
                
                {/* Organization */}
                <div className="flex items-start space-x-4 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-black shrink-0 shadow-md">
                    <SadadLogo className="w-full h-full" rounded={false} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider block">Organization</span>
                    <p className="font-extrabold text-white text-sm">SADAD Class Union</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/60 p-2 flex items-center justify-center shrink-0 shadow-md">
                      <svg className="w-full h-full" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24,4.5C15.4,4.5,8.5,11.4,8.5,20c0,11.6,13.7,22.4,14.3,22.8c0.4,0.3,0.9,0.3,1.3,0c0.6-0.4,14.3-11.2,14.3-22.8C39.5,11.4,32.6,4.5,24,4.5z"/>
                        <circle cx="24" cy="20" r="6" fill="#FFFFFF"/>
                        <circle cx="24" cy="20" r="3.5" fill="#4285F4"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-pink-400 tracking-wider block">Address</span>
                      <p className="font-extrabold text-white text-sm leading-snug">
                        Akode Islamic Centre<br />
                        <span className="text-xs font-normal text-slate-300">Kerala, India</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(contactInfo.address, "Address")}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold"
                    title="Copy Address"
                  >
                    📋
                  </button>
                </div>

                {/* Phone */}
                <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md p-2">
                      <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">Hotline</span>
                      <a href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`} className="font-extrabold text-white text-sm hover:underline font-mono">
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(contactInfo.phone, "Phone Number")}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold"
                    title="Copy Phone Number"
                  >
                    📋
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-start space-x-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/60 p-2 flex items-center justify-center shrink-0 shadow-md">
                      <svg className="w-full h-full" viewBox="0 0 48 48">
                        <path fill="#4285F4" d="M45,16.2l-5,2.75V37h6c1.1,0,2-0.9,2-2V18.3C48,17.2,46.3,16,45,16.2z"/>
                        <path fill="#34A853" d="M3,37h6V18.95l-5-2.75C2.7,16,1,17.2,1,18.3V35C1,36.1,1.9,37,3,37z"/>
                        <path fill="#EA4335" d="M12,11.5L24,20l12-8.5V37h4V14c0-2.3-2.6-3.7-4.5-2.3L24,19.5L12.5,11.7C10.6,10.3,8,11.7,8,14v23h4V11.5z"/>
                      </svg>
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider block">Official Email</span>
                      <a href={`mailto:${contactInfo.email}`} className="font-extrabold text-white text-sm hover:underline truncate block">
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(contactInfo.email, "Email Address")}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold shrink-0"
                    title="Copy Email Address"
                  >
                    📋
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT FORM COLUMN (7 COLS) */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl border border-white/15 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative">
              
              <div className="mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-500/20 inline-block mb-2">
                  Direct Firebase Channel
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Send Direct Message</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Submissions store securely in Firestore for immediate administrative review by SADAD union coordinators.
                </p>
              </div>

              {/* Quick Subject Tag Chips */}
              <div className="mb-6">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-2">Select Quick Subject</span>
                <div className="flex flex-wrap gap-2">
                  {['General Query', 'Academic Support', 'Union Membership', 'Welfare Assistance', 'Project Suggestion'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setQuickSubject(chip)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${form.subject === chip ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-md scale-105' : 'bg-slate-950 text-slate-400 border-white/10 hover:bg-slate-800'}`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {formSuccess && (
                <div className="p-6 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 mb-6 shadow-2xl animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <h4 className="font-extrabold text-base text-white">Message Delivered Successfully!</h4>
                      <p className="text-xs text-emerald-300 mt-0.5">Thank you for reaching out to SADAD Class Union. Our digital coordinators will review and reply shortly.</p>
                    </div>
                  </div>
                </div>
              )}

              {formErrorMsg && (
                <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 mb-6 text-xs font-bold">
                  ⚠️ {formErrorMsg}
                </div>
              )}

              <form onSubmit={handleSubmitContact} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. sinanka"
                      value={form.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                    />
                    {formErrors.fullName && <p className="text-[11px] text-rose-400 font-bold mt-1">{formErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. students@gmail.com"
                      value={form.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                    />
                    {formErrors.email && <p className="text-[11px] text-rose-400 font-bold mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-1.5">Phone Number (Optional)</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      placeholder="e.g. +91 70251 50544"
                      value={form.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                    />
                    {formErrors.phoneNumber && <p className="text-[11px] text-rose-400 font-bold mt-1">{formErrors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-1.5">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      placeholder="Subject title..."
                      value={form.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner"
                    />
                    {formErrors.subject && <p className="text-[11px] text-rose-400 font-bold mt-1">{formErrors.subject}</p>}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-extrabold text-slate-300">Message *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{form.message.length}/{MESSAGE_LIMIT}</span>
                  </div>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Type your message, question, or suggestion here..."
                    value={form.message}
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-2xl border border-white/10 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-inner resize-none"
                  />
                  {formErrors.message && <p className="text-[11px] text-rose-400 font-bold mt-1">{formErrors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-2xl bg-gradient-to-r ${activeTheme.btnGradient} text-white font-black text-sm tracking-wide shadow-xl ${activeTheme.cardGlow} transition-all duration-300 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Sending Message...
                    </span>
                  ) : (
                    <span>Send Message ➔</span>
                  )}
                </button>

              </form>
            </div>
          </div>

        </div>

        {/* GOOGLE MAPS EMBED SECTION */}
        <div className="mb-16 rounded-3xl border border-white/15 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400 block mb-1">Interactive Navigation</span>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <span>📍</span> SADAD Union Headquarters Map
              </h3>
              <p className="text-xs text-slate-300">Akode Islamic Centre, Kerala, India</p>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Akode+Islamic+Centre+Kerala+India"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 hover:scale-105 transition flex items-center gap-2 self-start sm:self-auto"
            >
              <span>Open Google Maps</span>
              <span>↗</span>
            </a>
          </div>

          <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner">
            <iframe
              title="Akode Islamic Centre Map"
              src="https://maps.google.com/maps?q=Akode%20Islamic%20Centre,%20Kerala,%20India&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            
            {/* Overlay badge */}
            <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-xl border border-white/20 p-3 rounded-2xl text-xs text-white shadow-xl flex items-center space-x-3 pointer-events-none">
              <span className="text-xl">🕌</span>
              <div>
                <strong className="block font-black text-cyan-300">Akode Islamic Centre</strong>
                <span className="text-[10px] text-slate-400">Main Campus • Kerala</span>
              </div>
            </div>
          </div>
        </div>

        {/* OFFICIAL SOCIAL MEDIA CARDS & YOUTUBE CHANNEL SPOTLIGHT */}
        <div className="mb-16 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 bg-purple-950/50 px-4 py-1 rounded-full border border-purple-500/20 inline-block mb-2">
              Social Media Ecosystem
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white">Connect Across Platforms</h3>
          </div>

          {/* OFFICIAL YOUTUBE CHANNEL BANNER */}
          <div className="p-8 sm:p-10 rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-4xl shadow-2xl shadow-red-500/30 shrink-0">
                ▶️
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    Official Channel
                  </span>
                  <span className="text-xs text-slate-400 font-mono">@sadad.studentsunion</span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-black">SADAD Students Union</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                  Subscribe to our YouTube channel for live recordings of cultural fests, Islamic speeches, study webinars, and union highlights.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 relative z-10 shrink-0">
              <a
                href={`${socialLinks.youtube}?sub_confirmation=1`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-red-500/30 hover:scale-105 transition flex items-center gap-2"
              >
                <span>Subscribe Channel</span>
                <span>▶</span>
              </a>
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-white/10"
              >
                <span>Watch Latest Videos</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* OFFICIAL INSTAGRAM PAGE BANNER */}
          <div className="p-8 sm:p-10 rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-slate-950 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-pink-500/30 shrink-0">
                📸
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    Official Instagram
                  </span>
                  <span className="text-xs text-slate-300 font-mono">@_sadad_official_</span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-black">Follow Us on Instagram</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                  Stay updated with daily campus stories, event announcements, photo highlights, and union activities on our official Instagram page.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 relative z-10 shrink-0">
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-pink-500/30 hover:scale-105 transition flex items-center gap-2"
              >
                <span>Follow @_sadad_official_</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* OFFICIAL SADAD PHOTO GALLERY & EVENT ALBUM BANNER */}
          <div className="p-8 sm:p-10 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/30 shrink-0">
                📸
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Official Photo Album
                  </span>
                  <span className="text-xs text-amber-400 font-mono font-bold">Google Photos</span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-black">SADAD Event Photo Gallery</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                  Browse our official photo album capturing moments from campus celebrations, academic fests, union conferences, and student events.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 relative z-10 shrink-0">
              <a
                href={socialLinks.gallery || 'https://photos.app.goo.gl/kF1XeerBu2vA5Hje6'}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:scale-105 transition flex items-center gap-2"
              >
                <span>View Google Photos Album</span>
                <span className="text-sm">↗</span>
              </a>
            </div>
          </div>

          {/* LIVE CHAT SUPPORT CARD */}
          <div className="p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-xl shadow-cyan-500/30 shrink-0">
                💬
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 block mb-0.5">Instant Live Help</span>
                <h4 className="text-2xl font-black">Chat with Us</h4>
                <p className="text-xs text-slate-300 mt-0.5">Need instant help? Connect with our support team through Live Chat.</p>
              </div>
            </div>

            <a
              href={socialLinks.liveChat}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-cyan-500/25 hover:scale-105 transition flex items-center gap-2 shrink-0"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Launch Live Chat</span>
              <span>↗</span>
            </a>
          </div>



        </div>

      </section>



      {/* FLOATING COPY TOAST NOTIFICATION */}
      {copyToast && (
        <div className="fixed top-24 right-6 z-50 bg-slate-900/95 border border-cyan-400 text-cyan-200 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center space-x-3 text-xs font-black animate-bounce">
          <span>📋</span>
          <span>{copyToast}</span>
        </div>
      )}

      {/* 13. MODAL DETAILED DRAWER */}
      {selectedModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-8 rounded-3xl border border-cyan-500/30 bg-slate-900/95 text-white shadow-2xl relative">
            <button
              onClick={() => setSelectedModalItem(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              ✕ Close
            </button>

            <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 block mb-2">Detailed Information</span>
            <h3 className="text-2xl font-black text-white mb-4">{selectedModalItem.title}</h3>
            
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {selectedModalItem.details || selectedModalItem.desc}
            </p>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedModalItem(null)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13.5 APP OVERVIEW MODAL */}
      {selectedAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl p-8 rounded-3xl border border-cyan-500/40 bg-slate-900/95 text-white shadow-2xl relative overflow-hidden">
            {/* Background Gradient Effect */}
            <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-br ${selectedAppModal.gradient} opacity-20 blur-3xl`}></div>

            <button
              onClick={() => setSelectedAppModal(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition z-10"
            >
              ✕ Close
            </button>

            <div className="flex items-center space-x-4 mb-6 relative z-10">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedAppModal.gradient} flex items-center justify-center text-3xl shadow-xl shadow-cyan-500/20`}>
                {selectedAppModal.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${selectedAppModal.badgeColor}`}>
                    {selectedAppModal.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/10">
                    {selectedAppModal.version}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">{selectedAppModal.title}</h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 relative z-10">
              {selectedAppModal.description}
            </p>

            <div className="mb-6 relative z-10">
              <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 mb-3">Core Features & Capabilities</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedAppModal.features.map((feat: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-white/10 flex justify-between items-center relative z-10">
              <span className="text-[11px] text-slate-400 font-semibold">Category: <strong className="text-white capitalize">{selectedAppModal.category}</strong></span>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedAppModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                {selectedAppModal.isExternal ? (
                  <a
                    href={selectedAppModal.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:scale-105 transition flex items-center space-x-1"
                  >
                    <span>Launch External App</span>
                    <span className="text-xs">↗</span>
                  </a>
                ) : (
                  <a
                    href={selectedAppModal.link}
                    onClick={() => setSelectedAppModal(null)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:scale-105 transition"
                  >
                    Go to Portal
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14. COMPREHENSIVE FOOTER (PRD COMPLIANT) */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/95 py-16 px-4 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Organization Branding */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-black p-0.5 border border-cyan-400/50 shadow-xl shadow-cyan-500/20 flex items-center justify-center shrink-0">
                <SadadLogo className="w-full h-full rounded-2xl" />
              </div>
              <div>
                <span className="font-black text-base text-white block tracking-tight">SADAD CLASS UNION</span>
                <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase block">Akode Islamic Centre</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
              Empowering students through academic excellence, moral leadership, digital innovation, and community welfare support.
            </p>

            <div className="pt-2 text-xs font-extrabold text-cyan-300">
              Together We Learn • Together We Lead
            </div>

            <div className="space-y-1 text-[11px] text-slate-400">
              <p>📍 Akode Islamic Centre, Kerala, India</p>
              <p>📞 <a href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`} className="text-slate-200 hover:underline">{contactInfo.phone}</a></p>
              <p>📧 <a href={`mailto:${contactInfo.email}`} className="text-slate-200 hover:underline">{contactInfo.email}</a></p>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 font-semibold text-slate-300">
              <li><a href="#home" className="hover:text-cyan-400 transition-colors">Home</a></li>
              <li><a href="#initiatives" className="hover:text-cyan-400 transition-colors">Active Initiatives</a></li>
              <li><a href="#leaders" className="hover:text-cyan-400 transition-colors">Executive Board</a></li>
              <li><a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
              <li><a href="#contact" className="hover:text-cyan-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Col 3: Legal & Resources */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Portals & Policies</h4>
            <ul className="space-y-2.5 font-semibold text-slate-300">
              <li><a href={socialLinks.googleChat} target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">Google Chat Portal</a></li>
              <li><a href={socialLinks.telegram} target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">Telegram Broadcast</a></li>
              <li><a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">WhatsApp Community</a></li>
              <li><a href="#contact" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#contact" className="hover:text-cyan-400 transition-colors">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Col 4: Official Media & Live Chat */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Official Channels</h4>
            <div className="space-y-3">
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-pink-950/40 border border-pink-500/30 hover:bg-pink-900/50 text-white flex items-center space-x-3 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 p-1.5 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full fill-current text-pink-300" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <strong className="block text-xs font-black">Official Instagram</strong>
                  <span className="text-[10px] text-pink-300 font-mono">@_sadad_official_ ↗</span>
                </div>
              </a>

              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 text-white flex items-center space-x-3 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 p-1.5 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full fill-current text-red-400" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <strong className="block text-xs font-black">YouTube Channel</strong>
                  <span className="text-[10px] text-red-300 font-mono">@sadad.studentsunion</span>
                </div>
              </a>

              <a
                href={socialLinks.gallery}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50 text-white flex items-center space-x-3 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 p-1.5 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full fill-current text-amber-300" viewBox="0 0 24 24">
                    <path d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 1 0-6.4 0M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                  </svg>
                </div>
                <div>
                  <strong className="block text-xs font-black">Event Photo Gallery</strong>
                  <span className="text-[10px] text-amber-300 font-mono">Google Photos Album ↗</span>
                </div>
              </a>

              <a
                href={socialLinks.liveChat}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 text-white flex items-center space-x-3 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 p-1.5 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full fill-current text-cyan-300" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                  </svg>
                </div>
                <div>
                  <strong className="block text-xs font-black">Live Chat Support</strong>
                  <span className="text-[10px] text-cyan-300">Instant Help</span>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Bottom Line */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-semibold">
          <div>
            © {new Date().getFullYear()} SADAD Class Union. All Rights Reserved. Akode Islamic Centre, Kerala, India.
          </div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>All Systems Operational • Real-time Firestore Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
