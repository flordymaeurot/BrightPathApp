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
import { NavigationContainer, CommonActions } from '@react-navigation/native';
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
};

const STORAGE_KEY = 'BrightPath_v1';

const DEFAULT_ACCOUNT = {
  id: 'default',
  firstName: 'Student',
  lastName: '',
  name: 'Student',
  email: 'admin@test.com',
  password: '123456',
  gradeLevel: 'Grade 10',
  school: 'BrightPath High',
};

const TUTORS = [
  { id: 't1', name: 'Ms. Trixie Morales', subject: 'Math', topic: 'Algebra', rating: '4.9', reviews: 120, price: 250, emoji: '👩‍🏫', about: 'Enjoys helping students master math with over 8 years of experience. Specializes in Algebra and Calculus.', expertise: ['Algebra', 'Calculus', 'Statistics'] },
  { id: 't2', name: 'Mr. John Doe', subject: 'Science', topic: 'Physics', rating: '4.8', reviews: 95, price: 230, emoji: '👨‍🔬', about: 'Physics tutor who makes tough concepts simple using real-life examples and experiments.', expertise: ['Physics', 'Chemistry', 'General Science'] },
  { id: 't3', name: 'Ms. Ana Reyes', subject: 'English', topic: 'Reading & Writing', rating: '4.7', reviews: 78, price: 200, emoji: '👩‍🎓', about: 'Helps students improve grammar, reading comprehension and essay writing.', expertise: ['Grammar', 'Essay Writing', 'Reading'] },
];

const SUBJECTS_HOME = [
  { key: 'Math', icon: '📐' },
  { key: 'Science', icon: '🔬' },
  { key: 'English', icon: '📚' },
];

const normalizeEmail = (e) => String(e || '').trim().toLowerCase();
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => {
  if (!/^[0-9+\-\s]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 13;
};
const isValidDate = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return (
    d.getFullYear() === +m[1] &&
    d.getMonth() === +m[2] - 1 &&
    d.getDate() === +m[3] &&
    d <= new Date()
  );
};
const isValidTime = (v) => /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM)$/i.test(v.trim());

