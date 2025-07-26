// Environment variables loader for Vercel
window.ENV = {};

// Load environment variables from Vercel API
async function loadEnv() {
    try {
        const response = await fetch('/api/env');
        if (response.ok) {
            window.ENV = await response.json();
            console.log('Environment variables loaded from Vercel:', window.ENV);
        } else {
            console.log('Could not load environment variables from Vercel');
        }
    } catch (error) {
        console.log('Error loading environment variables:', error);
    }
}

// Load environment variables when page loads
loadEnv();
