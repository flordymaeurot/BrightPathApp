import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Image, StatusBar, Alert, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// THEME COLORS
const COLORS = {
  primary: '#2E8B57', // Dark Green
  background: '#FFFFFF',
  text: '#333333',
  gray: '#888888',
  lightGray: '#F5F5F5',
};

// TEMPORARY MEMORY FOR ACCOUNTS
const DEFAULT_NAME = 'Student';
const DEFAULT_EMAIL = 'Admin@test.com';
const DEFAULT_PASSWORD = '123456';

let savedEmail = DEFAULT_EMAIL;
let savedPassword = DEFAULT_PASSWORD;
let savedName = "Ella";

// ==========================================
// 1. SPLASH SCREEN
// ==========================================
function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Login');
    }, 2000); 
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 80 }}>🎓</Text>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>BrightPath</Text>
      <Text style={{ color: '#e0f2e9', fontSize: 16 }}>Tutorial services</Text>
    </SafeAreaView>
  );
}

// ==========================================
// 2. LOGIN SCREEN
// ==========================================
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(route.params?.prefilledEmail ?? '');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    setErrorMessage('');
    if (email === savedEmail && password === savedPassword) {
        navigation.replace('MainApp', { userName: savedName });
    } else {
        setErrorMessage('Invalid email or password.');
        setPassword('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.padding}>
        <Text style={styles.headerTitle}>🎓 BrightPath</Text>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput 
          style={styles.input} placeholder="Enter Email"
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input} placeholder="Enter Password"
          value={password} onChangeText={setPassword} secureTextEntry={true}      
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{marginTop: 15}}>
          <Text style={styles.linkText}>Don't have an account? <Text style={{fontWeight: 'bold', color: COLORS.primary}}>Sign up</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


