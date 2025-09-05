#!/usr/bin/env node

/**
 * Manager Account Initialization Script
 * 
 * This script creates a new manager account for the Volunteer Management System.
 * It provides a user-friendly interface to set up the first manager account.
 * 
 * Usage: node scripts/init-manager.js
 */

import readline from 'readline';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/"/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  // .env file doesn't exist or can't be read, that's okay
  console.log('Note: .env file not found. Make sure to set environment variables.');
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`[SUCCESS] ${message}`, colors.green);
const logError = (message) => log(`[ERROR] ${message}`, colors.red);
const logWarning = (message) => log(`[WARNING] ${message}`, colors.yellow);
const logInfo = (message) => log(`[INFO] ${message}`, colors.blue);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Password hashing function (matches the system's implementation)
const createHash = async (password) => {
  try {
    if (crypto && crypto.subtle && crypto.subtle.digest) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.error('crypto.subtle failed, falling back to Node.js crypto');
  }

  // Fallback to Node.js crypto
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Input validation functions
const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (username.length > 50) {
    return 'Username must be less than 50 characters';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }
  return null;
};

const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length === 0) {
    return 'Full name is required';
  }
  if (fullName.length < 2) {
    return 'Full name must be at least 2 characters long';
  }
  if (fullName.length > 100) {
    return 'Full name must be less than 100 characters';
  }
  if (!/^[a-zA-Z\s\u0590-\u05FF\u2000-\u206F\u2E00-\u2E7F]+$/.test(fullName)) {
    return 'Full name can only contain letters, spaces, and Hebrew characters';
  }
  return null;
};

const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }
  return null;
};

// Function to check if username already exists
const checkUsernameExists = async (username) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    logWarning(`Could not check username availability: ${error.message}`);
    logInfo('Skipping username uniqueness check...');
    return false; // Allow the username to proceed
  }
};

// Function to get user input with validation
const getInput = (question, validator, asyncValidator = null) => {
  return new Promise((resolve) => {
    const askQuestion = () => {
      rl.question(question, async (answer) => {
        const trimmedAnswer = answer.trim();
        
        // Basic validation
        const validationError = validator(trimmedAnswer);
        if (validationError) {
          logError(validationError);
          askQuestion();
          return;
        }

        // Async validation (like checking if username exists)
        if (asyncValidator) {
          logInfo('Checking availability...');
          const exists = await asyncValidator(trimmedAnswer);
          if (exists) {
            logError('This username is already taken. Please choose a different one.');
            askQuestion();
            return;
          }
        }

        resolve(trimmedAnswer);
      });
    };
    askQuestion();
  });
};

// Function to get password input
const getPasswordInput = (question) => {
  return new Promise((resolve) => {
    const askQuestion = () => {
      rl.question(question, (answer) => {
        const validationError = validatePassword(answer);
        if (validationError) {
          logError(validationError);
          askQuestion();
          return;
        }
        resolve(answer);
      });
    };
    askQuestion();
  });
};

// Function to get confirmation input
const getConfirmation = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      const lowerAnswer = answer.toLowerCase().trim();
      if (lowerAnswer === 'y' || lowerAnswer === 'yes' || lowerAnswer === '') {
        resolve(true);
      } else if (lowerAnswer === 'n' || lowerAnswer === 'no') {
        resolve(false);
      } else {
        logError('Please enter "y" or "n"');
        getConfirmation(question).then(resolve);
      }
    });
  });
};

