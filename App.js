//* 
import React, { useState, useRef } from 'react';
import TestApp from './TestApp';



import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
const GREEN = '#033815';

// ==========================================
// 1. SPLASH SCREEN
// ==========================================
function SplashScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' }]}>
      <View style={styles.logoCircle}>
        <Text style={{ fontSize: 80 }}>🎓</Text>
      </View>
      <Text style={[styles.title, { color: 'white', fontSize: 50, marginTop: 20 }]}>BrightPath</Text>
      <Text style={{ color: 'white', fontSize: 20 }}>Tutorial services</Text>
      
      <TouchableOpacity style={styles.whiteButton} onPress={() => navigation.replace('Login')}>
        <Text style={{ color: 'black', fontWeight: 'bold' }}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ==========================================
// 2. LOGIN & SIGNUP SCREENS
// ==========================================
function LoginScreen({ navigation }) {
  const [inputName, setInputName] = useState('');
  const emailInputRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password,setPassword] = useState('');
  const passwordInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    setErrorMessage('');
    if (email === "admin@test.com" && password === '') {
        navigation.replace('Home', { userName: 'Admin' }); 
    } else {
        setErrorMessage('Invalid email or password. Please try again.');

        setPassword('');

        if (email !== "admin@test.com") {
          emailInputRef.current.focus();
        } else {
          passwordInputRef.current.focus();
        }
      }
}

  return (
    
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <Text style={styles.headerTitle}>🎓 BrightPath</Text>
        <Text style={styles.title}>Welcome to BrightPath!</Text>
        <Text style={styles.subtitle}>Find your Tutor, Reach you goals</Text>

        <TextInput 
          ref={emailInputRef}
          style={styles.input} 
          placeholder="Enter Email"
          value={email}               
          onChangeText={setEmail}     
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          ref={passwordInputRef}
          style={styles.input} 
          placeholder="Enter Password"
          value={password}            
          onChangeText={setPassword}  
          secureTextEntry={true}      
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.linkText}>Don't have an account? <Text style={{fontWeight: 'bold', color: GREEN }}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SignUpScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <Text style={styles.title}>Student Sign Up</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.inputContainer}><TextInput placeholder="👤 Full Name" style={styles.input} /></View>
        <View style={styles.inputContainer}><TextInput placeholder="✉️ Email" style={styles.input} /></View>
        <View style={styles.inputContainer}><TextInput placeholder="🔒 Password" secureTextEntry style={styles.input} /></View>
        <View style={styles.inputContainer}><TextInput placeholder="🔒 Confirm Password" secureTextEntry style={styles.input} /></View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>SIGN UP</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? <Text style={{fontWeight: 'bold', color: GREEN }}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 3. HOME SCREEN
