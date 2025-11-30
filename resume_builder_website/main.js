// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithCustomToken, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    onSnapshot,
    setLogLevel
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// --- GLOBAL VARIABLES ---
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA8uinaPyv3WgLWheOpo6IIrzOo_xbwED0",
    authDomain: "resume-builder-cd571.firebaseapp.com",
    projectId: "resume-builder-cd571",
    storageBucket: "resume-builder-cd571.firebasestorage.app",
    messagingSenderId: "823843670189",
    appId: "1:823843670189:web:59c8efd6b18c13ddc55e24",
    measurementId: "G-D0S2E97KYB"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
setLogLevel('Debug'); // Enable Firestore logging

let userId = null;
let resumeDocRef = null;
let unsubscribeResume = null; // To detach the onSnapshot listener

// --- STATE ---
let skills = [];
let experiences = [];
let educations = [];
let languages = [];
let references = [];

// --- APP VIEWS ---
const loadingView = document.getElementById('loading-view');
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');

// --- AUTH SELECTORS ---
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const welcomeMsg = document.getElementById('welcome-msg');
const googleSignInBtn = document.getElementById('google-signin-btn');
const githubSignInBtn = document.getElementById('github-signin-btn');

// Google Modal Selectors
const googleModal = document.getElementById('google-modal');
const closeGoogleModal = document.getElementById('close-google-modal');
const googlePopupSignin = document.getElementById('google-popup-signin');
const googleAnotherAccount = document.getElementById('google-another-account');

// --- FORM SELECTORS ---
const form = document.getElementById('resume-form');
const nameInput = document.getElementById('name');
const titleInput = document.getElementById('title');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const locationInput = document.getElementById('location');
const summaryInput = document.getElementById('summary');

// Static Preview Selectors
const previewName = document.getElementById('preview-name');
const previewTitle = document.getElementById('preview-title');
const previewLocation = document.getElementById('preview-contact-location');
const previewPhone = document.getElementById('preview-contact-phone');
const previewEmail = document.getElementById('preview-contact-email');
const previewSummary = document.getElementById('preview-summary');

// Dynamic Input Selectors
const skillInput = document.getElementById('skill-input');
const addSkillBtn = document.getElementById('add-skill-btn');
const skillsListForm = document.getElementById('skills-list-form');

const addExpBtn = document.getElementById('add-exp-btn');
const expListForm = document.getElementById('exp-list-form');

const addEduBtn = document.getElementById('add-edu-btn');
const eduListForm = document.getElementById('edu-list-form');

const languageInput = document.getElementById('language-input');
const addLanguageBtn = document.getElementById('add-language-btn');
const languagesListForm = document.getElementById('languages-list-form');

const addRefBtn = document.getElementById('add-ref-btn');
const refListForm = document.getElementById('ref-list-form');

// Dynamic Preview Selectors
const previewSkills = document.getElementById('preview-skills');
const previewExperience = document.getElementById('preview-experience');
const previewEducation = document.getElementById('preview-education');
const previewLanguages = document.getElementById('preview-languages');
const previewReferences = document.getElementById('preview-references');

// Print Button
const printBtn = document.getElementById('print-btn');

// --- DEBOUNCE UTILITY ---
let debounceTimer;
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// --- FIREBASE & DATA FUNCTIONS ---

/**
 * Saves the entire resume state to Firestore.
 */
async function saveResumeData() {
    if (!resumeDocRef) return;
    console.log('Saving data...');
    
    const data = {
        name: nameInput.value,
        title: titleInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        location: locationInput.value,
        summary: summaryInput.value,
        skills: skills,
        experiences: experiences,
        educations: educations,
        languages: languages,
        references: references
    };
    
    try {
        await setDoc(resumeDocRef, data, { merge: true });
        console.log('Data saved successfully.');
    } catch (error) {
        console.error("Error saving document: ", error);
    }
}