// Main function to create manager account
const createManagerAccount = async () => {
  try {
    log('\n' + '='.repeat(60), colors.cyan);
    log('VOLUNTEER MANAGEMENT SYSTEM - MANAGER SETUP', colors.bright + colors.cyan);
    log('='.repeat(60), colors.cyan);
    log('\nThis script will help you create the first manager account for your system.\n');

    // Check if any managers already exist
    logInfo('Checking for existing managers...');
    try {
      const usersRef = collection(db, 'users');
      const managerQuery = query(usersRef, where('role', '==', 'manager'));
      const managerSnapshot = await getDocs(managerQuery);
      
      if (!managerSnapshot.empty) {
        logWarning('Manager accounts already exist in the system.');
        const continueAnyway = await getConfirmation('Do you want to create another manager account? (Y/n): ');
        if (!continueAnyway) {
          log('Setup cancelled by user.', colors.yellow);
          rl.close();
          process.exit(0);
          return;
        }
      }
    } catch (error) {
      logWarning(`Could not check for existing managers: ${error.message}`);
      logInfo('Continuing with account creation...');
    }

    // Collect manager information
    log('\nPlease provide the following information:\n');

    const username = await getInput(
      'Username: ',
      validateUsername,
      checkUsernameExists
    );

    const fullName = await getInput(
      'Full Name: ',
      validateFullName
    );

    log('\nPassword Requirements:');
    log('   • At least 8 characters long');
    log('   • Can contain letters, numbers, and special characters');
    log('   • Will be securely hashed before storage\n');

    const password = await getPasswordInput('Password: ');

    // Confirm password
    const confirmPassword = await getPasswordInput('Confirm Password: ');
    if (password !== confirmPassword) {
      logError('Passwords do not match. Please try again.');
      rl.close();
      process.exit(1);
      return;
    }

    // Show summary and confirm
    log('\n' + '='.repeat(60), colors.cyan);
    log('ACCOUNT SUMMARY', colors.bright + colors.cyan);
    log('='.repeat(60), colors.cyan);
    log(`Username: ${username}`);
    log(`Full Name: ${fullName}`);
    log(`Password: ${'*'.repeat(password.length)}`);
    log(`Role: Manager`);
    log(`Status: Active`);
    log('='.repeat(60), colors.cyan);

    const confirm = await getConfirmation('\nDo you want to create this manager account? (Y/n): ');
    if (!confirm) {
      log('Setup cancelled by user.', colors.yellow);
      rl.close();
      process.exit(0);
      return;
    }

    // Create the account
    log('\nCreating manager account...');
    
    const hashedPassword = await createHash(password);
    
    const newManager = {
      username: username,
      passwordHash: hashedPassword,
      fullName: fullName,
      role: 'manager',
      isActive: true,
      createdAt: Timestamp.now()
    };

    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, newManager);
    
    logSuccess('Manager account created successfully!');
    log(`Account ID: ${docRef.id}`);
    log(`Username: ${username}`);
    log(`Full Name: ${fullName}`);
    
    log('\nSetup Complete!', colors.green + colors.bright);
    log('\nNext steps:');
    log('1. Start your application: npm run dev');
    log('2. Navigate to the login page');
    log('3. Use the credentials above to log in as a manager');
    log('4. Change your password after first login for security');
    
    log('\nSecurity Reminder:', colors.yellow);
    log('• Keep these credentials secure');
    log('• Change the default password after first login');
    log('• Consider setting up additional security measures');

    // Exit successfully
    process.exit(0);

  } catch (error) {
    logError(`Failed to create manager account: ${error.message}`);
    log('\nTroubleshooting tips:');
    log('• Check your Firebase configuration');
    log('• Ensure your Firebase project has Firestore enabled');
    log('• Verify your environment variables are set correctly');
    log('• Check your internet connection');
    log('• Ensure Firestore security rules allow writes');
  } finally {
    rl.close();
  }
};

// Check environment variables
const checkEnvironment = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError('Missing required environment variables:');
    missingVars.forEach(varName => {
      log(`  • ${varName}`, colors.red);
    });
    log('\nPlease set these variables in your .env file or environment.');
    log('See the README.md for setup instructions.');
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  try {
    console.log('Starting manager account initialization...');
    checkEnvironment();
    await createManagerAccount();
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  log('\n\nSetup cancelled by user.', colors.yellow);
  rl.close();
  process.exit(0);
});

// Run the script
main();

export { createManagerAccount, createHash }; 