function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ==========================================
// APP CONTEXT (accounts, session, bookings + saved on device)
// ==========================================
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState([DEFAULT_ACCOUNT]);
  const [currentId, setCurrentId] = useState(null);
  const [bookings, setBookings] = useState([]);

  // Load saved data once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data.accounts) && data.accounts.length) setAccounts(data.accounts);
          if (Array.isArray(data.bookings)) setBookings(data.bookings);
          if (data.currentId) setCurrentId(data.currentId);
        }
      } catch (e) {
        console.warn('Could not load saved data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Save whenever something changes
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accounts, bookings, currentId })
    ).catch((e) => console.warn('Could not save data', e));
  }, [ready, accounts, bookings, currentId]);

  const user = useMemo(
    () => accounts.find((a) => a.id === currentId) || null,
    [accounts, currentId]
  );

  const userBookings = useMemo(
    () => bookings.filter((b) => b.ownerId === currentId),
    [bookings, currentId]
  );

  const login = (email, password) => {
    const found = accounts.find(
      (a) => normalizeEmail(a.email) === normalizeEmail(email) && a.password === password
    );
    if (!found) return false;
    setCurrentId(found.id);
    return true;
  };

  const logout = () => setCurrentId(null);

  const signup = (form) => {
    if (accounts.some((a) => normalizeEmail(a.email) === normalizeEmail(form.email))) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const account = {
      ...form,
      id: `u${Date.now()}`,
      email: form.email.trim(),
      name: `${form.firstName} ${form.lastName}`.trim(),
    };
    setAccounts((prev) => [...prev, account]);
    return { ok: true, email: account.email };
  };

  const updateProfile = ({ name, email, gradeLevel, school }) => {
    if (!name.trim()) return { ok: false, error: 'Name cannot be empty.' };
    if (!isValidEmail(email.trim())) return { ok: false, error: 'Please enter a valid email.' };
    const clash = accounts.some(
      (a) => a.id !== currentId && normalizeEmail(a.email) === normalizeEmail(email)
    );
    if (clash) return { ok: false, error: 'That email is already used by another account.' };
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentId
          ? { ...a, name: name.trim(), email: email.trim(), gradeLevel: gradeLevel.trim(), school: school.trim() }
          : a
      )
    );
    return { ok: true };
  };

  const addBooking = ({ date, tutor, time }) => {
    setBookings((prev) => [
      ...prev,
      { id: `${Date.now()}`, ownerId: currentId, date, tutor, time },
    ]);
  };

  const cancelBooking = (id) => setBookings((prev) => prev.filter((b) => b.id !== id));

  return (
    <AppContext.Provider
      value={{
        ready, user, currentId, bookings: userBookings,
        login, logout, signup, updateProfile, addBooking, cancelBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
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
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: '#e8f5e9',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

function FormScreen({ children, scrollRef }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.padding}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 1. SPLASH
// ==========================================
function SplashScreen({ navigation }) {
  const { ready, currentId } = useApp();

  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => {
      navigation.replace(currentId ? 'Main' : 'Login');
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
// 2. LOGIN
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
    if (login(email, password)) {
      navigation.replace('Main');
    } else {
      setErrorMessage('Invalid email or password.');
      setPassword('');
    }
  };

  return (
    <FormScreen>
      <Text style={styles.headerTitle}>🎓 BrightPath</Text>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Field
        label="Email" placeholder="Enter Email" value={email}
        onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
      />
      <Field
        label="Password" placeholder="Enter Password" value={password}
        onChangeText={setPassword} secureTextEntry autoCapitalize="none"
        onSubmitEditing={handleLogin}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{ marginTop: 15 }}>
        <Text style={styles.linkText}>
          Don't have an account? <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Sign up</Text>
        </Text>
      </TouchableOpacity>

      <Text style={[styles.linkText, { marginTop: 30, fontSize: 12 }]}>
        Demo account: admin@test.com / 123456
      </Text>
    </FormScreen>
  );
}

// ==========================================
// 3. SIGN UP
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
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      return fail('Password must be at least 8 characters and include letters and numbers.');
    }
    if (form.password !== form.confirmPassword) return fail('Passwords do not match.');
    if (subjects.length === 0) return fail('Please select at least one subject.');
    if (subjects.includes('Others') && !otherSubject.trim()) return fail('Please specify the other subject.');
    if (!agree) return fail('You must agree to the terms and policies.');

    const result = signup({
      ...form,
      email: form.email.trim(),
      subjects,
      otherSubject: otherSubject.trim(),
    });
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
      <Field
        label="Home Address *" value={form.address} onChangeText={(v) => setField('address', v)}
        placeholder="House no., street, barangay, city" multiline
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
      />

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
      <ChipGroup
        options={['Weekdays Morning', 'Weekdays Afternoon', 'Weekdays Evening', 'Weekends']}
        value={form.schedule} onSelect={(v) => setField('schedule', v)}
      />

      <Text style={styles.label}>Sessions per Week *</Text>
      <ChipGroup
        options={['1', '2', '3', '4+']} value={form.sessionsPerWeek}
        onSelect={(v) => setField('sessionsPerWeek', v)} format={(n) => `${n}/week`}
      />

      <Field
        label="Learning Needs / Notes (optional)" value={form.notes}
        onChangeText={(v) => setField('notes', v)} placeholder="Anything the tutor should know" multiline
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
      />

      <Text style={styles.sectionTitle}>4. Parent / Guardian</Text>
      <Field label="Guardian Full Name *" value={form.guardianName} onChangeText={(v) => setField('guardianName', v)} placeholder="Full name" />

      <Text style={styles.label}>Relationship</Text>
      <ChipGroup options={['Mother', 'Father', 'Guardian', 'Other']} value={form.guardianRelation} onSelect={(v) => setField('guardianRelation', v)} />

      <Field label="Guardian Contact Number *" value={form.guardianContact} onChangeText={(v) => setField('guardianContact', v)} placeholder="09XX XXX XXXX" keyboardType="phone-pad" />

      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, marginBottom: 15 }}
        onPress={() => setAgree((a) => !a)}
      >
        <View style={{
          width: 22, height: 22, borderRadius: 4, borderWidth: 2,
          borderColor: agree ? COLORS.primary : COLORS.gray,
          backgroundColor: agree ? COLORS.primary : '#fff',
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

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15, marginBottom: 30 }}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </FormScreen>
  );
}