// ==========================================
function HomeScreen({ navigation, route }) {
  const { studentName } = route.params || { studentName: 'Student' };
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=1ea34a&color=fff&size=100`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.greenHeader}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View>
            <Text style={styles.greeting}>Good Day,</Text>
            <Text style={styles.greetingSub}>Find your perfect tutor</Text>
          </View>
          <View style={styles.avatarHeader} />
        </View>
      </View>

      <ScrollView style={styles.padding}>
        <View style={styles.searchBar}>
          <Text style={{color: '#888'}}>🔍 Search subjects, Tutors...</Text>
        </View>

        <Text style={styles.sectionTitle}>Subjects</Text>
        <View style={styles.row}>
          <View style={styles.subjectCard}><Text style={styles.subjectText}>📐 Math</Text></View>
          <View style={styles.subjectCard}><Text style={styles.subjectText}>🔬 Science</Text></View>
          <View style={styles.subjectCard}><Text style={styles.subjectText}>📚 English</Text></View>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.sectionTitle}>Top Tutors</Text>
          <Text style={{color: GREEN, fontWeight: 'bold'}}>See all</Text>
        </View>
        
        <TouchableOpacity style={styles.tutorCard} onPress={() => navigation.navigate('TutorProfile')}>
          <View style={styles.avatar} />
          <View style={{flex: 1, marginLeft: 10}}>
            <Text style={{fontWeight: 'bold'}}> Ms.Trixie Morales</Text>
            <Text style={{color: '#666', fontSize: 12}}>⭐ Math • 4.9 (120)</Text>
          </View>
          <TouchableOpacity style={styles.smallButton} onPress={() => navigation.navigate('Booking')}>
            <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold'}}>Book</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navIcon} onPress={() => navigation.navigate('MyBookings')}>📅</Text>
          <Text style={styles.navIcon} onPress={() => navigation.navigate('Chat')}>💬</Text>
          <Text style={styles.navIcon} onPress={() => navigation.navigate('TutorDashboard')}>👤</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 4. STUDENT PROFILE SCREEN
// ==========================================
function StudentProfileScreen({ navigation, route }) {
  const studentName = route.params?.userName || 'Student';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=1ea34a&color=fff&size=200`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.padding}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 20 }}>⬅ Back</Text>
        </TouchableOpacity>

        {/* Header Profile */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <View style={styles.profileAvatarContainer}>
            <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
            </View>
            <Text style={{ fontSize: 50 }}>👤</Text>
          </View>
          <Text style={styles.title}>{studentName}</Text>
          <Text style={styles.subtitle}>Student Account</Text>

        {/* Personal Info Card */}
        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Name</Text>
            <Text style={styles.profileValue}>{studentName}</Text>
          </View>
          
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Email</Text>
            <Text style={styles.profileValue}>student@email.com</Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Grade Level</Text>
            <Text style={styles.profileValue}>Grade 11</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => alert('Edit Profile clicked')}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#d9534f', marginTop: 10 }]} 
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 5. ADMIN DASHBOARD SCREEN
// ==========================================
function AdminDashboardScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.padding}>
        
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.headerTitle}>👑 Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage your platform</Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.row}>
          <View style={[styles.dashCard, { backgroundColor: '#4A90E2' }]}>
            <Text style={{ color: 'white', fontSize: 12 }}>Total Students</Text>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>1,250</Text>
          </View>
          <View style={[styles.dashCard, { backgroundColor: GREEN }]}>
            <Text style={{ color: 'white', fontSize: 12 }}>Active Tutors</Text>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 24 }}>85</Text>
          </View>
        </View>

        <View style={[styles.dashCard, { backgroundColor: '#f39c12', marginBottom: 20, width: '100%' }]}>
          <Text style={{ color: 'white', fontSize: 12 }}>Total Revenue (This Month)</Text>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 28 }}>₱125,400</Text>
        </View>

        {/* Management Options */}
        <Text style={styles.sectionTitle}>Management</Text>
        
        <TouchableOpacity style={styles.adminMenuButton} onPress={() => alert('Viewing Students List')}>
          <Text style={styles.adminMenuText}>👨‍🎓 Manage Students</Text>
          <Text style={{ color: '#888' }}>➔</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuButton} onPress={() => alert('Viewing Tutors List')}>
          <Text style={styles.adminMenuText}>👩‍🏫 Manage Tutors</Text>
          <Text style={{ color: '#888' }}>➔</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuButton} onPress={() => alert('Viewing Payments')}>
          <Text style={styles.adminMenuText}>💳 Payouts & Payments</Text>
          <Text style={{ color: '#888' }}>➔</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#d9534f', marginTop: 30 }]} 
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// 6. SEARCH SCREEN
// ==========================================
function SearchScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{fontSize: 20, marginRight: 10}}>⬅</Text></TouchableOpacity>
          <View style={[styles.searchBar, {flex: 1, marginVertical: 0}]}>
            <TextInput placeholder="Search subjects, Tutors..." autoFocus />
          </View>
        </View>
        <Text style={styles.sectionTitle}>Search Results</Text>
        <Text style={{color: '#666'}}>Type to search for tutors...</Text>
      </View>
    </SafeAreaView>
  );
}


// ==========================================
// 7. TUTOR PROFILE SCREEN
// ==========================================
function TutorProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{fontSize: 20, marginBottom: 15}}>⬅ Tutor Profile</Text></TouchableOpacity>
        
        <View style={{alignItems: 'center'}}>
          <View style={[styles.avatar, {width: 80, height: 80, borderRadius: 40}]} />
          <Text style={styles.title}>Ms.Trixie Morales</Text>
          <Text style={styles.subtitle}>Mathematics Tutor • ⭐ 4.9 (120 reviews)</Text>
          <View style={styles.statusBadge}><Text style={{color: GREEN, fontSize: 12}}>● Available Today</Text></View>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={{color: '#666', marginBottom: 15}}>Dedicated math tutor with 5+ years experience.</Text>

        <Text style={styles.sectionTitle}>Expertise</Text>
        <View style={styles.row}>
          <View style={styles.expertiseTag}><Text style={{color: GREEN, fontSize: 12}}>Algebra</Text></View>
          <View style={styles.expertiseTag}><Text style={{color: GREEN, fontSize: 12}}>Calculus</Text></View>
          <View style={styles.expertiseTag}><Text style={{color: GREEN, fontSize: 12}}>Statistics</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Price: $25/hr • Online & In-person</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Booking')}>
          <Text style={styles.buttonText}>Book Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 8. BOOKING CALENDAR SCREEN
