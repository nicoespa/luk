// Environment variables loader for Vercel
window.ENV = {};

// Load environment variables from Vercel
function loadEnv() {
    try {
        // Vercel environment variables are available at build time
        // They will be injected by Vercel automatically
        console.log('Environment variables will be loaded by Vercel');
    } catch (error) {
        console.log('Using fallback environment variables');
    }
}

// Load environment variables when page loads
loadEnv();
