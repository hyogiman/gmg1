// Firebase SDK 연결
const firebaseConfig = {
  apiKey: "AIzaSyCCxRR6hXvk9Z17eK8H_Vov_TbGX8LzvDs",
  authDomain: "factory-sim01v.firebaseapp.com",
  projectId: "factory-sim01v",
  storageBucket: "factory-sim01v.firebasestorage.app",
  messagingSenderId: "818674298880",
  appId: "1:818674298880:web:95307171220da8bd8d28e5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();