// ==========================================
function BookingScreen({ navigation }) {
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const times = ['10:00 AM', '2:00 PM', '4:30 PM'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{fontSize: 20, marginBottom: 15}}>⬅ Booking Calendar</Text></TouchableOpacity>
        
        <View style={styles.calendarHeader}>
          <Text style={{fontWeight: 'bold'}}>November 2026</Text>
        </View>
        
        <View style={styles.calendarBox}>
          <Text style={{color: '#ccc'}}>Calendar Grid Here</Text>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => <Text key={day} style={styles.dayText}>{day}</Text>)}
        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map(date => (
        <View key={date} style={[styles.dateBox, date === 15 ? styles.activeDate : null]}>
          <Text style={date === 15 ? {color: 'white'} : {color: '#333'}}>{date}</Text>
          </View>
        ))}
        </View>

        <Text style={styles.sectionTitle}>Available Time Slot</Text>
        <View style={styles.row}>
          
          
          <View style={[styles.timeSlot, {backgroundColor: GREEN }]}><Text style={{color: 'white'}}>10:00 AM</Text></View>
          <View style={styles.timeSlot}><Text>2:00 PM</Text></View>
          <View style={styles.timeSlot}><Text>4:30 PM</Text></View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 9. MY BOOKINGS SCREEN
// ==========================================
function MyBookingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.padding}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{fontSize: 20, marginBottom: 15}}>⬅ My Bookings</Text></TouchableOpacity>
        
        <View style={styles.bookingCard}>
          <View style={styles.row}>
            <Text style={{fontWeight: 'bold'}}>Math with Trixie Morales</Text>
            <Text style={{color: GREEN, fontSize: 12}}>Confirmed</Text>
          </View>
          <Text style={{color: '#666', fontSize: 12, marginTop: 5}}>Nov 2 • 10:00 AM</Text>
        </View>

        <View style={styles.bookingCard}>
          <View style={styles.row}>
            <Text style={{fontWeight: 'bold'}}>Science with Crystalyn Torres</Text>
            <Text style={{color: GREEN, fontSize: 12}}>Confirmed</Text>
          </View>
          <Text style={{color: '#666', fontSize: 12, marginTop: 5}}>Oct 13 • 9:00 PM</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 10. CHAT SCREEN
// ==========================================
function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
      { id: 1, text: 'Hi, Ready for our Math session today?', sender: 'tutor' },
      { id: 2, text: 'Yes! I have a few questions about the calculus assignment.', sender: 'student' },
    ]);
    const [inputText, setInputText] = useState('');
  
    const sendMessage = () => {
      if (inputText.trim() === '') return;
      const newMessage = { id: Date.now(), text: inputText, sender: 'student' };
      setMessages([...messages, newMessage]);
      setInputText('');
    };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{fontSize: 20}}>⬅</Text></TouchableOpacity>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={{fontWeight: 'bold'}}>Tutor Trixie</Text>
            <Text style={{fontSize: 10, color: GREEN}}>Online</Text>
          </View>
        </View>

        <ScrollView style={styles.padding}>
          <View style={styles.chatBubbleLeft}><Text>Hi, Ready for our Math session today?</Text></View>
          <View style={styles.chatBubbleRight}><Text style={{color: 'white'}}>Yes! I have a few questions about the calculus assignment.</Text></View>
        </ScrollView>

        <View style={styles.chatInputContainer}>
          <TextInput placeholder="Type a message..." style={styles.chatInput} />
          <TouchableOpacity style={styles.sendButton}><Text style={{color: 'white'}}>➤</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================