// ==========================================
// 3. SIGN UP SCREEN 
// ==========================================
function SignUpScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    birthdate: '',
    gradeLevel: '',
    school: '',
    contactNumber: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
    mode: '',
    schedule: '',
    sessionsPerWeek: '',
    guardianName: '',
    guardianRelation: '',
    guardianContact: '',
    notes: '',
  });
  const [subjects, setSubjects] = useState([]);
  const [otherSubject, setOtherSubject] = useState('');
  const [agree, setAgree] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleSubject = (subject) => {
    setSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v) => /^[0-9+\-\s]{7,15}$/.test(v);

  const handleSignUp = () => {
    setErrorMessage('');

    // Required checks
    const required = [
      ['firstName', 'First name'],
      ['lastName', 'Last name'],
      ['gender', 'Sex / Gender'],
      ['birthdate', 'Date of birth'],
      ['gradeLevel', 'Grade level'],
      ['school', 'School'],
      ['contactNumber', 'Contact number'],
      ['address', 'Address'],
      ['email', 'Email'],
      ['password', 'Password'],
      ['confirmPassword', 'Confirm password'],
      ['mode', 'Tutorial mode'],
      ['schedule', 'Preferred schedule'],
      ['sessionsPerWeek', 'Sessions per week'],
      ['guardianName', 'Guardian name'],
      ['guardianContact', 'Guardian contact'],
    ];

    for (const [key, label] of required) {
      if (!String(form[key]).trim()) {
        setErrorMessage(`${label} is required.`);
        return;
      }
    }

    if (!isValidEmail(form.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!isValidPhone(form.contactNumber) || !isValidPhone(form.guardianContact)) {
      setErrorMessage('Contact numbers must be 7–15 digits.');
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setErrorMessage('Password must be at least 8 characters and include letters and numbers.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (subjects.length === 0) {
      setErrorMessage('Please select at least one subject.');
      return;
    }
    if (subjects.includes('Others') && !otherSubject.trim()) {
      setErrorMessage('Please specify the other subject.');
      return;
    }
    if (!agree) {
      setErrorMessage('You must agree to the terms and policies.');
      return;
    }

    // Save (demo memory only)
    savedEmail = form.email;
    savedPassword = form.password;
    savedName = `${form.firstName} ${form.lastName}`.trim();

    // Console log the full payload for now
    console.log('BrightPath signup:', {
      ...form,
      password: '***',
      confirmPassword: '***',
      subjects,
      otherSubject,
    });

    Alert.alert('Success', 'Account created! Please log in.');
    navigation.navigate('Login', { prefilledEmail: savedEmail });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.padding}>
        <Text style={styles.headerTitle}>🎓 BrightPath</Text>
        <Text style={styles.title}>Student Signup</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {/* 1. Personal Info */}
        <Text style={styles.sectionTitle}>1. Personal Information</Text>

        <Text style={styles.label}>First Name *</Text>
        <TextInput style={styles.input} value={form.firstName} onChangeText={v => setField('firstName', v)} placeholder="Juan" />

        <Text style={styles.label}>Middle Name</Text>
        <TextInput style={styles.input} value={form.middleName} onChangeText={v => setField('middleName', v)} placeholder="(optional)" />

        <Text style={styles.label}>Last Name *</Text>
        <TextInput style={styles.input} value={form.lastName} onChangeText={v => setField('lastName', v)} placeholder="" />

        <Text style={styles.label}>Sex / Gender *</Text>
        <View style={styles.optionRow}>
          {['Male', 'Female', 'Prefer not to say'].map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.optionChip, form.gender === g && styles.optionChipActive]}
              onPress={() => setField('gender', g)}
            >
              <Text style={[styles.optionChipText, form.gender === g && styles.optionChipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          value={form.birthdate}
          onChangeText={v => setField('birthdate', v)}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Grade Level *</Text>
        <TextInput
          style={styles.input}
          value={form.gradeLevel}
          onChangeText={v => setField('gradeLevel', v)}
          placeholder="e.g. Grade 10"
        />

        <Text style={styles.label}>School *</Text>
        <TextInput style={styles.input} value={form.school} onChangeText={v => setField('school', v)} placeholder="Name of school" />

        <Text style={styles.label}>Contact Number *</Text>
        <TextInput
          style={styles.input}
          value={form.contactNumber}
          onChangeText={v => setField('contactNumber', v)}
          placeholder="09XX XXX XXXX"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Home Address *</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          value={form.address}
          onChangeText={v => setField('address', v)}
          placeholder="House no., street, barangay, city"
          multiline
        />

        {/* 2. Account */}
        <Text style={styles.sectionTitle}>2. Account Details</Text>

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={v => setField('email', v)}
          placeholder="student@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={form.password}
          onChangeText={v => setField('password', v)}
          placeholder="Min 8 chars, letters + numbers"
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          value={form.confirmPassword}
          onChangeText={v => setField('confirmPassword', v)}
          placeholder="Re-type password"
          secureTextEntry
        />

        {/* 3. Enrollment */}
        <Text style={styles.sectionTitle}>3. Tutorial Enrollment</Text>

        <Text style={styles.label}>Subjects *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
          {['Mathematics', 'English', 'Science', 'Filipino', 'Social Studies', 'Computer / ICT', 'Reading & Writing', 'Others'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.optionChip, subjects.includes(s) && styles.optionChipActive]}
              onPress={() => toggleSubject(s)}
            >
              <Text style={[styles.optionChipText, subjects.includes(s) && styles.optionChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {subjects.includes('Others') && (
          <>
            <Text style={styles.label}>Specify Other Subject *</Text>
            <TextInput
              style={styles.input}
              value={otherSubject}
              onChangeText={setOtherSubject}
              placeholder="e.g. Chemistry"
            />
          </>
        )}

        <Text style={styles.label}>Tutorial Mode *</Text>
        <View style={styles.optionRow}>
          {['Face-to-Face', 'Online', 'Hybrid'].map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.optionChip, form.mode === m && styles.optionChipActive]}
              onPress={() => setField('mode', m)}
            >
              <Text style={[styles.optionChipText, form.mode === m && styles.optionChipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Preferred Schedule *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
          {[
            'Weekdays Morning',
            'Weekdays Afternoon',
            'Weekdays Evening',
            'Weekends',
          ].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.optionChip, form.schedule === s && styles.optionChipActive]}
              onPress={() => setField('schedule', s)}
            >
              <Text style={[styles.optionChipText, form.schedule === s && styles.optionChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Sessions per Week *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
          {['1', '2', '3', '4+'].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.optionChip, form.sessionsPerWeek === n && styles.optionChipActive]}
              onPress={() => setField('sessionsPerWeek', n)}
            >
              <Text style={[styles.optionChipText, form.sessionsPerWeek === n && styles.optionChipTextActive]}>{n}/week</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Learning Needs / Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          value={form.notes}
          onChangeText={v => setField('notes', v)}
          placeholder="Anything the tutor should know"
          multiline
        />

        {/* 4. Guardian */}
        <Text style={styles.sectionTitle}>4. Parent / Guardian</Text>

        <Text style={styles.label}>Guardian Full Name *</Text>
        <TextInput style={styles.input} value={form.guardianName} onChangeText={v => setField('guardianName', v)} placeholder="Full name" />

        <Text style={styles.label}>Relationship</Text>
        <View style={styles.optionRow}>
          {['Mother', 'Father', 'Guardian', 'Other'].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.optionChip, form.guardianRelation === r && styles.optionChipActive]}
              onPress={() => setField('guardianRelation', r)}
            >
              <Text style={[styles.optionChipText, form.guardianRelation === r && styles.optionChipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Guardian Contact Number *</Text>
        <TextInput
          style={styles.input}
          value={form.guardianContact}
          onChangeText={v => setField('guardianContact', v)}
          placeholder="09XX XXX XXXX"
          keyboardType="phone-pad"
        />

        {/* Agreement */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, marginBottom: 15 }}
          onPress={() => setAgree(a => !a)}
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

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15 }}>
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
// ==========================================
// 4. HOME SCREEN
// ==========================================
function HomeScreen({ navigation, userName }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerBg}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View>
              <Text style={styles.greeting}>Hi, {userName && userName.trim() ? userName : DEFAULT_NAME}!</Text>
              <Text style={styles.subGreeting}>Find your perfect tutor</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('StudentProfile', { userName, userEmail: savedEmail })}>
               <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.profilePic} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bodyPadding}>
          <View style={styles.searchContainer}>
            <TextInput placeholder="Search subject, Tutor..." style={styles.searchInput} />
          </View>

          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.subjectRow}>
            <TouchableOpacity style={styles.subjectCard} onPress={() => Alert.alert("Math", "Showing Math tutors...")}>
              <Text style={styles.subjectIcon}>📐</Text><Text style={styles.subjectText}>Math</Text></TouchableOpacity>
            <TouchableOpacity style={styles.subjectCard} onPress={() => Alert.alert("Science", "Showing Science tutors...")}>
              <Text style={styles.subjectIcon}>🔬</Text><Text style={styles.subjectText}>Science</Text></TouchableOpacity>
            <TouchableOpacity style={styles.subjectCard} onPress={() => Alert.alert("English", "Showing English tutors...")}>
              <Text style={styles.subjectIcon}>📚</Text><Text style={styles.subjectText}>English</Text></TouchableOpacity>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Tutors</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.tutorCard} onPress={() => navigation.navigate('TutorProfile')}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.tutorImage} />
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>Ms. Trixie Morales</Text>
              <Text style={styles.tutorSubject}>Mathematics • Algebra</Text>
              <Text style={styles.tutorRating}>⭐ 4.9 (120 reviews)</Text>
            </View>
            <View style={styles.bookBtn}><Text style={styles.bookBtnText}>Book</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tutorCard}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png' }} style={styles.tutorImage} />
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>Mr. John Doe</Text>
              <Text style={styles.tutorSubject}>Science • Physics</Text>
              <Text style={styles.tutorRating}>⭐ 4.8 (95 reviews)</Text>
            </View>
            <View style={styles.bookBtn}><Text style={styles.bookBtnText}>Book</Text></View>
          </TouchableOpacity>
          <BookingCalendar />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 5. TUTOR PROFILE SCREEN
