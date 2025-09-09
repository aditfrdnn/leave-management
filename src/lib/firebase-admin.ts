import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors during hot-reloading.
if (!admin.apps.length) {
  try {
    // Initialize the app with the required credentials and the database URL.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://apps-leave-default-rtdb.firebaseio.com",
    });
  } catch (error: any) {
    // The 'already exists' error can happen in development with hot-reloading.
    // We can safely ignore it, as the app is already initialized.
    if (!/already exists/u.test(error.message)) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
}

// Export the initialized admin instance itself.
export default admin;