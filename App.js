import React, {
  useState, useEffect, useMemo, useRef, createContext, useContext,
} from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  StatusBar, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  SafeAreaProvider, SafeAreaView, useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer, CommonActions, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// CONSTANTS & HELPERS
// ==========================================
const COLORS = {
  primary: '#2E8B57',
  background: '#FFFFFF',
  text: '#333333',
  gray: '#888888',
  lightGray: '#F5F5F5',
  danger: '#ff4d4d',
  blue: '#4A90E2',
  orange: '#f39c12',
};

const STATUS_COLORS = {
  Pending: '#f39c12',
  Confirmed: '#2E8B57',
  Declined: '#c62828',
  approved: '#2E8B57',
  pending: '#f39c12',
  rejected: '#c62828',
  Paid: '#2E8B57',
  Unpaid: '#f39c12',
  'Paid out': '#4A90E2',
};

const STORAGE_KEY = 'brightpath_v2';

const SEED_ACCOUNTS = [
  { id: 'default', role: 'student', name: 'Student', email: 'student@test.com', password: '123456', gradeLevel: 'Grade 10', school: 'BrightPath High' },
  { id: 'admin', role: 'admin', name: 'Administrator', email: 'admin@brightpath.com', password: 'admin123' },
  { id: 'acc_t1', role: 'tutor', name: 'Ms. Trixie Morales', email: 'trixie@test.com', password: 'tutor123' },
];

const SEED_TUTORS = [
  { id: 't1', accountId: 'acc_t1', name: 'Ms. Trixie Morales', subject: 'Math', topic: 'Algebra', rating: '4.9', reviews: 120, price: 250, emoji: '👩‍🏫', status: 'approved', about: 'Enjoys helping students master math with over 8 years of experience. Specializes in Algebra and Calculus.', expertise: ['Algebra', 'Calculus', 'Statistics'] },
  { id: 't2', accountId: null, name: 'Mr. John Doe', subject: 'Science', topic: 'Physics', rating: '4.8', reviews: 95, price: 230, emoji: '👨‍🔬', status: 'approved', about: 'Physics tutor who makes tough concepts simple using real-life examples and experiments.', expertise: ['Physics', 'Chemistry', 'General Science'] },
  { id: 't3', accountId: null, name: 'Ms. Ana Reyes', subject: 'English', topic: 'Reading & Writing', rating: '4.7', reviews: 78, price: 200, emoji: '👩‍🎓', status: 'approved', about: 'Helps students improve grammar, reading comprehension and essay writing.', expertise: ['Grammar', 'Essay Writing', 'Reading'] },
];

const SUBJECTS_HOME = [
  { key: 'Math', icon: '📐' },
  { key: 'Science', icon: '🔬' },
  { key: 'English', icon: '📚' },
];

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '1:00 PM', '2:00 PM', '4:30 PM', '6:00 PM'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const normalizeEmail = (e) => String(e || '').trim().toLowerCase();
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => {
  if (!/^[0-9+\-\s]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 13;
};
const isStrongPassword = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);
const isValidDate = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return (
    d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 &&
    d.getDate() === +m[3] && d <= new Date()
  );
};