// ==========================================
// 4. HOME
// ==========================================
function HomeScreen({ navigation }) {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(null);

  const filteredTutors = TUTORS.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || t.name.toLowerCase().includes(q) ||
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
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar size={50} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bodyPadding}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search subject, Tutor..." style={styles.searchInput}
              value={search} onChangeText={setSearch}
            />
          </View>

          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.subjectRow}>
            {SUBJECTS_HOME.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.subjectCard, subjectFilter === s.key && { backgroundColor: COLORS.primary }]}
                onPress={() => setSubjectFilter((cur) => (cur === s.key ? null : s.key))}
              >
                <Text style={styles.subjectIcon}>{s.icon}</Text>
                <Text style={[styles.subjectText, subjectFilter === s.key && { color: '#fff' }]}>{s.key}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {subjectFilter ? `${subjectFilter} Tutors` : 'Top Tutors'}
            </Text>
            {(subjectFilter || search) ? (
              <TouchableOpacity onPress={() => { setSubjectFilter(null); setSearch(''); }}>
                <Text style={styles.seeAllText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredTutors.length === 0 ? (
            <Text style={{ color: COLORS.gray, textAlign: 'center', marginVertical: 20 }}>No tutors found.</Text>
          ) : (
            filteredTutors.map((t) => (
              <TouchableOpacity
                key={t.id} style={styles.tutorCard}
                onPress={() => navigation.navigate('TutorProfile', { tutorId: t.id })}
              >
                <View style={{ marginRight: 15 }}><Avatar emoji={t.emoji} /></View>
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{t.name}</Text>
                  <Text style={styles.tutorSubject}>{t.subject} • {t.topic}</Text>
                  <Text style={styles.tutorRating}>⭐ {t.rating} ({t.reviews} reviews)</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => navigation.navigate('Bookings', { tutor: t.name })}
                >
                  <Text style={styles.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 5. TUTOR PROFILE (stack screen)
// ==========================================
function TutorProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const tutor = TUTORS.find((t) => t.id === route.params?.tutorId) || TUTORS[0];

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
            <Text style={styles.subtitle}>{tutor.subject} Tutor • ⭐ {tutor.rating} ({tutor.reviews} reviews)</Text>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={{ color: COLORS.gray, lineHeight: 22 }}>{tutor.about}</Text>

          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {tutor.expertise.map((e) => (
              <View key={e} style={styles.tag}><Text style={styles.tagText}>{e}</Text></View>
            ))}
          </View>

          <View style={{ marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Price: ₱{tutor.price}/hr</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { paddingHorizontal: 30 }]}
              onPress={() => navigation.navigate('Main', { screen: 'Bookings', params: { tutor: tutor.name } })}
            >
              <Text style={styles.buttonText}>Book Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 6. BOOKINGS (calendar)
// ==========================================
function BookingCalendar({ prefillTutor }) {
  const { bookings, addBooking, cancelBooking } = useApp();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayKey = getDateKey(today);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [tutorName, setTutorName] = useState(prefillTutor || '');
  const [bookingTime, setBookingTime] = useState('');

  useEffect(() => {
    if (prefillTutor) setTutorName(prefillTutor);
  }, [prefillTutor]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedBookings = bookings.filter((b) => b.date === selectedDate);

  const selectedDateObject = new Date(
    Number(selectedDate.slice(0, 4)),
    Number(selectedDate.slice(5, 7)) - 1,
    Number(selectedDate.slice(8, 10))
  );
  const formattedSelectedDate = selectedDateObject.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const isPastDate = (key) => key < todayKey;
  const changeMonth = (amount) => setCurrentMonth(new Date(year, month + amount, 1));

  const handleAdd = () => {
    if (!tutorName.trim() || !bookingTime.trim()) {
      Alert.alert('Missing Information', 'Please enter the tutor name and booking time.');
      return;
    }
    if (!isValidTime(bookingTime)) {
      Alert.alert('Invalid Time', 'Please use a time like 2:00 PM.');
      return;
    }
    if (isPastDate(selectedDate)) {
      Alert.alert('Invalid Date', 'Please select today or a future date.');
      return;
    }
    const normTime = bookingTime.trim().toUpperCase().replace(/\s?(AM|PM)$/, ' $1');
    const clash = selectedBookings.some(
      (b) => b.time.toUpperCase() === normTime && b.tutor.toLowerCase() === tutorName.trim().toLowerCase()
    );
    if (clash) {
      Alert.alert('Already Booked', 'You already have this tutor booked at that time.');
      return;
    }
    addBooking({ date: selectedDate, tutor: tutorName.trim(), time: normTime });
    setTutorName('');
    setBookingTime('');
    Alert.alert('Booking Added', 'Your tutor booking has been saved.');
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
        <TouchableOpacity onPress={() => changeMonth(-1)} style={calendarStyles.monthButton}>
          <Text style={calendarStyles.monthButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={calendarStyles.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={calendarStyles.monthButton}>
          <Text style={calendarStyles.monthButtonText}>›</Text>
        </TouchableOpacity>
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
          const isBooked = bookings.some((b) => b.date === dateKey);
          const isPast = isPastDate(dateKey);
          return (
            <TouchableOpacity
              key={dateKey} disabled={isPast} onPress={() => setSelectedDate(dateKey)}
              style={[
                calendarStyles.dayCell,
                isSelected && calendarStyles.selectedDay,
                isToday && !isSelected && calendarStyles.todayDay,
                isPast && calendarStyles.pastDay,
              ]}
            >
              <Text style={[
                calendarStyles.dayText,
                isSelected && calendarStyles.selectedDayText,
                isPast && calendarStyles.pastDayText,
              ]}>{day}</Text>
              {isBooked && <View style={calendarStyles.bookingDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={calendarStyles.legend}>
        <View style={calendarStyles.legendItem}>
          <View style={calendarStyles.todayLegend} />
          <Text style={calendarStyles.legendText}>Today</Text>
        </View>
        <View style={calendarStyles.legendItem}>
          <View style={calendarStyles.bookedLegend} />
          <Text style={calendarStyles.legendText}>Booked</Text>
        </View>
      </View>

      <View style={calendarStyles.section}>
        <Text style={calendarStyles.sectionTitle}>{formattedSelectedDate}</Text>
        {selectedBookings.length > 0 ? (
          selectedBookings.map((b) => (
            <View key={b.id} style={calendarStyles.bookingCard}>
              <Text style={calendarStyles.bookingTutor}>Tutor: {b.tutor}</Text>
              <Text style={calendarStyles.bookingInfo}>Time: {b.time}</Text>
              <TouchableOpacity style={calendarStyles.cancelButton} onPress={() => handleCancel(b.id)}>
                <Text style={calendarStyles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={calendarStyles.emptyText}>No bookings for this date.</Text>
        )}
      </View>

      <View style={calendarStyles.section}>
        <Text style={calendarStyles.sectionTitle}>Book a Tutor</Text>
        <TextInput
          style={calendarStyles.input} placeholder="Enter tutor's name"
          value={tutorName} onChangeText={setTutorName}
        />
        <TextInput
          style={calendarStyles.input} placeholder="Enter time (e.g. 2:00 PM)"
          value={bookingTime} onChangeText={setBookingTime} autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[calendarStyles.addButton, isPastDate(selectedDate) && calendarStyles.disabledButton]}
          onPress={handleAdd} disabled={isPastDate(selectedDate)}
        >
          <Text style={calendarStyles.addButtonText}>+ Add Booking</Text>
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
          <BookingCalendar prefillTutor={route.params?.tutor} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 7. CHAT (placeholder)
// ==========================================
function ChatScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.padding, { alignItems: 'center' }]}>
        <Text style={{ fontSize: 60 }}>💬</Text>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>No new messages.</Text>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 8. PROFILE (tab)
// ==========================================
function ProfileScreen({ navigation }) {
  const { user, updateProfile, logout } = useApp();
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
    const result = updateProfile({
      name: tempName, email: tempEmail, gradeLevel: tempGrade, school: tempSchool,
    });
    if (!result.ok) {
      setModalError(result.error);
      return;
    }
    setModalVisible(false);
  };

  const handleLogout = () => {
    logout();
    const nav = navigation.getParent() || navigation;
    nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
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
            <View>
              <View style={styles.profileLargeImage}><Text style={{ fontSize: 56 }}>🧑‍🎓</Text></View>
              <TouchableOpacity
                style={styles.cameraIcon}
                onPress={() => Alert.alert('Upload Photo', 'Image picker will go here.')}
              >
                <Text style={{ fontSize: 16 }}>📷</Text>
              </TouchableOpacity>
            </View>
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

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: COLORS.danger, marginTop: 40 }]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Edit Profile</Text>
              {modalError ? <Text style={styles.errorText}>{modalError}</Text> : null}

              <Field label="Full Name" value={tempName} onChangeText={setTempName} />
              <Field label="Email" value={tempEmail} onChangeText={setTempEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              <Field label="Grade Level" value={tempGrade} onChangeText={setTempGrade} />
              <Field label="School" value={tempSchool} onChangeText={setTempSchool} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1, marginRight: 10, backgroundColor: COLORS.gray }]}
                  onPress={() => setModalVisible(false)}
                >
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
// NAVIGATION
// ==========================================
function MainTabs() {
  const insets = useSafeAreaInsets();
  const icon = (emoji) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { height: 56 + insets.bottom, paddingBottom: insets.bottom + 4, paddingTop: 6 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ tabBarIcon: icon('📅') }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarIcon: icon('💬') }} />
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
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
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
  tag: { backgroundColor: '#e8f5e9', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  tagText: { color: COLORS.primary, fontWeight: 'bold' },

  cameraIcon: { position: 'absolute', bottom: 10, right: 0, backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2 },
  detailCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, padding: 15, borderRadius: 10, marginBottom: 10 },
  detailLabel: { fontSize: 16, color: COLORS.gray },
  detailValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 25, elevation: 5 },
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
  bookingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2196F3', marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayLegend: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#4CAF50' },
  bookedLegend: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2196F3' },
  legendText: { fontSize: 12, color: '#777' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 14, marginBottom: 8 },
  bookingCard: { backgroundColor: '#f4f8f4', borderRadius: 8, padding: 12, marginBottom: 10 },
  bookingTutor: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  bookingInfo: { fontSize: 14, color: '#666', marginTop: 5 },
  cancelButton: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#ffebee', borderRadius: 6 },
  cancelButtonText: { color: '#c62828', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12 },
  addButton: { backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center' },
  disabledButton: { opacity: 0.4 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});