// 11. TUTOR REGISTRATION & DASHBOARD
// ==========================================
function TutorRegistrationScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.padding}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{fontSize: 20, marginBottom: 15}}>⬅ Tutor Registration</Text></TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.inputContainer}><TextInput placeholder="Full Name" style={styles.input} /></View>
        <View style={styles.inputContainer}><TextInput placeholder="Email" style={styles.input} /></View>
        
        <Text style={styles.sectionTitle}>Subject Expertise</Text>
        <View style={styles.inputContainer}><TextInput placeholder="Select subject" style={styles.input} /></View>
        
        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.uploadBox}><Text>📄 Upload Valid ID</Text></View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('TutorDashboard')}>
          <Text style={styles.buttonText}>Register Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TutorDashboardScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.padding}>
        <View style={{alignItems: 'center', marginBottom: 20}}>
          <View style={[styles.avatar, {width: 60, height: 60, borderRadius: 30}]} />
          <Text style={styles.title}>Trixie Morales</Text>
          <Text style={styles.subtitle}>Tutor • Nov 2026</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.dashCard}>
            <Text style={{color: 'white', fontSize: 10}}>Total Earnings</Text>
            <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>$14,000</Text>
          </View>
          <View style={[styles.dashCard, {backgroundColor: '#a8e6cf'}]}>
            <Text style={{color: '#333', fontSize: 10}}>Sessions</Text>
            <Text style={{color: '#333', fontWeight: 'bold', fontSize: 16}}>500</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.chartPlaceholder}><Text>📊 Chart Here</Text></View>

        <Text style={styles.sectionTitle}>Payout Status: Ready</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


// ==========================================
// MAIN NAVIGATION ROUTER
// ==========================================
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="TutorRegistration" component={TutorRegistrationScreen} />
        <Stack.Screen name="TutorDashboard" component={TutorDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==========================================
// STYLES (COLORS & LAYOUTS)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  padding: { padding: 20, flex: 1 },
  
  // Typography
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: GREEN, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, marginTop: 10 },

  // Inputs & Buttons
  inputContainer: { backgroundColor: '#f0f0f0', borderRadius: 10, marginBottom: 15, paddingHorizontal: 15 },
  input: { paddingVertical: 15, fontSize: 16 },
  primaryButton: { backgroundColor: GREEN, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  whiteButton: { backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, marginTop: 40 },
  linkText: { textAlign: 'center', color: '#666', marginTop: 20 },
  smallButton: { backgroundColor: GREEN, paddingVertical: 5, paddingHorizontal: 15, borderRadius: 5 },

  // Splash
  logoCircle: { width: 120, height: 120, backgroundColor: 'black', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },

  // Home
  greenHeader: { backgroundColor: GREEN, padding: 30, paddingTop: 50, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  greetingSub: { fontSize: 16, color: 'white', marginTop: 5 },
  avatarHeader: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white' },
  searchBar: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginVertical: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  subjectCard: { backgroundColor: GREEN, padding: 15, borderRadius: 10, flex: 0.3, alignItems: 'center' },
  subjectText: { color: 'white', fontWeight: 'bold' },
  tutorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, borderTopWidth: 1, borderColor: '#eee', marginTop: 20 },
  navIcon: { fontSize: 24 },

  // Tutor Profile & Booking
  statusBadge: { backgroundColor: '#e0f2e9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  expertiseTag: { backgroundColor: '#e0f2e9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, marginRight: 10 },
  calendarHeader: { backgroundColor: '#eee', padding: 15, borderRadius: 10, alignItems: 'center' },
  calendarBox: { height: 150, backgroundColor: '#f9f9f9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginVertical: 15 },
  timeSlot: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, flex: 0.3, alignItems: 'center' },

  // My Bookings
  bookingCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },

  // Chat
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  chatBubbleLeft: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, alignSelf: 'flex-start', maxWidth: '80%', marginBottom: 15 },
  chatBubbleRight: { backgroundColor: GREEN, padding: 15, borderRadius: 10, alignSelf: 'flex-end', maxWidth: '80%', marginBottom: 15 },
  chatInputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#eee' },
  chatInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15 },
  sendButton: { backgroundColor: GREEN, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

  // Tutor Dash
  uploadBox: { borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  dashCard: { backgroundColor: GREEN, padding: 15, borderRadius: 10, flex: 0.48 },
  chartPlaceholder: { height: 100, backgroundColor: '#f9f9f9', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});

// *