function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
const parseKey = (key) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));
const formatDate = (key) => {
  const d = parseKey(key);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
const peso = (n) => `₱${Number(n || 0).toLocaleString('en-US')}`;
const routeForRole = (role) =>
  (role === 'admin' ? 'AdminDashboard' : role === 'tutor' ? 'TutorDashboard' : 'Main');

const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const slotMinutes = (slot) => {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(slot);
  let h = Number(m[1]) % 12;
  if (m[3] === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};
// Slots a tutor has opened for a date. If the tutor never set that date, Mon-Fri defaults to all slots open.
const getOpenSlots = (tutor, dateKey) => {
  if (!tutor) return [];
  if (tutor.availability && Array.isArray(tutor.availability[dateKey])) return tutor.availability[dateKey];
  const day = parseKey(dateKey).getDay();
  return day >= 1 && day <= 5 ? TIME_SLOTS : [];
};
const isSlotPast = (dateKey, slot) => {
  const now = new Date();
  const todayKey = getDateKey(now);
  if (dateKey !== todayKey) return dateKey < todayKey;
  return slotMinutes(slot) <= now.getHours() * 60 + now.getMinutes();
};

// ==========================================
// APP CONTEXT (accounts, tutors, bookings, messages, saved on device)
// ==========================================
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS);
  const [tutors, setTutors] = useState(SEED_TUTORS);
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (Array.isArray(d.accounts) && d.accounts.length) setAccounts(d.accounts);
          if (Array.isArray(d.tutors)) setTutors(d.tutors);
          if (Array.isArray(d.bookings)) setBookings(d.bookings);
          if (Array.isArray(d.messages)) setMessages(d.messages);
          if (d.currentId) setCurrentId(d.currentId);
        }
      } catch (e) {
        console.warn('Could not load saved data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accounts, tutors, bookings, messages, currentId })
    ).catch((e) => console.warn('Could not save data', e));
  }, [ready, accounts, tutors, bookings, messages, currentId]);

  const user = useMemo(() => accounts.find((a) => a.id === currentId) || null, [accounts, currentId]);
  const approvedTutors = useMemo(() => tutors.filter((t) => t.status === 'approved'), [tutors]);
  const tutorProfile = useMemo(
    () => (user && user.role === 'tutor' ? tutors.find((t) => t.accountId === user.id) || null : null),
    [tutors, user]
  );
  const myBookings = useMemo(() => bookings.filter((b) => b.ownerId === currentId), [bookings, currentId]);

  const emailTaken = (email, exceptId) =>
    accounts.some((a) => a.id !== exceptId && normalizeEmail(a.email) === normalizeEmail(email));

  const login = (email, password) => {
    const found = accounts.find(
      (a) => normalizeEmail(a.email) === normalizeEmail(email) && a.password === password
    );
    if (!found) return null;
    setCurrentId(found.id);
    return found;
  };

  const logout = () => setCurrentId(null);

  const signup = (form) => {
    if (emailTaken(form.email)) return { ok: false, error: 'An account with this email already exists.' };
    const account = {
      ...form, role: 'student', id: `u${Date.now()}`,
      email: form.email.trim(), name: `${form.firstName} ${form.lastName}`.trim(),
    };
    setAccounts((prev) => [...prev, account]);
    return { ok: true, email: account.email };
  };

  const registerTutor = (form) => {
    if (emailTaken(form.email)) return { ok: false, error: 'An account with this email already exists.' };
    const accountId = `u${Date.now()}`;
    const expertise = form.topic.split(',').map((s) => s.trim()).filter(Boolean);
    setAccounts((prev) => [...prev, {
      id: accountId, role: 'tutor', name: form.name.trim(), email: form.email.trim(), password: form.password,
    }]);
    setTutors((prev) => [...prev, {
      id: `t${Date.now()}`, accountId, name: form.name.trim(), subject: form.subject,
      topic: expertise[0] || form.subject, rating: 'New', reviews: 0, price: Number(form.price),
      emoji: '🧑‍🏫', status: 'pending', about: form.about.trim(), expertise: expertise.length ? expertise : [form.subject],
    }]);
    setCurrentId(accountId);
    return { ok: true };
  };

  const updateProfile = ({ name, email, gradeLevel, school }) => {
    if (!name.trim()) return { ok: false, error: 'Name cannot be empty.' };
    if (!isValidEmail(email.trim())) return { ok: false, error: 'Please enter a valid email.' };
    if (emailTaken(email, currentId)) return { ok: false, error: 'That email is already used by another account.' };
    setAccounts((prev) => prev.map((a) => (a.id === currentId
      ? { ...a, name: name.trim(), email: email.trim(), gradeLevel: gradeLevel.trim(), school: school.trim() } : a)));
    return { ok: true };
  };

  const addBooking = ({ tutorId, date, time }) => {
    const tutor = tutors.find((t) => t.id === tutorId);
    if (!tutor) return { ok: false, error: 'Please choose a tutor.' };
    if (!getOpenSlots(tutor, date).includes(time) || isSlotPast(date, time)) {
      return { ok: false, error: 'The tutor is not available at that date and time.' };
    }
    const clash = bookings.some(
      (b) => b.tutorId === tutorId && b.date === date && b.time === time && b.status !== 'Declined'
    );
    if (clash) return { ok: false, error: 'That time slot is already taken. Please pick another.' };
    setBookings((prev) => [...prev, {
      id: `b${Date.now()}`, ownerId: currentId, studentName: user ? user.name : 'Student',
      tutorId, tutorName: tutor.name, price: tutor.price, date, time, status: 'Pending', paid: false, paidOut: false,
    }]);
    return { ok: true };
  };

  const setBookingStatus = (id, status) =>
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  const cancelBooking = (id) => setBookings((prev) => prev.filter((b) => b.id !== id));

  const markPaid = (id, paid) =>
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, paid, paidOut: paid ? !!b.paidOut : false } : b)));

  const payoutTutor = (tutorId) =>
    setBookings((prev) => prev.map((b) => (
      b.tutorId === tutorId && b.status === 'Confirmed' && b.paid && !b.paidOut ? { ...b, paidOut: true } : b)));

  const setTutorStatus = (tutorId, status) =>
    setTutors((prev) => prev.map((t) => (t.id === tutorId ? { ...t, status } : t)));

  const setAvailability = (tutorId, dateKeys, slots) =>
    setTutors((prev) => prev.map((t) => (t.id === tutorId
      ? { ...t, availability: { ...(t.availability || {}), ...Object.fromEntries(dateKeys.map((k) => [k, slots])) } }
      : t)));

  const removeStudent = (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setBookings((prev) => prev.filter((b) => b.ownerId !== id));
    setMessages((prev) => prev.filter((m) => !m.threadId.startsWith(`${id}:`)));
  };

  const removeTutor = (tutorId) => {
    const t = tutors.find((x) => x.id === tutorId);
    setTutors((prev) => prev.filter((x) => x.id !== tutorId));
    if (t && t.accountId) setAccounts((prev) => prev.filter((a) => a.id !== t.accountId));
    setBookings((prev) => prev.filter((b) => b.tutorId !== tutorId));
    setMessages((prev) => prev.filter((m) => !m.threadId.endsWith(`:${tutorId}`)));
  };

  const deleteMyAccount = (password) => {
    if (!user) return { ok: false, error: 'You are not logged in.' };
    if (user.role === 'admin') return { ok: false, error: 'The administrator account can’t be deleted.' };
    if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
    if (user.role === 'tutor' && tutorProfile) removeTutor(tutorProfile.id);
    else removeStudent(user.id);
    setCurrentId(null);
    return { ok: true };
  };

  const sendMessage = (threadId, text) => {
    if (!text.trim() || !currentId) return;
    setMessages((prev) => [...prev, {
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`, threadId, senderId: currentId, text: text.trim(), ts: Date.now(),
    }]);
  };

  return (
    <AppContext.Provider value={{
      ready, user, currentId, accounts, tutors, approvedTutors, tutorProfile,
      bookings, myBookings, messages,
      login, logout, signup, registerTutor, updateProfile,
      addBooking, setBookingStatus, cancelBooking, markPaid, payoutTutor,
      setTutorStatus, setAvailability, removeStudent, removeTutor, deleteMyAccount, sendMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

function useLogout(navigation) {
  const { logout } = useApp();
  return () => {
    logout();
    const nav = navigation.getParent() || navigation;
    nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };
}

function useDeleteAccount(navigation) {
  const { deleteMyAccount } = useApp();
  return (password) => {
    const res = deleteMyAccount(password);
    if (res.ok) {
      const nav = navigation.getParent() || navigation;
      nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
      Alert.alert('Account deleted', 'Your account and its data were removed.');
    }
    return res;
  };
}

// ==========================================
// SMALL REUSABLE PIECES
// ==========================================
function Field({ label, ...props }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#aaa" {...props} />
    </>
  );
}

function ChipGroup({ options, value, onSelect, multi = false, format }) {
  const isActive = (o) => (multi ? value.includes(o) : value === o);
  return (
    <View style={styles.optionRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[styles.optionChip, isActive(o) && styles.optionChipActive]}
          onPress={() => onSelect(o)}
        >
          <Text style={[styles.optionChipText, isActive(o) && styles.optionChipTextActive]}>
            {format ? format(o) : o}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Avatar({ emoji = '🧑‍🎓', size = 60 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || COLORS.gray;
  return (
    <View style={{ backgroundColor: `${color}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
      <Text style={{ color, fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' }}>{status}</Text>
    </View>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text numberOfLines={1} style={{ color: '#fff', fontSize: 12 }}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function SmallButton({ label, color = COLORS.primary, onPress }) {
  return (
    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.smallBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function FormScreen({ children, scrollRef }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.padding} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DashHeader({ title, subtitle, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerBg, { paddingTop: insets.top + 16 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subGreeting}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

function DeleteAccountModal({ visible, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) { setPassword(''); setError(''); }
  }, [visible]);

  const handleDelete = () => {
    if (!password) { setError('Please enter your password to confirm.'); return; }
    const res = onConfirm(password);
    if (!res.ok) setError(res.error);
    else onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.title, { color: COLORS.danger }]}>Delete Account</Text>
            <Text style={[styles.subtitle, { marginBottom: 15 }]}>
              This permanently removes your account, bookings and messages. It can’t be undone.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Field label="Enter your password to confirm" value={password} onChangeText={setPassword}
              secureTextEntry autoCapitalize="none" />
            <View style={{ flexDirection: 'row', marginTop: 5 }}>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginRight: 10, backgroundColor: COLORS.gray }]} onPress={onClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginLeft: 10, backgroundColor: COLORS.danger }]} onPress={handleDelete}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ==========================================
// 1. SPLASH
// ==========================================
function SplashScreen({ navigation }) {
  const { ready, user } = useApp();

  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => {
      navigation.replace(user ? routeForRole(user.role) : 'Login');
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar barStyle="light-content" />
      <Text style={{ fontSize: 80 }}>🎓</Text>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>BrightPath</Text>
      <Text style={{ color: '#e0f2e9', fontSize: 16 }}>Tutorial services</Text>
    </View>
  );
}

// ==========================================
// 2. LOGIN (students, tutors and admin all sign in here)
// ==========================================
function LoginScreen({ navigation, route }) {
  const { login } = useApp();
  const [email, setEmail] = useState(route.params?.prefilledEmail ?? '');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (route.params?.prefilledEmail) setEmail(route.params.prefilledEmail);
  }, [route.params?.prefilledEmail]);

  const handleLogin = () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    const account = login(email, password);
    if (account) {
      navigation.replace(routeForRole(account.role));
    } else {
      setErrorMessage('Invalid email or password.');
      setPassword('');
    }
  };

  return (
    <FormScreen>
      <Text style={styles.headerTitle}>🎓 BrightPath</Text>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Find your Tutor, Reach your goals</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Field label="Email" placeholder="✉️ Enter Email" value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Password" placeholder="🔒 Enter Password" value={password} onChangeText={setPassword}
        secureTextEntry autoCapitalize="none" onSubmitEditing={handleLogin} />

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{ marginTop: 15 }}>
        <Text style={styles.linkText}>
          Don't have an account? <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Sign up</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('TutorRegistration')} style={{ marginTop: 15 }}>
        <Text style={styles.linkText}>
          Want to teach? <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Sign up as Tutor</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>Demo accounts</Text>
        <Text style={styles.demoText}>Student: student@test.com / 123456</Text>
        <Text style={styles.demoText}>Tutor: trixie@test.com / tutor123</Text>
        <Text style={styles.demoText}>Admin: admin@brightpath.com / admin123</Text>
      </View>
    </FormScreen>
  );
}

// ==========================================
// 3. STUDENT SIGN UP
// ==========================================
const EMPTY_FORM = {
  firstName: '', middleName: '', lastName: '', gender: '', birthdate: '',
  gradeLevel: '', school: '', contactNumber: '', address: '',
  email: '', password: '', confirmPassword: '',
  mode: '', schedule: '', sessionsPerWeek: '',
  guardianName: '', guardianRelation: '', guardianContact: '', notes: '',
};

const SUBJECT_OPTIONS = [
  'Mathematics', 'English', 'Science', 'Filipino', 'Social Studies',
  'Computer / ICT', 'Reading & Writing', 'Others',
];

