// Environment variables loader
window.ENV = {};

// Load environment variables from .env file
async function loadEnv() {
    try {
        const response = await fetch('/.env');
        if (response.ok) {
            const envText = await response.text();
            const lines = envText.split('\n');
            
            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    window.ENV[key.trim()] = value.trim();
                }
            });
            
            console.log('Environment variables loaded:', window.ENV);
        }
    } catch (error) {
        console.log('Could not load .env file, using defaults');
    }
}

// Load environment variables when page loads
loadEnv(); 