// Create a debounced version of the save function
const debouncedSave = debounce(saveResumeData, 1000);

/**
 * Loads resume data from Firestore and sets up a real-time listener.
 */
function loadResumeData() {
    if (!resumeDocRef) return;

    // Detach any existing listener
    if (unsubscribeResume) {
        unsubscribeResume();
    }

    console.log('Setting up snapshot listener for resume data...');
    unsubscribeResume = onSnapshot(resumeDocRef, (doc) => {
        if (doc.exists()) {
            console.log("Current data: ", doc.data());
            const data = doc.data();
            
            // Update form fields
            nameInput.value = data.name || '';
            titleInput.value = data.title || '';
            emailInput.value = data.email || '';
            phoneInput.value = data.phone || '';
            locationInput.value = data.location || '';
            summaryInput.value = data.summary || '';
            
            // Update local state arrays
            skills = data.skills || [];
            experiences = data.experiences || [];
            educations = data.educations || [];
            languages = data.languages || [];
            references = data.references || [];
            
            // Re-render everything with the new data
            renderAllFormLists();
            renderAll();
            
        } else {
            console.log("No resume data found for this user. Starting fresh.");
            // Reset fields if no data
            resetLocalData();
            renderAllFormLists();
            renderAll();
        }
    }, (error) => {
        console.error("Error listening to document: ", error);
    });
}

/**
 * Resets local state variables and clears form fields.
 */
function resetLocalData() {
    skills = [];
    experiences = [];
    educations = [];
    languages = [];
    references = [];
    
    nameInput.value = '';
    titleInput.value = '';
    emailInput.value = '';
    phoneInput.value = '';
    locationInput.value = '';
    summaryInput.value = '';
}

// --- RENDER FUNCTIONS ---

/**
 * Helper function to capitalize first letter of each word
 */
function capitalizeText(text) {
    if (!text) return text;
    return text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function renderAllFormLists() {
    renderSkillsFormList();
    renderExpFormList();
    renderEduFormList();
    renderLanguagesFormList();
    renderRefFormList();
}

/**
 * Updates the static fields in the resume preview.
 */
function renderStaticPreview() {
    previewName.textContent = capitalizeText(nameInput.value) || 'Your Name';
    previewTitle.textContent = capitalizeText(titleInput.value) || 'Your Professional Title';
    previewLocation.textContent = capitalizeText(locationInput.value) || 'Location';
    previewPhone.textContent = phoneInput.value || 'Phone';
    previewEmail.textContent = emailInput.value || 'Email';

    previewSummary.textContent = capitalizeText(summaryInput.value) || 'Your professional summary will appear here...';
}

/**
 * Renders the list of added skills in the form.
 */
function renderSkillsFormList() {
    skillsListForm.innerHTML = '';
    skills.forEach((skill, index) => {
        const skillTag = document.createElement('div');
        skillTag.className = 'flex justify-between items-center bg-gray-100 p-2 rounded-md';
        skillTag.innerHTML = `
            <span>${skill}</span>
            <button data-index="${index}" class="remove-skill-btn text-red-500 font-bold px-2 rounded hover:text-red-700">X</button>
        `;
        skillsListForm.appendChild(skillTag);
    });
}

/**
 * Renders the list of added experiences in the form.
 */
function renderExpFormList() {
    expListForm.innerHTML = '';
    experiences.forEach((exp, index) => {
        const expTag = document.createElement('div');
        expTag.className = 'flex justify-between items-center bg-gray-100 p-2 rounded-md';
        expTag.innerHTML = `
            <span><strong>${exp.title}</strong> at ${exp.company}</span>
            <button data-index="${index}" class="remove-exp-btn text-red-500 font-bold px-2 rounded hover:text-red-700">X</button>
        `;
        expListForm.appendChild(expTag);
    });
}

/**
 * Renders the list of added education in the form.
 */
function renderEduFormList() {
    eduListForm.innerHTML = '';
    educations.forEach((edu, index) => {
        const eduTag = document.createElement('div');
        eduTag.className = 'flex justify-between items-center bg-gray-100 p-2 rounded-md';
        eduTag.innerHTML = `
            <span><strong>${edu.degree}</strong> at ${edu.school}</span>
            <button data-index="${index}" class="remove-edu-btn text-red-500 font-bold px-2 rounded hover:text-red-700">X</button>
        `;
        eduListForm.appendChild(eduTag);
    });
}

/**
 * Renders the list of added languages in the form.
 */
function renderLanguagesFormList() {
    languagesListForm.innerHTML = '';
    languages.forEach((language, index) => {
        const langTag = document.createElement('div');
        langTag.className = 'flex justify-between items-center bg-gray-100 p-2 rounded-md';
        langTag.innerHTML = `
            <span>${language}</span>
            <button data-index="${index}" class="remove-language-btn text-red-500 font-bold px-2 rounded hover:text-red-700">X</button>
        `;
        languagesListForm.appendChild(langTag);
    });
}

/**
 * Renders the list of added references in the form.
 */
function renderRefFormList() {
    refListForm.innerHTML = '';
    references.forEach((ref, index) => {
        const refTag = document.createElement('div');
        refTag.className = 'flex justify-between items-center bg-gray-100 p-2 rounded-md';
        refTag.innerHTML = `
            <span><strong>${ref.name}</strong> - ${ref.company}</span>
            <button data-index="${index}" class="remove-ref-btn text-red-500 font-bold px-2 rounded hover:text-red-700">X</button>
        `;
        refListForm.appendChild(refTag);
    });
}

/**
 * Renders the dynamic skills list in the preview.
 */
function renderSkillsPreview() {
    previewSkills.innerHTML = '';
    if (skills.length === 0) return;
    
    skills.forEach(skill => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-2';
        li.innerHTML = `
            <span class="text-gray-600">•</span>
            <span class="text-gray-700">${capitalizeText(skill)}</span>
        `;
        previewSkills.appendChild(li);
    });
}