function SignUpScreen({ navigation }) {
  const { signup } = useApp();
  const scrollRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [subjects, setSubjects] = useState([]);
  const [otherSubject, setOtherSubject] = useState('');
  const [agree, setAgree] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleSubject = (s) =>
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const fail = (msg) => {
    setErrorMessage(msg);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSignUp = () => {
    setErrorMessage('');
    const required = [
      ['firstName', 'First name'], ['lastName', 'Last name'], ['gender', 'Sex / Gender'],
      ['birthdate', 'Date of birth'], ['gradeLevel', 'Grade level'], ['school', 'School'],
      ['contactNumber', 'Contact number'], ['address', 'Address'], ['email', 'Email'],
      ['password', 'Password'], ['confirmPassword', 'Confirm password'],
      ['mode', 'Tutorial mode'], ['schedule', 'Preferred schedule'],
      ['sessionsPerWeek', 'Sessions per week'], ['guardianName', 'Guardian name'],
      ['guardianContact', 'Guardian contact'],
    ];
    for (const [key, label] of required) {
      if (!String(form[key]).trim()) return fail(`${label} is required.`);
    }
    if (!isValidDate(form.birthdate.trim())) return fail('Date of birth must be a real date like 2010-05-21.');
    if (!isValidEmail(form.email.trim())) return fail('Please enter a valid email address.');
    if (!isValidPhone(form.contactNumber.trim()) || !isValidPhone(form.guardianContact.trim())) {
      return fail('Contact numbers must have 7–13 digits.');
    }
    if (!isStrongPassword(form.password)) return fail('Password must be at least 8 characters and include letters and numbers.');
    if (form.password !== form.confirmPassword) return fail('Passwords do not match.');
    if (subjects.length === 0) return fail('Please select at least one subject.');
    if (subjects.includes('Others') && !otherSubject.trim()) return fail('Please specify the other subject.');
    if (!agree) return fail('You must agree to the terms and policies.');

    const result = signup({ ...form, email: form.email.trim(), subjects, otherSubject: otherSubject.trim() });
    if (!result.ok) return fail(result.error);

    Alert.alert('Success', 'Account created! Please log in.');
    navigation.navigate('Login', { prefilledEmail: result.email });
  };

  return (
    <FormScreen scrollRef={scrollRef}>
      <Text style={styles.headerTitle}>🎓 BrightPath</Text>
      <Text style={styles.title}>Student Signup</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Text style={styles.sectionTitle}>1. Personal Information</Text>
      <Field label="First Name *" value={form.firstName} onChangeText={(v) => setField('firstName', v)} placeholder="Juan" />
      <Field label="Middle Name" value={form.middleName} onChangeText={(v) => setField('middleName', v)} placeholder="(optional)" />
      <Field label="Last Name *" value={form.lastName} onChangeText={(v) => setField('lastName', v)} placeholder="Dela Cruz" />

      <Text style={styles.label}>Sex / Gender *</Text>
      <ChipGroup options={['Male', 'Female', 'Prefer not to say']} value={form.gender} onSelect={(v) => setField('gender', v)} />

      <Field label="Date of Birth *" value={form.birthdate} onChangeText={(v) => setField('birthdate', v)} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
      <Field label="Grade Level *" value={form.gradeLevel} onChangeText={(v) => setField('gradeLevel', v)} placeholder="e.g. Grade 10" />
      <Field label="School *" value={form.school} onChangeText={(v) => setField('school', v)} placeholder="Name of school" />
      <Field label="Contact Number *" value={form.contactNumber} onChangeText={(v) => setField('contactNumber', v)} placeholder="09XX XXX XXXX" keyboardType="phone-pad" />
      <Field label="Home Address *" value={form.address} onChangeText={(v) => setField('address', v)}
        placeholder="House no., street, barangay, city" multiline style={[styles.input, { height: 90, textAlignVertical: 'top' }]} />

      <Text style={styles.sectionTitle}>2. Account Details</Text>
      <Field label="Email *" value={form.email} onChangeText={(v) => setField('email', v)} placeholder="student@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Password *" value={form.password} onChangeText={(v) => setField('password', v)} placeholder="Min 8 chars, letters + numbers" secureTextEntry autoCapitalize="none" />
      <Field label="Confirm Password *" value={form.confirmPassword} onChangeText={(v) => setField('confirmPassword', v)} placeholder="Re-type password" secureTextEntry autoCapitalize="none" />

      <Text style={styles.sectionTitle}>3. Tutorial Enrollment</Text>
      <Text style={styles.label}>Subjects *</Text>
      <ChipGroup options={SUBJECT_OPTIONS} value={subjects} onSelect={toggleSubject} multi />
      {subjects.includes('Others') && (
        <Field label="Specify Other Subject *" value={otherSubject} onChangeText={setOtherSubject} placeholder="e.g. Chemistry" />
      )}

      <Text style={styles.label}>Tutorial Mode *</Text>
      <ChipGroup options={['Face-to-Face', 'Online', 'Hybrid']} value={form.mode} onSelect={(v) => setField('mode', v)} />

      <Text style={styles.label}>Preferred Schedule *</Text>
      <ChipGroup options={['Weekdays Morning', 'Weekdays Afternoon', 'Weekdays Evening', 'Weekends']}
        value={form.schedule} onSelect={(v) => setField('schedule', v)} />

      <Text style={styles.label}>Sessions per Week *</Text>
      <ChipGroup options={['1', '2', '3', '4+']} value={form.sessionsPerWeek}
        onSelect={(v) => setField('sessionsPerWeek', v)} format={(n) => `${n}/week`} />

      <Field label="Learning Needs / Notes (optional)" value={form.notes} onChangeText={(v) => setField('notes', v)}
        placeholder="Anything the tutor should know" multiline style={[styles.input, { height: 90, textAlignVertical: 'top' }]} />

      <Text style={styles.sectionTitle}>4. Parent / Guardian</Text>
      <Field label="Guardian Full Name *" value={form.guardianName} onChangeText={(v) => setField('guardianName', v)} placeholder="Full name" />
      <Text style={styles.label}>Relationship</Text>
      <ChipGroup options={['Mother', 'Father', 'Guardian', 'Other']} value={form.guardianRelation} onSelect={(v) => setField('guardianRelation', v)} />
      <Field label="Guardian Contact Number *" value={form.guardianContact} onChangeText={(v) => setField('guardianContact', v)} placeholder="09XX XXX XXXX" keyboardType="phone-pad" />

      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, marginBottom: 15 }} onPress={() => setAgree((a) => !a)}>
        <View style={{
          width: 22, height: 22, borderRadius: 4, borderWidth: 2,
          borderColor: agree ? COLORS.primary : COLORS.gray, backgroundColor: agree ? COLORS.primary : '#fff',
          marginRight: 10, alignItems: 'center', justifyContent: 'center',
        }}>
          {agree && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
        </View>
        <Text style={{ flex: 1, color: COLORS.text, fontSize: 13 }}>
          I confirm the information is accurate and agree to BrightPath's terms and policies. *
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Create Student Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15 }}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Login</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('TutorRegistration')} style={{ marginTop: 20, marginBottom: 30 }}>
        <Text style={[styles.linkText, { color: COLORS.primary, fontWeight: 'bold' }]}>Sign up as Tutor</Text>
      </TouchableOpacity>
    </FormScreen>
  );
}

// ==========================================
// 4. TUTOR REGISTRATION
// ==========================================
function TutorRegistrationScreen({ navigation }) {
  const { registerTutor } = useApp();
  const scrollRef = useRef(null);
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', subject: '', topic: '', price: '', about: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const fail = (msg) => {
    setErrorMessage(msg);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleRegister = () => {
    setErrorMessage('');
    if (!f.name.trim()) return fail('Full name is required.');
    if (!isValidEmail(f.email.trim())) return fail('Please enter a valid email address.');
    if (!isStrongPassword(f.password)) return fail('Password must be at least 8 characters and include letters and numbers.');
    if (f.password !== f.confirm) return fail('Passwords do not match.');
    if (!f.subject) return fail('Please choose your main subject.');
    if (!f.topic.trim()) return fail('Please list your areas of expertise.');
    const price = Number(f.price);
    if (!f.price.trim() || Number.isNaN(price) || price < 50 || price > 5000) {
      return fail('Hourly rate must be a number between 50 and 5000.');
    }
    if (f.about.trim().length < 10) return fail('Please write a short intro about yourself (at least 10 characters).');

    const result = registerTutor({ ...f, price });
    if (!result.ok) return fail(result.error);
    Alert.alert('Application sent', 'An administrator will review your application. You can log in anytime to check its status.');
    navigation.replace('TutorDashboard');
  };

  return (
    <FormScreen scrollRef={scrollRef}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 18, marginBottom: 10 }}>⬅ Back</Text></TouchableOpacity>
      <Text style={styles.title}>Tutor Registration</Text>
      <Text style={styles.subtitle}>Apply to teach on BrightPath</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Text style={styles.sectionTitle}>Personal Details</Text>
      <Field label="Full Name *" value={f.name} onChangeText={(v) => set('name', v)} placeholder="e.g. Maria Santos" />
      <Field label="Email *" value={f.email} onChangeText={(v) => set('email', v)} placeholder="tutor@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Password *" value={f.password} onChangeText={(v) => set('password', v)} placeholder="Min 8 chars, letters + numbers" secureTextEntry autoCapitalize="none" />
      <Field label="Confirm Password *" value={f.confirm} onChangeText={(v) => set('confirm', v)} placeholder="Re-type password" secureTextEntry autoCapitalize="none" />

      <Text style={styles.sectionTitle}>Subject Expertise</Text>
      <Text style={styles.label}>Main Subject *</Text>
      <ChipGroup options={['Math', 'Science', 'English', 'Filipino', 'Other']} value={f.subject} onSelect={(v) => set('subject', v)} />
      <Field label="Specialties * (separate with commas)" value={f.topic} onChangeText={(v) => set('topic', v)} placeholder="e.g. Algebra, Calculus" />
      <Field label="Hourly Rate (₱) *" value={f.price} onChangeText={(v) => set('price', v)} placeholder="250" keyboardType="numeric" />
      <Field label="About You *" value={f.about} onChangeText={(v) => set('about', v)} placeholder="Experience, teaching style..." multiline
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]} />

      <Text style={styles.sectionTitle}>Verification</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={() => Alert.alert('Coming soon', 'ID upload needs the expo-image-picker package. For now the admin verifies applicants directly.')}>
        <Text style={{ color: COLORS.gray }}>📄 Upload Valid ID (coming soon)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register Now</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </FormScreen>
  );
}

