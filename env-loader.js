// Environment variables loader for Vercel
window.ENV = {};

// Load environment variables from Vercel API
async function loadEnv() {
    try {
        console.log('Loading environment variables from Vercel...');
        const response = await fetch('/api/env');
        if (response.ok) {
            window.ENV = await response.json();
            console.log('Environment variables loaded from Vercel:', window.ENV);
            
            // Trigger app initialization after env is loaded
            if (window.initializeApp) {
                window.initializeApp();
            }
        } else {
            console.log('Could not load environment variables from Vercel, status:', response.status);
        }
    } catch (error) {
        console.log('Error loading environment variables:', error);
    }
}

// Load environment variables when page loads
loadEnv();
