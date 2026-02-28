import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from "firebase/auth";

// Firebase configuration using environment variables from Vite
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBzGY1qwQxUP1wpvg1-eJr_L4OBXOG5FGw",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thanq-app-jyj-2026.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thanq-app-jyj-2026",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thanq-app-jyj-2026.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "368787291600",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:368787291600:web:f93702adda84423d384dd5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google 로그인 유틸리티
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Google Sign-in Error:", error);
        return { success: false, error: error.message };
    }
};

// 로그아웃 유틸리티
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Logout Error:", error);
        return { success: false, error: error.message };
    }
};

import { signInAnonymously } from "firebase/auth";

// 게스트 로그인 유틸리티
export const signInGuest = async () => {
    try {
        const result = await signInAnonymously(auth);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Guest Sign-in Error:", error);
        return { success: false, error: error.message };
    }
};

import {
    OAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "firebase/auth";

// 애플 로그인 유틸리티
const appleProvider = new OAuthProvider('apple.com');
export const signInWithApple = async () => {
    try {
        await signInWithRedirect(auth, appleProvider);
        return { success: true };
    } catch (error) {
        console.error("Apple Sign-in Error:", error);
        return { success: false, error: error.message };
    }
};

// 이메일 가입 및 로그인 유틸리티
export const signUpWithEmail = async (email, password) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const signInWithEmailStore = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: result.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// 전화번호 인증 유틸리티
export const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            size: 'invisible'
        });
    }
};

export const requestPhoneOTP = async (phoneNumber) => {
    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        return { success: true };
    } catch (error) {
        console.error("OTP Request Error:", error);
        return { success: false, error: error.message };
    }
};

export const verifyPhoneOTP = async (code) => {
    try {
        const result = await window.confirmationResult.confirm(code);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("OTP Verify Error:", error);
        return { success: false, error: error.message };
    }
};

export { auth, onAuthStateChanged };