// ==========================================
// 5. STUDENT HOME
// ==========================================
function HomeScreen({ navigation }) {
  const { user, approvedTutors } = useApp();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(null);

  const filteredTutors = approvedTutors.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) || t.topic.toLowerCase().includes(q);
    const matchesSubject = !subjectFilter || t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.headerBg, { paddingTop: insets.top + 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting} numberOfLines={1}>Hi, {user?.name?.trim() || 'Student'}!</Text>
              <Text style={styles.subGreeting}>Find your perfect tutor</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}><Avatar size={50} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.bodyPadding}>
          <View style={styles.searchContainer}>
            <TextInput placeholder="🔍 Search subject, Tutor..." style={styles.searchInput} value={search} onChangeText={setSearch} />
          </View>

          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.subjectRow}>
            {SUBJECTS_HOME.map((s) => (
              <TouchableOpacity key={s.key}
                style={[styles.subjectCard, subjectFilter === s.key && { backgroundColor: COLORS.primary }]}
                onPress={() => setSubjectFilter((cur) => (cur === s.key ? null : s.key))}>
                <Text style={styles.subjectIcon}>{s.icon}</Text>
                <Text style={[styles.subjectText, subjectFilter === s.key && { color: '#fff' }]}>{s.key}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{subjectFilter ? `${subjectFilter} Tutors` : 'Top Tutors'}</Text>
            {(subjectFilter || search) ? (
              <TouchableOpacity onPress={() => { setSubjectFilter(null); setSearch(''); }}>
                <Text style={styles.seeAllText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredTutors.length === 0 ? (
            <Text style={{ color: COLORS.gray, textAlign: 'center', marginVertical: 20 }}>No tutors found.</Text>
          ) : filteredTutors.map((t) => (
            <TouchableOpacity key={t.id} style={styles.tutorCard} onPress={() => navigation.navigate('TutorProfile', { tutorId: t.id })}>
              <View style={{ marginRight: 15 }}><Avatar emoji={t.emoji} /></View>
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>{t.name}</Text>
                <Text style={styles.tutorSubject}>{t.subject} • {t.topic}</Text>
                <Text style={styles.tutorRating}>⭐ {t.reviews ? `${t.rating} (${t.reviews} reviews)` : 'New tutor'}</Text>
              </View>
              <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Bookings', { tutorId: t.id })}>
                <Text style={styles.bookBtnText}>Book</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 6. TUTOR PROFILE (viewed by students)
// ==========================================
function TutorProfileScreen({ navigation, route }) {
  const { tutors } = useApp();
  const insets = useSafeAreaInsets();
  const tutor = tutors.find((t) => t.id === route.params?.tutorId);

  if (!tutor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.padding}>
          <Text style={styles.title}>Tutor not found</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={{ fontSize: 24, color: '#fff' }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.profileHeaderText}>Tutor Profile</Text>
        </View>

        <View style={styles.bodyPadding}>
          <View style={{ alignItems: 'center', marginTop: -50 }}>
            <View style={styles.profileLargeImage}><Text style={{ fontSize: 56 }}>{tutor.emoji}</Text></View>
            <Text style={styles.title}>{tutor.name}</Text>
            <Text style={styles.subtitle}>{tutor.subject} Tutor • ⭐ {tutor.reviews ? `${tutor.rating} (${tutor.reviews} reviews)` : 'New tutor'}</Text>
            {tutor.status === 'approved' ? (
              <View style={styles.availBadge}><Text style={{ color: COLORS.primary, fontSize: 12 }}>● Available</Text></View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={{ color: COLORS.gray, lineHeight: 22 }}>{tutor.about}</Text>

          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {tutor.expertise.map((e) => (
              <View key={e} style={styles.tag}><Text style={styles.tagText}>{e}</Text></View>
            ))}
          </View>

          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 25 }}>Price: {peso(tutor.price)}/hr</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: COLORS.gray }]}
              onPress={() => navigation.navigate('ChatRoom', { tutorId: tutor.id })}>
              <Text style={styles.buttonText}>💬 Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]}
              onPress={() => navigation.navigate('Main', { screen: 'Bookings', params: { tutorId: tutor.id } })}>
              <Text style={styles.buttonText}>Book Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 7. STUDENT BOOKINGS (calendar)
// ==========================================
function BookingCalendar({ prefillTutorId }) {
  const { myBookings, bookings: allBookings, approvedTutors, addBooking, cancelBooking } = useApp();
  const navigation = useNavigation();

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayKey = getDateKey(today);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [tutorId, setTutorId] = useState(prefillTutorId || null);
  const [time, setTime] = useState('');

  useEffect(() => { if (prefillTutorId) setTutorId(prefillTutorId); }, [prefillTutorId]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const selectedBookings = myBookings.filter((b) => b.date === selectedDate);
  const isPastDate = (key) => key < todayKey;
  const changeMonth = (amount) => setCurrentMonth(new Date(year, month + amount, 1));

  const selectedTutor = approvedTutors.find((t) => t.id === tutorId) || null;
  const isBookedSlot = (dateKey, slot) =>
    !!tutorId && allBookings.some((b) => b.tutorId === tutorId && b.date === dateKey && b.time === slot && b.status !== 'Declined');
  const slotState = (slot) => {
    if (!selectedTutor) return 'closed';
    if (isBookedSlot(selectedDate, slot)) return 'booked';
    if (!getOpenSlots(selectedTutor, selectedDate).includes(slot) || isSlotPast(selectedDate, slot)) return 'closed';
    return 'available';
  };
  const freeCount = (dateKey) => (selectedTutor
    ? getOpenSlots(selectedTutor, dateKey).filter((s) => !isBookedSlot(dateKey, s) && !isSlotPast(dateKey, s)).length
    : null);

  // clear the chosen time if it stops being available (different tutor or date)
  useEffect(() => {
    if (time && slotState(time) !== 'available') setTime('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, tutorId]);

  const handleAdd = () => {
    if (!tutorId) { Alert.alert('Choose a tutor', 'Please pick a tutor first.'); return; }
    if (!time) { Alert.alert('Choose a time', 'Please pick a time slot.'); return; }
    if (isPastDate(selectedDate)) { Alert.alert('Invalid Date', 'Please select today or a future date.'); return; }
    const res = addBooking({ tutorId, date: selectedDate, time });
    if (!res.ok) { Alert.alert('Could not book', res.error); return; }
    setTime('');
    Alert.alert('Request sent', 'Your tutor will confirm your session soon.');
  };

  const handleCancel = (id) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'Keep Booking', style: 'cancel' },
      { text: 'Cancel Booking', style: 'destructive', onPress: () => cancelBooking(id) },
    ]);
  };

  return (
    <View style={calendarStyles.container}>
      <Text style={calendarStyles.subtitle}>Choose a date to view or schedule a tutoring session.</Text>

      <View style={calendarStyles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={calendarStyles.monthButton}><Text style={calendarStyles.monthButtonText}>‹</Text></TouchableOpacity>
        <Text style={calendarStyles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={calendarStyles.monthButton}><Text style={calendarStyles.monthButtonText}>›</Text></TouchableOpacity>
      </View>

      <View style={calendarStyles.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <Text key={d} style={calendarStyles.weekDay}>{d}</Text>
        ))}
      </View>

      <View style={calendarStyles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) return <View key={`empty-${index}`} style={calendarStyles.dayCell} />;
          const dateKey = getDateKey(new Date(year, month, day));
          const isSelected = selectedDate === dateKey;
          const isToday = todayKey === dateKey;
          const isBooked = myBookings.some((b) => b.date === dateKey);
          const isPast = isPastDate(dateKey);
          const free = isPast ? null : freeCount(dateKey);
          return (
            <TouchableOpacity key={dateKey} disabled={isPast} onPress={() => setSelectedDate(dateKey)}
              style={[calendarStyles.dayCell, isSelected && calendarStyles.selectedDay,
                isToday && !isSelected && calendarStyles.todayDay, isPast && calendarStyles.pastDay,
                free === 0 && !isSelected && calendarStyles.noSlotDay]}>
              <Text style={[calendarStyles.dayText, isSelected && calendarStyles.selectedDayText, isPast && calendarStyles.pastDayText]}>{day}</Text>
              <View style={calendarStyles.dotRow}>
                {free > 0 && <View style={calendarStyles.freeDot} />}
                {isBooked && <View style={calendarStyles.bookingDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={calendarStyles.legend}>
        <View style={calendarStyles.legendItem}><View style={calendarStyles.todayLegend} /><Text style={calendarStyles.legendText}>Today</Text></View>
        <View style={calendarStyles.legendItem}><View style={calendarStyles.bookedLegend} /><Text style={calendarStyles.legendText}>My booking</Text></View>
        <View style={calendarStyles.legendItem}><View style={calendarStyles.freeLegend} /><Text style={calendarStyles.legendText}>Tutor free</Text></View>
      </View>

      <View style={calendarStyles.section}>
        <Text style={calendarStyles.sectionTitle}>{formatDate(selectedDate)}</Text>
        {selectedBookings.length > 0 ? selectedBookings.map((b) => (
          <View key={b.id} style={calendarStyles.bookingCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={calendarStyles.bookingTutor}>{b.tutorName}</Text>
              <StatusBadge status={b.status} />
            </View>
            <Text style={calendarStyles.bookingInfo}>
              Time: {b.time} • {peso(b.price)}{b.status === 'Confirmed' ? ` • ${b.paid ? 'Paid ✓' : 'Unpaid'}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <SmallButton label="Message Tutor" onPress={() => navigation.navigate('ChatRoom', { tutorId: b.tutorId })} />
              <TouchableOpacity style={calendarStyles.cancelButton}
                onPress={() => (b.paid
                  ? Alert.alert('Already paid', 'Paid sessions can’t be cancelled here. Please contact the administrator.')
                  : handleCancel(b.id))}>
                <Text style={calendarStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )) : <Text style={calendarStyles.emptyText}>No bookings for this date.</Text>}
      </View>

      <View style={calendarStyles.section}>
        <Text style={calendarStyles.sectionTitle}>Book a Tutor</Text>
        <Text style={styles.label}>Tutor</Text>
        <ChipGroup options={approvedTutors.map((t) => t.id)} value={tutorId} onSelect={setTutorId}
          format={(id) => (approvedTutors.find((t) => t.id === id) || {}).name || id} />

        <Text style={styles.label}>Time</Text>
        {!selectedTutor ? (
          <Text style={[calendarStyles.emptyText, { marginBottom: 15 }]}>Pick a tutor to see their available times.</Text>
        ) : (
          <>
            <Text style={[calendarStyles.emptyText, { marginBottom: 10 }]}>
              {freeCount(selectedDate)} free slot(s) on {formatDate(selectedDate)}. ✕ = already booked, faded = tutor unavailable.
            </Text>
            <View style={styles.optionRow}>
              {TIME_SLOTS.map((slot) => {
                const state = slotState(slot);
                const active = time === slot;
                return (
                  <TouchableOpacity key={slot} disabled={state !== 'available'} onPress={() => setTime(slot)}
                    style={[styles.optionChip, active && styles.optionChipActive, state !== 'available' && { opacity: 0.35 }]}>
                    <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {slot}{state === 'booked' ? ' ✕' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity style={[calendarStyles.addButton, isPastDate(selectedDate) && calendarStyles.disabledButton]}
          onPress={handleAdd} disabled={isPastDate(selectedDate)}>
          <Text style={calendarStyles.addButtonText}>+ Request Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BookingsScreen({ route }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>📅 My Bookings</Text>
          <BookingCalendar prefillTutorId={route.params?.tutorId} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 8. CHAT (student list + shared chat room)
// ==========================================
function ChatListScreen({ navigation }) {
  const { approvedTutors, messages, currentId } = useApp();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>💬 Messages</Text>
        <Text style={styles.subtitle}>Chat with a tutor about your sessions.</Text>
        {approvedTutors.map((t) => {
          const thread = messages.filter((m) => m.threadId === `${currentId}:${t.id}`);
          const last = thread[thread.length - 1];
          return (
            <TouchableOpacity key={t.id} style={styles.tutorCard} onPress={() => navigation.navigate('ChatRoom', { tutorId: t.id })}>
              <View style={{ marginRight: 15 }}><Avatar emoji={t.emoji} size={50} /></View>
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>{t.name}</Text>
                <Text style={styles.tutorSubject} numberOfLines={1}>{last ? last.text : 'Tap to start chatting'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChatRoomScreen({ navigation, route }) {
  const { user, currentId, tutors, accounts, messages, sendMessage } = useApp();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [text, setText] = useState('');

  const tutor = tutors.find((t) => t.id === route.params?.tutorId);
  const isTutor = user?.role === 'tutor';
  const studentId = isTutor ? route.params?.studentId : currentId;
  const student = accounts.find((a) => a.id === studentId);
  const threadId = `${studentId}:${route.params?.tutorId}`;
  const thread = messages.filter((m) => m.threadId === threadId);
  const title = isTutor ? (student ? student.name : 'Student') : (tutor ? tutor.name : 'Tutor');

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(threadId, text);
    setText('');
  };

  if (!tutor || !studentId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.padding}>
          <Text style={styles.title}>Conversation not found</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>Go Back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.chatHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22, color: '#fff' }}>⬅</Text></TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 16 }}>{title}</Text>
            <Text style={{ fontSize: 11, color: '#e0f2e9' }}>{isTutor ? 'Student' : `${tutor.subject} Tutor`}</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 20 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {thread.length === 0 ? (
            <Text style={{ color: COLORS.gray, textAlign: 'center', marginTop: 30 }}>No messages yet. Say hello! 👋</Text>
          ) : thread.map((m) => {
            const mine = m.senderId === currentId;
            return (
              <View key={m.id} style={mine ? styles.chatBubbleRight : styles.chatBubbleLeft}>
                <Text style={{ color: mine ? '#fff' : COLORS.text }}>{m.text}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.chatInputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput placeholder="Type a message..." style={styles.chatInput} value={text}
            onChangeText={setText} onSubmitEditing={handleSend} returnKeyType="send" />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}><Text style={{ color: '#fff' }}>➤</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ==========================================
// 9. STUDENT PROFILE (tab)
// ==========================================
function ProfileScreen({ navigation }) {
  const { user, updateProfile } = useApp();
  const doLogout = useLogout(navigation);
  const doDelete = useDeleteAccount(navigation);
  const [showDelete, setShowDelete] = useState(false);
  const insets = useSafeAreaInsets();
  const [isModalVisible, setModalVisible] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempGrade, setTempGrade] = useState('');
  const [tempSchool, setTempSchool] = useState('');
  const [modalError, setModalError] = useState('');

  const openEditModal = () => {
    setTempName(user?.name || '');
    setTempEmail(user?.email || '');
    setTempGrade(user?.gradeLevel || '');
    setTempSchool(user?.school || '');
    setModalError('');
    setModalVisible(true);
  };

  const handleSave = () => {
    const result = updateProfile({ name: tempName, email: tempEmail, gradeLevel: tempGrade, school: tempSchool });
    if (!result.ok) { setModalError(result.error); return; }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.profileHeaderText}>My Profile</Text>
        </View>

        <View style={styles.bodyPadding}>
          <View style={{ alignItems: 'center', marginTop: -50 }}>
            <View style={styles.profileLargeImage}><Text style={{ fontSize: 56 }}>🧑‍🎓</Text></View>
            <Text style={styles.title}>{user?.name || 'Student'}</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>
            <TouchableOpacity style={[styles.primaryButton, { width: '80%', marginTop: 5 }]} onPress={openEditModal}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Grade Level:</Text>
            <Text style={styles.detailValue}>{user?.gradeLevel || '—'}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>School:</Text>
            <Text style={[styles.detailValue, { flexShrink: 1, textAlign: 'right' }]}>{user?.school || '—'}</Text>
          </View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.danger, marginTop: 40 }]} onPress={doLogout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDelete(true)}>
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
          <DeleteAccountModal visible={showDelete} onClose={() => setShowDelete(false)} onConfirm={doDelete} />
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Edit Profile</Text>
              {modalError ? <Text style={styles.errorText}>{modalError}</Text> : null}
              <Field label="Full Name" value={tempName} onChangeText={setTempName} />
              <Field label="Email" value={tempEmail} onChangeText={setTempEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              <Field label="Grade Level" value={tempGrade} onChangeText={setTempGrade} />
              <Field label="School" value={tempSchool} onChangeText={setTempSchool} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginRight: 10, backgroundColor: COLORS.gray }]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ==========================================
// 10a. TUTOR AVAILABILITY CALENDAR
// ==========================================
function AvailabilityCalendar({ tutor }) {
  const { bookings, setAvailability } = useApp();

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayKey = getDateKey(today);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const live = bookings.filter((b) => b.tutorId === tutor.id && b.status !== 'Declined');
  const bookingFor = (dateKey, slot) => live.find((b) => b.date === dateKey && b.time === slot);
  const openSlots = getOpenSlots(tutor, selectedDate);
  const isPastDate = (key) => key < todayKey;
  const selectedIsPast = isPastDate(selectedDate);

  const save = (slots) => setAvailability(tutor.id, [selectedDate], TIME_SLOTS.filter((s) => slots.includes(s)));

  const toggleSlot = (slot) => {
    if (bookingFor(selectedDate, slot) || selectedIsPast) return;
    save(openSlots.includes(slot) ? openSlots.filter((s) => s !== slot) : [...openSlots, slot]);
  };

  const repeatWeekday = () => {
    const sel = parseKey(selectedDate);
    const keys = [];
    const total = new Date(sel.getFullYear(), sel.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= total; d += 1) {
      const dt = new Date(sel.getFullYear(), sel.getMonth(), d);
      const k = getDateKey(dt);
      if (dt.getDay() === sel.getDay() && k >= todayKey) keys.push(k);
    }
    setAvailability(tutor.id, keys, TIME_SLOTS.filter((s) => openSlots.includes(s)));
    Alert.alert('Saved', `Applied to every ${WEEKDAYS_FULL[sel.getDay()]} in ${MONTHS[sel.getMonth()]}.`);
  };

  return (
    <View style={styles.listCard}>
      <View style={calendarStyles.monthHeader}>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))} style={calendarStyles.monthButton}><Text style={calendarStyles.monthButtonText}>‹</Text></TouchableOpacity>
        <Text style={calendarStyles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))} style={calendarStyles.monthButton}><Text style={calendarStyles.monthButtonText}>›</Text></TouchableOpacity>
      </View>

      <View style={calendarStyles.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <Text key={d} style={calendarStyles.weekDay}>{d}</Text>)}
      </View>

      <View style={calendarStyles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) return <View key={`e-${index}`} style={calendarStyles.dayCell} />;
          const dateKey = getDateKey(new Date(year, month, day));
          const isSelected = selectedDate === dateKey;
          const isToday = todayKey === dateKey;
          const past = isPastDate(dateKey);
          const hasOpen = !past && getOpenSlots(tutor, dateKey).length > 0;
          const hasBooking = live.some((b) => b.date === dateKey);
          return (
            <TouchableOpacity key={dateKey} onPress={() => setSelectedDate(dateKey)}
              style={[calendarStyles.dayCell, isSelected && calendarStyles.selectedDay,
                isToday && !isSelected && calendarStyles.todayDay, past && calendarStyles.pastDay]}>
              <Text style={[calendarStyles.dayText, isSelected && calendarStyles.selectedDayText, past && calendarStyles.pastDayText]}>{day}</Text>
              <View style={calendarStyles.dotRow}>
                {hasOpen && <View style={calendarStyles.freeDot} />}
                {hasBooking && <View style={calendarStyles.bookingDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={calendarStyles.legend}>
        <View style={calendarStyles.legendItem}><View style={calendarStyles.freeLegend} /><Text style={calendarStyles.legendText}>Available</Text></View>
        <View style={calendarStyles.legendItem}><View style={calendarStyles.bookedLegend} /><Text style={calendarStyles.legendText}>Has booking</Text></View>
      </View>

      <Text style={[styles.listTitle, { marginTop: 5, marginBottom: 4 }]}>{formatDate(selectedDate)}</Text>
      <Text style={[styles.listSub, { marginBottom: 10 }]}>
        {selectedIsPast ? 'Past dates can’t be changed.' : 'Tap a time to switch it between available and unavailable.'}
      </Text>

      {TIME_SLOTS.map((slot) => {
        const b = bookingFor(selectedDate, slot);
        const open = openSlots.includes(slot);
        let label = 'Unavailable';
        let color = COLORS.gray;
        if (b) { label = `Booked • ${b.studentName} (${b.status})`; color = COLORS.blue; }
        else if (open) { label = 'Available'; color = COLORS.primary; }
        return (
          <TouchableOpacity key={slot} disabled={!!b || selectedIsPast} onPress={() => toggleSlot(slot)}
            style={[styles.slotRow, { borderColor: color }, selectedIsPast && { opacity: 0.5 }]}>
            <Text style={styles.slotTime}>{slot}</Text>
            <Text style={{ color, fontWeight: 'bold', fontSize: 12, flexShrink: 1, textAlign: 'right' }}>{label}</Text>
          </TouchableOpacity>
        );
      })}

      {!selectedIsPast && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <SmallButton label="Open all" onPress={() => save(TIME_SLOTS)} />
          <SmallButton label="Close all" color={COLORS.gray} onPress={() => save([])} />
          <SmallButton label={`Repeat every ${WEEKDAYS_FULL[parseKey(selectedDate).getDay()]}`} color={COLORS.blue} onPress={repeatWeekday} />
        </View>
      )}
    </View>
  );
}

// ==========================================
// 10. TUTOR DASHBOARD
// ==========================================
function TutorDashboardScreen({ navigation }) {
  const { user, tutorProfile, bookings, messages, accounts, setBookingStatus } = useApp();
  const doLogout = useLogout(navigation);
  const doDelete = useDeleteAccount(navigation);
  const [showDelete, setShowDelete] = useState(false);

  const mine = tutorProfile ? bookings.filter((b) => b.tutorId === tutorProfile.id) : [];
  const pending = mine.filter((b) => b.status === 'Pending');
  const confirmed = mine.filter((b) => b.status === 'Confirmed');
  const sumPrice = (list) => list.reduce((t, b) => t + Number(b.price || 0), 0);
  const paidList = confirmed.filter((b) => b.paid);
  const earnings = sumPrice(paidList);
  const readyPayout = sumPrice(paidList.filter((b) => !b.paidOut));
  const paidOutTotal = sumPrice(paidList.filter((b) => b.paidOut));
  const awaitingPayment = sumPrice(confirmed.filter((b) => !b.paid));
  const todayKey = getDateKey(new Date());
  const upcoming = confirmed.filter((b) => b.date >= todayKey).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  // sessions by day of week for the chart
  const counts = [0, 0, 0, 0, 0, 0, 0];
  confirmed.forEach((b) => { counts[parseKey(b.date).getDay()] += 1; });
  const maxCount = Math.max(1, ...counts);

  // message threads that belong to this tutor
  const threads = useMemo(() => {
    if (!tutorProfile) return [];
    const map = {};
    messages.forEach((m) => {
      if (m.threadId.endsWith(`:${tutorProfile.id}`)) map[m.threadId] = m;
    });
    return Object.keys(map).map((threadId) => {
      const studentId = threadId.split(':')[0];
      const st = accounts.find((a) => a.id === studentId);
      return { threadId, studentId, name: st ? st.name : 'Student', last: map[threadId] };
    });
  }, [messages, accounts, tutorProfile]);

  const confirmDecline = (b) => {
    Alert.alert('Decline request', `Decline ${b.studentName}'s request?`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => setBookingStatus(b.id, 'Declined') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <DashHeader title={user?.name || 'Tutor'} subtitle={`Tutor Dashboard${tutorProfile ? ` • ${tutorProfile.subject}` : ''}`}
          right={<Avatar emoji={tutorProfile?.emoji || '🧑‍🏫'} size={50} />} />

        <View style={styles.bodyPadding}>
          {tutorProfile && tutorProfile.status !== 'approved' ? (
            <View style={[styles.notice, { borderColor: STATUS_COLORS[tutorProfile.status] }]}>
              <Text style={{ fontWeight: 'bold', color: STATUS_COLORS[tutorProfile.status] }}>
                {tutorProfile.status === 'pending' ? '⏳ Application under review' : '❌ Application declined'}
              </Text>
              <Text style={{ color: COLORS.gray, marginTop: 4 }}>
                {tutorProfile.status === 'pending'
                  ? 'Students can book you once an administrator approves your profile.'
                  : 'Please contact the administrator for more information.'}
              </Text>
            </View>
          ) : null}

          <View style={styles.statRow}>
            <StatCard label="Earnings (paid)" value={peso(earnings)} color={COLORS.primary} />
            <StatCard label="Sessions" value={String(confirmed.length)} color={COLORS.blue} />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Pending Requests" value={String(pending.length)} color={COLORS.orange} />
            <StatCard label="Upcoming" value={String(upcoming.length)} color="#8e6bbf" />
          </View>

          <Text style={styles.sectionTitle}>Booking Requests</Text>
          {pending.length === 0 ? <Text style={styles.emptyText}>No pending requests.</Text> : pending.map((b) => (
            <View key={b.id} style={styles.listCard}>
              <Text style={styles.listTitle}>{b.studentName}</Text>
              <Text style={styles.listSub}>{formatDate(b.date)} • {b.time} • {peso(b.price)}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <SmallButton label="Confirm" onPress={() => setBookingStatus(b.id, 'Confirmed')} />
                <SmallButton label="Decline" color={COLORS.danger} onPress={() => confirmDecline(b)} />
              </View>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          {upcoming.length === 0 ? <Text style={styles.emptyText}>No upcoming sessions.</Text> : upcoming.map((b) => (
            <View key={b.id} style={styles.listCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.listTitle}>{b.studentName}</Text>
                <StatusBadge status={b.status} />
              </View>
              <Text style={styles.listSub}>{formatDate(b.date)} • {b.time}</Text>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <SmallButton label="Message" onPress={() => navigation.navigate('ChatRoom', { tutorId: tutorProfile.id, studentId: b.ownerId })} />
              </View>
            </View>
          ))}

          {tutorProfile ? (
            <>
              <Text style={styles.sectionTitle}>My Availability</Text>
              <Text style={[styles.emptyText, { marginBottom: 10 }]}>
                Students can only book times you mark as available. Days you haven't set are open Monday to Friday by default.
              </Text>
              <AvailabilityCalendar tutor={tutorProfile} />
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Sessions by Day</Text>
          <View style={styles.chartBox}>
            {counts.map((c, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 11, color: COLORS.gray }}>{c}</Text>
                <View style={{ width: 18, height: 8 + (c / maxCount) * 70, backgroundColor: c ? COLORS.primary : '#dfe9e2', borderRadius: 4, marginVertical: 4 }} />
                <Text style={{ fontSize: 11, color: COLORS.gray }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Messages</Text>
          {threads.length === 0 ? <Text style={styles.emptyText}>No messages yet.</Text> : threads.map((t) => (
            <TouchableOpacity key={t.threadId} style={styles.listCard}
              onPress={() => navigation.navigate('ChatRoom', { tutorId: tutorProfile.id, studentId: t.studentId })}>
              <Text style={styles.listTitle}>{t.name}</Text>
              <Text style={styles.listSub} numberOfLines={1}>{t.last.text}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Payouts</Text>
          <View style={styles.listCard}>
            <View style={styles.rowBetween}><Text style={styles.listSub}>Ready to be paid out</Text><Text style={styles.listTitle}>{peso(readyPayout)}</Text></View>
            <View style={[styles.rowBetween, { marginTop: 8 }]}><Text style={styles.listSub}>Already paid out</Text><Text style={styles.listTitle}>{peso(paidOutTotal)}</Text></View>
            <View style={[styles.rowBetween, { marginTop: 8 }]}><Text style={styles.listSub}>Waiting for student payment</Text><Text style={styles.listTitle}>{peso(awaitingPayment)}</Text></View>
          </View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.danger, marginTop: 20 }]} onPress={doLogout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDelete(true)}>
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
          <DeleteAccountModal visible={showDelete} onClose={() => setShowDelete(false)} onConfirm={doDelete} />
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 11. ADMIN DASHBOARD
// ==========================================
function AdminDashboardScreen({ navigation }) {
  const { accounts, tutors, bookings, setTutorStatus, removeStudent, removeTutor, markPaid, payoutTutor } = useApp();
  const doLogout = useLogout(navigation);
  const [tab, setTab] = useState('Overview');

  const students = accounts.filter((a) => a.role === 'student');
  const approved = tutors.filter((t) => t.status === 'approved');
  const pendingTutors = tutors.filter((t) => t.status === 'pending');
  const confirmed = bookings.filter((b) => b.status === 'Confirmed');
  const sumPrice = (list) => list.reduce((t, b) => t + Number(b.price || 0), 0);
  const paidSessions = confirmed.filter((b) => b.paid);
  const revenue = sumPrice(paidSessions);
  const outstanding = sumPrice(confirmed.filter((b) => !b.paid));
  const owed = sumPrice(paidSessions.filter((b) => !b.paidOut));
  const paidOutTotal = sumPrice(paidSessions.filter((b) => b.paidOut));
  const payoutRows = tutors
    .map((t) => ({ t, amount: sumPrice(paidSessions.filter((b) => b.tutorId === t.id && !b.paidOut)) }))
    .filter((r) => r.amount > 0);

  const confirmPayout = (t, amount) => {
    Alert.alert('Mark payout done', `Confirm that you paid ${peso(amount)} to ${t.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => payoutTutor(t.id) },
    ]);
  };

  const confirmRemoveStudent = (s) => {
    Alert.alert('Remove student', `Remove ${s.name} and their bookings and messages?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeStudent(s.id) },
    ]);
  };
  const confirmRemoveTutor = (t) => {
    Alert.alert('Remove tutor', `Remove ${t.name}, their bookings and messages?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeTutor(t.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <DashHeader title="👑 Admin Dashboard" subtitle="Manage your platform" />

        <View style={styles.bodyPadding}>
          <View style={{ marginTop: 15 }}>
            <ChipGroup options={['Overview', 'Students', 'Tutors', 'Payments']} value={tab} onSelect={setTab}
              format={(t) => (t === 'Tutors' && pendingTutors.length ? `Tutors (${pendingTutors.length})` : t)} />
          </View>

          {tab === 'Overview' && (
            <>
              <View style={styles.statRow}>
                <StatCard label="Total Students" value={String(students.length)} color={COLORS.blue} />
                <StatCard label="Active Tutors" value={String(approved.length)} color={COLORS.primary} />
              </View>
              <View style={styles.statRow}>
                <StatCard label="Pending Tutors" value={String(pendingTutors.length)} color={COLORS.orange} />
                <StatCard label="Total Bookings" value={String(bookings.length)} color="#8e6bbf" />
              </View>
              <View style={[styles.statCard, { backgroundColor: COLORS.orange, width: '100%', marginTop: 15, marginBottom: 15 }]}>
                <Text style={{ color: '#fff', fontSize: 12 }}>Total Revenue (paid sessions)</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#fff', fontWeight: 'bold', fontSize: 28, marginTop: 4 }}>{peso(revenue)}</Text>
              </View>

              <Text style={styles.sectionTitle}>Management</Text>
              {[['👨‍🎓 Manage Students', 'Students'], ['👩‍🏫 Manage Tutors', 'Tutors'], ['💳 Payouts & Payments', 'Payments']].map(([label, target]) => (
                <TouchableOpacity key={target} style={styles.adminMenuButton} onPress={() => setTab(target)}>
                  <Text style={styles.adminMenuText}>{label}</Text>
                  <Text style={{ color: COLORS.gray }}>➔</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {tab === 'Students' && (
            <>
              <Text style={styles.sectionTitle}>Students ({students.length})</Text>
              {students.length === 0 ? <Text style={styles.emptyText}>No students yet.</Text> : students.map((s) => (
                <View key={s.id} style={styles.listCard}>
                  <Text style={styles.listTitle}>{s.name}</Text>
                  <Text style={styles.listSub}>{s.email}</Text>
                  <Text style={styles.listSub}>{[s.gradeLevel, s.school].filter(Boolean).join(' • ')}</Text>
                  <Text style={styles.listSub}>Bookings: {bookings.filter((b) => b.ownerId === s.id).length}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <SmallButton label="Remove" color={COLORS.danger} onPress={() => confirmRemoveStudent(s)} />
                  </View>
                </View>
              ))}
            </>
          )}

          {tab === 'Tutors' && (
            <>
              <Text style={styles.sectionTitle}>Tutors ({tutors.length})</Text>
              {tutors.length === 0 ? <Text style={styles.emptyText}>No tutors yet.</Text> : tutors.map((t) => (
                <View key={t.id} style={styles.listCard}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.listTitle, { flex: 1 }]}>{t.name}</Text>
                    <StatusBadge status={t.status} />
                  </View>
                  <Text style={styles.listSub}>{t.subject} • {t.topic} • {peso(t.price)}/hr</Text>
                  <Text style={styles.listSub} numberOfLines={2}>{t.about}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {t.status !== 'approved' && <SmallButton label="Approve" onPress={() => setTutorStatus(t.id, 'approved')} />}
                    {t.status !== 'rejected' && <SmallButton label="Reject" color={COLORS.orange} onPress={() => setTutorStatus(t.id, 'rejected')} />}
                    <SmallButton label="Remove" color={COLORS.danger} onPress={() => confirmRemoveTutor(t)} />
                  </View>
                </View>
              ))}
            </>
          )}

          {tab === 'Payments' && (
            <>
              <View style={styles.statRow}>
                <StatCard label="Collected" value={peso(revenue)} color={COLORS.primary} />
                <StatCard label="Outstanding" value={peso(outstanding)} color={COLORS.orange} />
              </View>
              <View style={styles.statRow}>
                <StatCard label="Owed to Tutors" value={peso(owed)} color={COLORS.blue} />
                <StatCard label="Paid Out" value={peso(paidOutTotal)} color="#8e6bbf" />
              </View>

              <Text style={styles.sectionTitle}>Tutor Payouts</Text>
              {payoutRows.length === 0 ? <Text style={styles.emptyText}>No payouts due right now.</Text> : payoutRows.map(({ t, amount }) => (
                <View key={t.id} style={styles.listCard}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.listTitle, { flex: 1 }]}>{t.name}</Text>
                    <Text style={styles.listTitle}>{peso(amount)}</Text>
                  </View>
                  <Text style={styles.listSub}>Ready to be paid out</Text>
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <SmallButton label="Mark Payout Done" onPress={() => confirmPayout(t, amount)} />
                  </View>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Sessions ({confirmed.length})</Text>
              {confirmed.length === 0 ? <Text style={styles.emptyText}>No confirmed sessions yet.</Text> : confirmed.map((b) => (
                <View key={b.id} style={styles.listCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.listTitle}>{peso(b.price)}</Text>
                    <StatusBadge status={b.paid ? (b.paidOut ? 'Paid out' : 'Paid') : 'Unpaid'} />
                  </View>
                  <Text style={styles.listSub}>{b.studentName} → {b.tutorName}</Text>
                  <Text style={styles.listSub}>{formatDate(b.date)} • {b.time}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    {!b.paid && <SmallButton label="Mark as Paid" onPress={() => markPaid(b.id, true)} />}
                    {b.paid && !b.paidOut && <SmallButton label="Mark Unpaid" color={COLORS.gray} onPress={() => markPaid(b.id, false)} />}
                    {b.paidOut && <Text style={styles.listSub}>Already paid out to the tutor.</Text>}
                  </View>
                </View>
              ))}
            </>
          )}

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.danger, marginTop: 30 }]} onPress={doLogout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// NAVIGATION
// ==========================================
function MainTabs() {
  const insets = useSafeAreaInsets();
  const icon = (emoji) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarLabelStyle: { fontSize: 12 },
      tabBarStyle: { height: 56 + insets.bottom, paddingBottom: insets.bottom + 4, paddingTop: 6 },
    }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ tabBarIcon: icon('📅') }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarIcon: icon('💬') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="TutorRegistration" component={TutorRegistrationScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
            <Stack.Screen name="TutorDashboard" component={TutorDashboardScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  padding: { paddingHorizontal: 24, justifyContent: 'center', flexGrow: 1, paddingVertical: 20 },
  bodyPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: COLORS.primary },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
  primaryButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { textAlign: 'center', color: COLORS.gray, fontSize: 14 },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center', fontWeight: 'bold' },
  emptyText: { color: COLORS.gray, fontSize: 14, marginBottom: 8 },

  demoBox: { marginTop: 30, backgroundColor: '#f1f8f4', padding: 14, borderRadius: 10 },
  demoTitle: { fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  demoText: { color: COLORS.gray, fontSize: 12, marginTop: 2 },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  optionChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: COLORS.lightGray, borderWidth: 1, borderColor: '#e0e0e0' },
  optionChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionChipText: { color: COLORS.text, fontSize: 13 },
  optionChipTextActive: { color: '#fff', fontWeight: 'bold' },

  headerBg: { backgroundColor: COLORS.primary, padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: '#e0f2e9', marginTop: 4 },
  searchContainer: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, marginTop: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  searchInput: { fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: COLORS.text },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectCard: { backgroundColor: '#e8f5e9', padding: 15, borderRadius: 10, alignItems: 'center', width: '30%' },
  subjectIcon: { fontSize: 24, marginBottom: 5 },
  subjectText: { fontWeight: 'bold', color: COLORS.primary },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  seeAllText: { color: COLORS.primary, fontWeight: 'bold' },
  tutorCard: { backgroundColor: '#fff', flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#eee' },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  tutorSubject: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  tutorRating: { fontSize: 12, color: '#f39c12', marginTop: 4, fontWeight: 'bold' },
  bookBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  profileHeader: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 60 },
  backButton: { marginRight: 15 },
  profileHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileLargeImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff', backgroundColor: '#e8f5e9', marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  availBadge: { backgroundColor: '#e0f2e9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, marginBottom: 10 },
  tag: { backgroundColor: '#e8f5e9', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  tagText: { color: COLORS.primary, fontWeight: 'bold' },

  detailCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, padding: 15, borderRadius: 10, marginBottom: 10 },
  detailLabel: { fontSize: 16, color: COLORS.gray },
  detailValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 25, elevation: 5 },

  uploadBox: { borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 15 },

  // chat
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 12, backgroundColor: COLORS.primary },
  chatBubbleLeft: { backgroundColor: '#f0f0f0', padding: 14, borderRadius: 12, alignSelf: 'flex-start', maxWidth: '80%', marginBottom: 12 },
  chatBubbleRight: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignSelf: 'flex-end', maxWidth: '80%', marginBottom: 12 },
  chatInputContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingTop: 12, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  chatInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 },
  sendButton: { backgroundColor: COLORS.primary, width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

  // dashboards
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  statCard: { width: '48%', padding: 16, borderRadius: 12, minHeight: 80, justifyContent: 'center' },
  listCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  listSub: { fontSize: 13, color: COLORS.gray, marginTop: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  smallBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  notice: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginTop: 15, backgroundColor: '#fffdf7' },
  chartBox: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14, minHeight: 120 },
  adminMenuButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  adminMenuText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  slotTime: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  deleteBtn: { marginTop: 12, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.danger },
  deleteBtnText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 15 },
});

const calendarStyles = StyleSheet.create({
  container: { backgroundColor: '#fff', paddingVertical: 8, borderRadius: 12 },
  subtitle: { fontSize: 14, color: '#777', marginBottom: 20, textAlign: 'center' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  monthButton: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  monthButtonText: { fontSize: 26, color: '#333' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDay: { width: '14.28%', textAlign: 'center', fontWeight: 'bold', color: '#777', fontSize: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 4 },
  dayText: { fontSize: 14, color: '#222' },
  selectedDay: { backgroundColor: '#4CAF50' },
  selectedDayText: { color: '#fff', fontWeight: 'bold' },
  todayDay: { borderWidth: 1, borderColor: '#4CAF50' },
  pastDay: { opacity: 0.35 },
  pastDayText: { color: '#999' },
  bookingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2196F3' },
  freeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4CAF50' },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 2, height: 5 },
  noSlotDay: { opacity: 0.5 },
  freeLegend: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayLegend: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#4CAF50' },
  bookedLegend: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2196F3' },
  legendText: { fontSize: 12, color: '#777' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 14, marginBottom: 8 },
  bookingCard: { backgroundColor: '#f4f8f4', borderRadius: 8, padding: 12, marginBottom: 10 },
  bookingTutor: { fontSize: 16, fontWeight: 'bold', color: '#222', flex: 1 },
  bookingInfo: { fontSize: 14, color: '#666', marginTop: 5 },
  cancelButton: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#ffebee', borderRadius: 8 },
  cancelButtonText: { color: '#c62828', fontWeight: 'bold', fontSize: 12 },
  addButton: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center' },
  disabledButton: { opacity: 0.4 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});