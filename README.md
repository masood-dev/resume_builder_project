# Interactive Resume Builder

A modern, single-page web application that allows users to create professional resumes with real-time preview and cloud synchronization.

## Features

- **User Authentication**: Secure login/registration with email/password and Google Sign-In
- **Real-time Preview**: Live resume preview as you type with A4-printable layout
- **Cloud Sync**: Automatic saving to Firebase Firestore with real-time synchronization across devices
- **Comprehensive Sections**: 
  - Personal details (name, title, contact info)
  - Professional summary
  - Skills
  - Work experience with bullet points
  - Education history
  - Languages
  - References
- **Beautiful UI**: Animated gradient background with smooth transitions and modern design
- **Print/PDF Export**: Optimized print styles for creating PDF resumes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML5, CSS3, Tailwind CSS
- **Fonts**: Google Fonts (Inter)
- **Backend**: Firebase Authentication & Firestore
- **Hosting**: Static hosting ready (GitHub Pages, Netlify, Vercel compatible)

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project (for authentication and database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/masood-dev/resume_builder_project.git
cd resume_builder_project/resume_builder_website
```

2. Open `index.html` in your browser, or serve it locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx live-server .

# Using Vite
npx vite
```

3. Visit `http://localhost:8000` (or the appropriate port) in your browser

### Firebase Setup

The project uses Firebase for authentication and data storage. The Firebase configuration is already included in the code, but you can replace it with your own:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google providers)
3. Create a Firestore database
4. Replace the `firebaseConfig` object in `index.html` with your credentials

## Usage

1. **Sign Up/Login**: Create an account or sign in with email/password or Google
2. **Fill in Details**: Complete the form fields in the left panel
3. **Add Dynamic Content**: 
   - Click "Add Skill" to add skills
   - Fill experience/education forms and click "Add" buttons
   - Add languages and references as needed
4. **Preview**: Watch the right panel update in real-time
5. **Save**: Changes auto-save to the cloud (debounced after 1 second of inactivity)
6. **Print/Export**: Click "Print / Download PDF" button and use browser's print dialog to save as PDF

## Project Structure

```
resume_builder_website/
├── index.html          # Main application file (HTML, CSS, JS)
└── README.md          # This file
```

## Firestore Data Structure

```
artifacts/
└── {appId}/
    └── users/
        └── {userId}/
            └── resumeData/
                └── main (document)
                    ├── name
                    ├── title
                    ├── email
                    ├── phone
                    ├── location
                    ├── summary
                    ├── skills: []
                    ├── experiences: []
                    ├── educations: []
                    ├── languages: []
                    └── references: []
```

## Security Notes

- Firebase web API keys in the code are safe for client-side use
- **Never commit** service account JSON files or server-side secrets
- Set up Firestore Security Rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Future Enhancements

- [ ] Split into separate CSS/JS files for better maintainability
- [ ] Add multiple resume templates/themes
- [ ] Export/import resume data as JSON
- [ ] Add resume sections (projects, certifications, hobbies)
- [ ] Implement offline support with local storage fallback
- [ ] Add unit and E2E tests
- [ ] Set up CI/CD pipeline
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add input validation and sanitization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**Masood**
- GitHub: [@masood-dev](https://github.com/masood-dev)

## Acknowledgments

- Tailwind CSS for the styling framework
- Firebase for backend services
- Google Fonts for the Inter font family

---

**Note**: This is a client-side application. For production use, consider implementing proper Firestore security rules and adding server-side validation.