// ==========================================
function TutorProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={{fontSize: 24, color: '#fff'}}>←</Text>
          </TouchableOpacity>
          <Text style={styles.profileHeaderText}>Tutor Profile</Text>
        </View>

        <View style={styles.bodyPadding}>
          <View style={{alignItems: 'center', marginTop: -50}}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.profileLargeImage} />
            <Text style={styles.title}>Ms. Trixie Morales</Text>
            <Text style={styles.subtitle}>Mathematics Tutor • ⭐ 4.9 (120 reviews)</Text>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={{color: COLORS.gray, lineHeight: 22}}>
            Enjoys helping students master math with over 8 years of experience. Specializes in Algebra and Calculus.
          </Text>

          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
            <View style={styles.tag}><Text style={styles.tagText}>Algebra</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Calculus</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Statistics</Text></View>
          </View>

          <View style={{marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={{fontSize: 18, fontWeight: 'bold'}}>Price: ₱250/hr</Text>
            <TouchableOpacity style={[styles.primaryButton, {paddingHorizontal: 30}]} onPress={() => navigation.navigate('MainApp')}>
              <Text style={styles.buttonText}>Book Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 6. STUDENT PROFILE SCREEN
// ==========================================
function StudentProfileScreen({ navigation, route }) {
  const initialName = route.params?.userName ?? saveName ?? DEFAULT_NAME;
  const initialEmail = route.params?.userEmail ?? saveEmail ?? '@student.com';

  const [name, setName] = useState('initialName');
  const [email, setEmail] = useState('initialEmail');
  const [isModalVisible, setModalVisible] = useState(false);

  const openEditModal = () => {
    setTempName(name);
    setTempEmail(email);
    setModalVisible(true);
  };
  

  const [tempName, setTempName] = useState(initialName);
  const [tempEmail, setTempEmail] = useState(initialEmail);

  const handleSave = () => {
    setName(tempName);
    setEmail(tempEmail);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('MainApp')} style={styles.backButton}>
            <Text style={{fontSize: 24, color: '#fff'}}>←</Text>
          </TouchableOpacity>
          <Text style={styles.profileHeaderText}>My Profile</Text>
        </View>

        <View style={styles.bodyPadding}>
          <View style={{alignItems: 'center', marginTop: -50}}>
            <View>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.profileLargeImage} />
              <TouchableOpacity style={styles.cameraIcon} onPress={() => Alert.alert("Upload Photo", "Image picker will go here.")}>
                <Text style={{fontSize: 16}}>📷</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{name || DEFAULT_NAME}</Text>
            <Text style={styles.subtitle}>{email}</Text>
            
            <TouchableOpacity style={[styles.primaryButton, {width: '80%', marginTop: 15}]} onPress={openEditModal}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Grade Level:</Text>
            <Text style={styles.detailValue}>Grade 10</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>School:</Text>
            <Text style={styles.detailValue}>BrightPath High</Text>
          </View>

          <TouchableOpacity style={[styles.primaryButton, {backgroundColor: '#ff4d4d', marginTop: 40}]} onPress={() => navigation.replace('Login')}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Profile</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={tempName} onChangeText={setTempName} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={tempEmail} onChangeText={setTempEmail} keyboardType="email-address" />

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
              <TouchableOpacity style={[styles.primaryButton, {flex: 1, marginRight: 10, backgroundColor: COLORS.gray}]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, {flex: 1, marginLeft: 10}]} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// 7. DUMMY BOOKINGS & CHAT
// ==========================================
function BookingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <Text style={styles.title}>📅 My Bookings</Text>
        <Text style={styles.subtitle}>You have no upcoming sessions.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('MainApp')}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ChatScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <Text style={styles.title}>💬 Messages</Text>
        <Text style={styles.subtitle}>No new messages.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('MainApp')}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


function BookingCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(
    getDateKey(today)
  );

  const [tutorName, setTutorName] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookings, setBookings] = useState([]);

  // Convert a date into YYYY-MM-DD using local time.
  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const selectedBookings = bookings.filter(
    (booking) => booking.date === selectedDate
  );

  const selectedDateObject = new Date(
    Number(selectedDate.slice(0, 4)),
    Number(selectedDate.slice(5, 7)) - 1,
    Number(selectedDate.slice(8, 10))
  );

  const formattedSelectedDate = selectedDateObject.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  function changeMonth(amount) {
    setCurrentMonth(
      new Date(year, month + amount, 1)
    );
  }

  function isPastDate(dateKey) {
    return dateKey < getDateKey(today);
  }

  function addBooking() {
    if (!tutorName.trim() || !bookingTime.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter the tutor name and booking time.'
      );
      return;
    }

    if (isPastDate(selectedDate)) {
      Alert.alert(
        'Invalid Date',
        'Please select today or a future date.'
      );
      return;
    }

    const newBooking = {
      id: `${Date.now()}`,
      date: selectedDate,
      tutor: tutorName.trim(),
      time: bookingTime.trim(),
    };

    setBookings((previousBookings) => [
      ...previousBookings,
      newBooking,
    ]);

    setTutorName('');
    setBookingTime('');

    Alert.alert('Booking Added', 'Your tutor booking has been saved.');
  }

  function cancelBooking(id) {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => {
            setBookings((previousBookings) =>
              previousBookings.filter((booking) => booking.id !== id)
            );
          },
        },
      ]
    );
  }

  return (
    <View style={calendarStyles.container}>
      <Text style={calendarStyles.heading}>My Bookings</Text>

      <Text style={calendarStyles.subtitle}>
        Choose a date to view or schedule a tutoring session.
      </Text>

      {/* MONTH NAVIGATION */}
      <View style={calendarStyles.monthHeader}>
        <TouchableOpacity
          onPress={() => changeMonth(-1)}
          style={calendarStyles.monthButton}
        >
          <Text style={calendarStyles.monthButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={calendarStyles.monthTitle}>{monthName}</Text>

        <TouchableOpacity
          onPress={() => changeMonth(1)}
          style={calendarStyles.monthButton}
        >
          <Text style={calendarStyles.monthButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* WEEKDAY LABELS */}
      <View style={calendarStyles.weekRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
          (day) => (
            <Text key={day} style={calendarStyles.weekDay}>
              {day}
            </Text>
          )
        )}
      </View>

      {/* CALENDAR DAYS */}
      <View style={calendarStyles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <View
                key={`empty-${index}`}
                style={calendarStyles.dayCell}
              />
            );
          }

          const dateKey = getDateKey(
            new Date(year, month, day)
          );

          const isSelected = selectedDate === dateKey;
          const isToday = getDateKey(today) === dateKey;
          const isBooked = bookings.some(
            (booking) => booking.date === dateKey
          );

          const isPast = isPastDate(dateKey);

          return (
            <TouchableOpacity
              key={dateKey}
              disabled={isPast}
              onPress={() => setSelectedDate(dateKey)}
              style={[
                calendarStyles.dayCell,
                isSelected && calendarStyles.selectedDay,
                isToday && !isSelected && calendarStyles.todayDay,
                isPast && calendarStyles.pastDay,
              ]}
            >
              <Text
                style={[
                  calendarStyles.dayText,
                  isSelected && calendarStyles.selectedDayText,
                  isPast && calendarStyles.pastDayText,
                ]}
              >
                {day}
              </Text>

              {isBooked && (
                <View style={calendarStyles.bookingDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CALENDAR LEGEND */}
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

      {/* SELECTED DATE */}
      <View style={calendarStyles.section}>
        <Text style={calendarStyles.sectionTitle}>
          {formattedSelectedDate}
        </Text>

        {selectedBookings.length > 0 ? (
          selectedBookings.map((booking) => (
            <View key={booking.id} style={calendarStyles.bookingCard}>
              <Text style={calendarStyles.bookingTutor}>
                Tutor: {booking.tutor}
              </Text>

              <Text style={calendarStyles.bookingInfo}>
                Time: {booking.time}
              </Text>

              <TouchableOpacity
                style={calendarStyles.cancelButton}
                onPress={() => cancelBooking(booking.id)}
              >
                <Text style={calendarStyles.cancelButtonText}>
                  Cancel Booking
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={calendarStyles.emptyText}>
            No bookings for this date.
          </Text>
        )}
      </View>

      {/* ADD BOOKING FORM */}
      <View style={calendarStyles.section}>
        <Text style={calendarStyles.sectionTitle}>
          Book a Tutor
        </Text>

        <TextInput
          style={calendarStyles.input}
          placeholder="Enter tutor's name"
          value={tutorName}
          onChangeText={setTutorName}
        />

        <TextInput
          style={calendarStyles.input}
          placeholder="Enter time (e.g. 2:00 PM)"
          value={bookingTime}
          onChangeText={setBookingTime}
        />

        <TouchableOpacity
          style={[
            calendarStyles.addButton,
            isPastDate(selectedDate) && calendarStyles.disabledButton,
          ]}
          onPress={addBooking}
          disabled={isPastDate(selectedDate)}
        >
          <Text style={calendarStyles.addButtonText}>
            + Add Booking
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 26,
    color: '#333',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#777',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    color: '#222',
  },
  selectedDay: {
    backgroundColor: '#4CAF50',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayDay: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pastDay: {
    opacity: 0.35,
  },
  pastDayText: {
    color: '#999',
  },
  bookingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2196F3',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayLegend: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  bookedLegend: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  legendText: {
    fontSize: 12,
    color: '#777',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  bookingCard: {
    backgroundColor: '#f4f8f4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  bookingTutor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  bookingInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});


// ==========================================
// BOTTOM NAVIGATION WRAPPER
// ==========================================
function MainAppWrapper({ navigation, route }) {
  const userName = route.params?.userName ?? savedName ?? DEFAULT_NAME;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1 }}>
        <HomeScreen navigation={navigation} userName={userName} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MainApp')}>
          <Text style={{fontSize: 20}}>🏠</Text>
          <Text style={styles.tabTextActive}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Bookings')}>
          <Text style={{fontSize: 20}}>📅</Text>
          <Text style={styles.tabText}>Bookings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Chat')}>
          <Text style={{fontSize: 20}}>💬</Text>
          <Text style={styles.tabText}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} 
        onPress={() => 
        navigation.navigate('StudentProfile', {
          userName,
          userEmail: savedEmail,
        })
      }
      >
          <Text style={{fontSize: 20}}>👤</Text>
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// MAIN APP NAVIGATION
// ==========================================
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="MainApp" component={MainAppWrapper} />
        <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
        <Stack.Screen name="Bookings" component={BookingsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  padding: { paddingHorizontal: 24, justifyContent: 'center', flexGrow: 1 },
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

  headerBg: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 50, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: '#e0f2e9', marginTop: 4 },
  profilePic: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' },
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
  tutorImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  tutorSubject: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  tutorRating: { fontSize: 12, color: '#f39c12', marginTop: 4, fontWeight: 'bold' },
  bookBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  profileHeader: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, paddingBottom: 60 },
  backButton: { marginRight: 15 },
  profileHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileLargeImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff', marginBottom: 10 },
  tag: { backgroundColor: '#e8f5e9', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  tagText: { color: COLORS.primary, fontWeight: 'bold' },

  cameraIcon: { position: 'absolute', bottom: 10, right: 0, backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2 },
  detailCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, padding: 15, borderRadius: 10, marginBottom: 10 },
  detailLabel: { fontSize: 16, color: COLORS.gray },
  detailValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 25, elevation: 5 },
  
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  tabItem: { alignItems: 'center' },
  tabText: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  tabTextActive: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', marginTop: 4 },
});