/**
 * Renders the dynamic experience list in the preview.
 * Formats bullet points from asterisks (*).
 */
function renderExperiencePreview() {
    previewExperience.innerHTML = '';
    if (experiences.length === 0) return;
    
    experiences.forEach(exp => {
        // Format description bullet points
        const descriptionHtml = exp.desc
            .split('*') // Split by asterisk
            .filter(line => line.trim() !== '') // Remove empty lines
            .map(line => `<li class="text-xs">${capitalizeText(line.trim())}</li>`) // Wrap each line in <li> and capitalize
            .join('');

        const expEntry = document.createElement('div');
        expEntry.className = 'mb-4';
        expEntry.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <h3 class="text-sm font-bold text-gray-900">${capitalizeText(exp.company)}</h3>
                <span class="text-xs text-gray-600">${exp.startDate} - ${exp.endDate}</span>
            </div>
            <p class="text-xs italic text-gray-700 mb-1">${capitalizeText(exp.title)}</p>
            <ul class="list-disc list-inside text-xs text-gray-700 space-y-1">
                ${descriptionHtml}
            </ul>
        `;
        previewExperience.appendChild(expEntry);
    });
}

/**
 * Renders the dynamic education list in the preview.
 */
function renderEducationPreview() {
    previewEducation.innerHTML = '';
    if (educations.length === 0) return;

    educations.forEach(edu => {
        const eduEntry = document.createElement('div');
        eduEntry.className = 'mb-4';
        eduEntry.innerHTML = `
            <h3 class="text-sm font-bold text-gray-900">${capitalizeText(edu.degree)}</h3>
            <p class="text-xs text-gray-700">${capitalizeText(edu.school)}</p>
            <p class="text-xs text-gray-600">(${edu.startDate} - ${edu.endDate})</p>
        `;
        previewEducation.appendChild(eduEntry);
    });
}

/**
 * Renders the dynamic languages list in the preview.
 */
function renderLanguagesPreview() {
    previewLanguages.innerHTML = '';
    if (languages.length === 0) return;
    
    languages.forEach(language => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-2';
        li.innerHTML = `
            <span class="text-gray-600">•</span>
            <span class="text-gray-700">${capitalizeText(language)}</span>
        `;
        previewLanguages.appendChild(li);
    });
}

/**
 * Renders the dynamic references list in the preview.
 */
function renderReferencesPreview() {
    previewReferences.innerHTML = '';
    if (references.length === 0) return;

    references.forEach(ref => {
        const refEntry = document.createElement('div');
        refEntry.className = 'text-xs';
        refEntry.innerHTML = `
            <h3 class="font-bold text-gray-900">${capitalizeText(ref.name)}</h3>
            <p class="text-gray-700">${capitalizeText(ref.company)} / ${capitalizeText(ref.title)}</p>
            <p class="text-gray-600"><strong>Phone:</strong> ${ref.phone}</p>
            <p class="text-gray-600"><strong>Email:</strong> ${ref.email}</p>
        `;
        previewReferences.appendChild(refEntry);
    });
}

/**
 * Main render function to update the entire preview.
 */
function renderAll() {
    renderStaticPreview();
    renderSkillsPreview();
    renderExperiencePreview();
    renderEducationPreview();
    renderLanguagesPreview();
    renderReferencesPreview();
}

// --- AUTHENTICATION LOGIC ---

// Handle Auth State Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log('User is logged in:', user.uid);
        userId = user.uid;
        // Define the path to the user's private resume data
        resumeDocRef = doc(db, 'artifacts', appId, 'users', userId, 'resumeData', 'main');
        
        welcomeMsg.textContent = `Welcome, ${user.email}`;
        
        // Load user's data
        loadResumeData();
        
        // Show app, hide auth
        appView.classList.remove('hidden');
        authView.classList.add('hidden');
        loadingView.classList.add('hidden');
        
    } else {
        // User is signed out
        console.log('User is logged out.');
        userId = null;
        resumeDocRef = null;
        
        // Detach listener if it exists
        if (unsubscribeResume) {
            unsubscribeResume();
            unsubscribeResume = null;
        }
        
        // Reset all local data and UI
        resetLocalData();
        renderAllFormLists();
        renderAll();
        
        // Show auth, hide app
        appView.classList.add('hidden');
        authView.classList.remove('hidden');
        loadingView.classList.add('hidden');
    }
});

// Sign in with environment's custom token (MANDATORY)
async function signIn() {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            console.log('Signing in with custom token...');
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            console.log('No custom token, user needs to log in manually or register.');
            // If no token, we just let onAuthStateChanged handle showing the authView
            loadingView.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error signing in:', error);
        loadingView.classList.add('hidden');
        authView.classList.remove('hidden');
    }
}

// --- PASSWORD VISIBILITY TOGGLE ---

// Toggle Login Password
const toggleLoginPassword = document.getElementById('toggle-login-password');
const loginPasswordInput = document.getElementById('login-password');
const loginEyeOpen = document.getElementById('login-eye-open');
const loginEyeClosed = document.getElementById('login-eye-closed');

toggleLoginPassword.addEventListener('click', () => {
    if (loginPasswordInput.type === 'password') {
        loginPasswordInput.type = 'text';
        loginEyeOpen.classList.add('hidden');
        loginEyeClosed.classList.remove('hidden');
    } else {
        loginPasswordInput.type = 'password';
        loginEyeOpen.classList.remove('hidden');
        loginEyeClosed.classList.add('hidden');
    }
});

// Toggle Register Password
const toggleRegisterPassword = document.getElementById('toggle-register-password');
const registerPasswordInput = document.getElementById('register-password');
const registerEyeOpen = document.getElementById('register-eye-open');
const registerEyeClosed = document.getElementById('register-eye-closed');

toggleRegisterPassword.addEventListener('click', () => {
    if (registerPasswordInput.type === 'password') {
        registerPasswordInput.type = 'text';
        registerEyeOpen.classList.add('hidden');
        registerEyeClosed.classList.remove('hidden');
    } else {
        registerPasswordInput.type = 'password';
        registerEyeOpen.classList.remove('hidden');
        registerEyeClosed.classList.add('hidden');
    }
});

// Auth Tab Switching
tabLogin.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('text-blue-600', 'border-blue-600');
    tabLogin.classList.remove('text-gray-500', 'border-transparent');
    tabRegister.classList.add('text-gray-500', 'border-transparent');
    tabRegister.classList.remove('text-blue-600', 'border-blue-600');
    authError.textContent = '';
});

tabRegister.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabRegister.classList.add('text-blue-600', 'border-blue-600');
    tabRegister.classList.remove('text-gray-500', 'border-transparent');
    tabLogin.classList.add('text-gray-500', 'border-transparent');
    tabLogin.classList.remove('text-blue-600', 'border-blue-600');
    authError.textContent = '';
});

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    authError.textContent = '';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error('Login error:', error.message);
        authError.textContent = error.message;
    }
});

// Register Form Submit
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    authError.textContent = '';

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error('Register error:', error.message);
        authError.textContent = error.message;
    }
});

// Google Sign-In Button - Show Modal
googleSignInBtn.addEventListener('click', () => {
    authError.textContent = '';
    googleModal.classList.remove('hidden');
});

// GitHub Sign-In Button
githubSignInBtn.addEventListener('click', async () => {
    authError.textContent = '';
    const provider = new GithubAuthProvider();
    provider.addScope('user:email'); // Request email scope
    
    try {
        const result = await signInWithPopup(auth, provider);
        console.log('GitHub sign-in successful:', result.user.email);
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error('GitHub sign-in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        authError.textContent = `GitHub sign-in failed: ${error.message}`;
    }
});

// Close Google Modal
closeGoogleModal.addEventListener('click', () => {
    googleModal.classList.add('hidden');
});

// Close modal when clicking outside
googleModal.addEventListener('click', (e) => {
    if (e.target === googleModal) {
        googleModal.classList.add('hidden');
    }
});

// Google Popup Sign-In (from modal)
googlePopupSignin.addEventListener('click', async () => {
    authError.textContent = '';
    const provider = new GoogleAuthProvider();
    
    try {
        await signInWithPopup(auth, provider);
        googleModal.classList.add('hidden');
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error('Google sign-in error:', error.message);
        googleModal.classList.add('hidden');
        authError.textContent = error.message;
    }
});

// Google Another Account (from modal)
googleAnotherAccount.addEventListener('click', async () => {
    authError.textContent = '';
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    try {
        await signInWithPopup(auth, provider);
        googleModal.classList.add('hidden');
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error('Google sign-in error:', error.message);
        googleModal.classList.add('hidden');
        authError.textContent = error.message;
    }
});

// Logout Button
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // onAuthStateChanged will handle the UI switch
    } catch (error) {
        console.error('Logout error:', error.message);
    }
});


// --- EVENT LISTENERS (FOR DATA CHANGES) ---

// Update static fields on any form input AND save
form.addEventListener('input', (e) => {
    // Only trigger for main form inputs, not dynamic list inputs
    if (e.target.id.startsWith('exp-') || e.target.id.startsWith('edu-') || e.target.id.startsWith('skill-')) {
        return;
    }
    renderStaticPreview();
    debouncedSave();
});

// Add Skill
addSkillBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const skill = skillInput.value.trim();
    if (skill) {
        skills.push(skill);
        skillInput.value = '';
        renderSkillsFormList();
        renderSkillsPreview();
        debouncedSave(); // Save changes
    }
});

// Remove Skill (using event delegation)
skillsListForm.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-skill-btn')) {
        const index = e.target.dataset.index;
        skills.splice(index, 1);
        renderSkillsFormList();
        renderSkillsPreview();
        debouncedSave(); // Save changes
    }
});

// Add Experience
addExpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const exp = {
        title: document.getElementById('exp-title').value,
        company: document.getElementById('exp-company').value,
        location: document.getElementById('exp-location').value,
        startDate: document.getElementById('exp-start-date').value,
        endDate: document.getElementById('exp-end-date').value,
        desc: document.getElementById('exp-desc').value,
    };
    
    if (exp.title && exp.company) {
        experiences.push(exp);
        renderExpFormList();
        renderExperiencePreview();
        debouncedSave(); // Save changes
        // Clear inputs
        document.getElementById('exp-title').value = '';
        document.getElementById('exp-company').value = '';
        document.getElementById('exp-location').value = '';
        document.getElementById('exp-start-date').value = '';
        document.getElementById('exp-end-date').value = '';
        document.getElementById('exp-desc').value = '';
    }
});

// Remove Experience (using event delegation)
expListForm.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-exp-btn')) {
        const index = e.target.dataset.index;
        experiences.splice(index, 1);
        renderExpFormList();
        renderExperiencePreview();
        debouncedSave(); // Save changes
    }
});

// Add Education
addEduBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const edu = {
        degree: document.getElementById('edu-degree').value,
        school: document.getElementById('edu-school').value,
        location: document.getElementById('edu-location').value,
        startDate: document.getElementById('edu-start-date').value,
        endDate: document.getElementById('edu-end-date').value,
    };
    
    if (edu.degree && edu.school) {
        educations.push(edu);
        renderEduFormList();
        renderEducationPreview();
        debouncedSave(); // Save changes
        // Clear inputs
        document.getElementById('edu-degree').value = '';
        document.getElementById('edu-school').value = '';
        document.getElementById('edu-location').value = '';
        document.getElementById('edu-start-date').value = '';
        document.getElementById('edu-end-date').value = '';
    }
});

// Remove Education (using event delegation)
eduListForm.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-edu-btn')) {
        const index = e.target.dataset.index;
        educations.splice(index, 1);
        renderEduFormList();
        renderEducationPreview();
        debouncedSave(); // Save changes
    }
});

// Add Language
addLanguageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const language = languageInput.value.trim();
    if (language) {
        languages.push(language);
        languageInput.value = '';
        renderLanguagesFormList();
        renderLanguagesPreview();
        debouncedSave(); // Save changes
    }
});

// Remove Language (using event delegation)
languagesListForm.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-language-btn')) {
        const index = e.target.dataset.index;
        languages.splice(index, 1);
        renderLanguagesFormList();
        renderLanguagesPreview();
        debouncedSave(); // Save changes
    }
});

// Add Reference
addRefBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const ref = {
        name: document.getElementById('ref-name').value,
        title: document.getElementById('ref-title').value,
        company: document.getElementById('ref-company').value,
        phone: document.getElementById('ref-phone').value,
        email: document.getElementById('ref-email').value,
    };
    
    if (ref.name && ref.company) {
        references.push(ref);
        renderRefFormList();
        renderReferencesPreview();
        debouncedSave(); // Save changes
        // Clear inputs
        document.getElementById('ref-name').value = '';
        document.getElementById('ref-title').value = '';
        document.getElementById('ref-company').value = '';
        document.getElementById('ref-phone').value = '';
        document.getElementById('ref-email').value = '';
    }
});

// Remove Reference (using event delegation)
refListForm.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-ref-btn')) {
        const index = e.target.dataset.index;
        references.splice(index, 1);
        renderRefFormList();
        renderReferencesPreview();
        debouncedSave(); // Save changes
    }
});

// Print Button
printBtn.addEventListener('click', () => {
    window.print();
});

// --- INITIALIZATION ---

// Initial Render (to set placeholders)
renderAll();

// Start the authentication process
signIn();
