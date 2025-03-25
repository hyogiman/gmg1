// Firebase 초기화 (v10 이상 compat 방식)
const firebaseConfig = {
  apiKey: "AIzaSyCCxRR6hXvk9Z17eK8H_Vov_TbGX8LzvDs",
  authDomain: "factory-sim01v.firebaseapp.com",
  projectId: "factory-sim01v",
  storageBucket: "factory-sim01v.appspot.com",
  messagingSenderId: "818674298880",
  appId: "1:818674298880:web:95307171220da8bd8d28e5"
};

// Firebase 앱이 초기화 안된 상태라면 새로 초기화
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firestore 인스턴스 전역 사용
const db = firebase.firestore();
