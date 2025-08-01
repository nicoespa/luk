class BlindVisionApp {
    constructor() {
        // Initialize properties
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.liveMode = false;
        this.lastDescription = '';
        this.speechQueue = [];
        this.isSpeaking = false;
        this.isAnalyzing = false;
        
        // Voice command properties
        this.voiceCommandMode = false;
        this.isListening = false;
        
        // Audio management
        this.currentAudio = null;
        this.isPlaying = false; console.log("Audio state: isPlaying = false");
        
        // Device detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log("Device type:", this.isMobile ? "Mobile" : "Desktop");
        
        // API Keys - Load from environment variables or localStorage
        this.apiKey = window.ENV?.OPENAI_API_KEY || localStorage.getItem('openaiKey') || 'your_openai_api_key_here';
        
        // ElevenLabs settings - Load from environment variables or localStorage
        this.elevenLabsKey = window.ENV?.ELEVENLABS_API_KEY || localStorage.getItem('elevenLabsKey') || 'your_elevenlabs_api_key_here';
        this.elevenLabsVoiceId = '21m00Tcm4TlvDq8ikWAM';
        
        // Enable ElevenLabs for natural voice synthesis
        this.useElevenLabs = true;
        
        // Voice recognition for user commands
        this.recognition = null;
        this.isListening = false;
        this.voiceCommandMode = false;
        
        // Double tap detection for voice commands
        this.lastTapTime = 0;
        this.tapCount = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.autoStart();
    }

    initializeElements() {
        this.video = document.getElementById('video');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set up touch/click controls for the entire screen
        document.addEventListener('touchstart', this.handleTouchControl.bind(this));
        document.addEventListener('click', this.handleTouchControl.bind(this));
        
        // Keyboard shortcuts for accessibility
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        console.log("Elements initialized");
    }
    
    initializeVoiceRecognition() {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            console.log("Speech recognition not supported");
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = "es-ES"; // Spanish for better recognition
        
        this.recognition.onstart = () => {
            console.log("Voice recognition started");
            this.isListening = true;
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("Voice command:", transcript);
            this.handleVoiceCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error("Voice recognition error:", event.error);
            this.isListening = false;
        };
        
        this.recognition.onend = () => {
            console.log("Voice recognition ended");
            this.isListening = false;
            // Restart listening after a short delay
            if (this.voiceCommandMode) {
                setTimeout(() => this.startListening(), 1000);
            }
        };
        
        console.log("Voice recognition initialized");
    }
    bindEvents() {
        // Events are handled in initializeElements
    }

    async startCamera() {
        try {
            console.log('Starting camera...');
            // this.speak("Starting camera. Please allow camera permissions when prompted."); // Removed camera message
            
            // Configure camera constraints for mobile devices
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'environment' // Use rear camera on mobile
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            console.log('Camera started successfully');
            this.updateStatus('Camera active', 'ready');
            // this.speak("Camera active. Starting live mode."); // Removed camera active message
            
            // Auto-start live mode for blind users
            setTimeout(() => {
                this.toggleLiveMode();
            }, 1000);
            
        } catch (error) {
            console.error('Camera error:', error);
            this.updateStatus('Camera error', 'error');
            
            if (error.name === 'NotAllowedError') {
                this.speak('Camera access denied. Please allow camera permissions and refresh the page.');
            } else if (error.name === 'NotFoundError') {
                this.speak('No camera found. Please check your device has a camera.');
            } else {
            console.log("Speech synthesis NOT available");
                this.speak('Camera error. Please refresh the page and try again.');
            }
        }
    }

    updateStatus(message, type = 'ready') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            // Remove all classes first
            statusElement.classList.remove('active', 'inactive');
            
            // Add appropriate class based on type
            if (type === 'ready' || type === 'analyzing') {
                statusElement.classList.add('active');
            } else {
            console.log("Speech synthesis NOT available");
                statusElement.classList.add('inactive');
            }
        }
        
        console.log('Status:', message);
    }

    displayDescription(description) {
        // Don't display text on screen - only speak it
        console.log('Description:', description);
    }

    handleTouchControl() {
        console.log('Touch/click detected - toggling live mode');
        this.toggleLiveMode();
    }

    handleKeyPress(e) {
        if (e.key === ' ') { // Space bar
            e.preventDefault();
            this.handleTouchControl();
        }
    }

    toggleLiveMode() {
        this.liveMode = !this.liveMode;
        
        if (this.liveMode) {
            console.log('Live mode activated');
            // this.speak("Live mode activated. I will describe your surroundings."); // Removed live mode message
            this.updateStatus('Live mode active', 'analyzing');
            
            // Start analyzing immediately
            // Removed immediate analysis to prevent duplicates
            
            // Then analyze every 3 seconds
            this.liveInterval = setInterval(() => {
                this.analyzeLiveFrame();
            }, 3000);
        } else {
            console.log("Speech synthesis NOT available");
            console.log('Live mode deactivated');
            // this.speak("Live mode deactivated. Tap to resume."); // Removed deactivation message
            this.updateStatus('Live mode inactive', 'ready');
            
            // Stop the interval
            if (this.liveInterval) {
                clearInterval(this.liveInterval);
                this.liveInterval = null;
            }
        }
    }

    autoStart() {
        console.log("=== AUTOSTART DEBUG ===");
        console.log("Testing browser speech directly...");
        this.speakWithBrowser("Test directo del browser. ¿Puedes escuchar esto?");
        console.log('Auto-starting app for blind users...');
        this.speak("Audio test. Can you hear me?"); // Simple audio test
        this.startCamera();
    }

    async speak(text) {
        console.log('Speak function called with text:', text.substring(0, 50) + '...');
        
        // Strict audio management - only one voice at a time
        if (this.isPlaying || this.isSpeaking) {
            console.log("Resetting stuck audio flags");
            this.isPlaying = false;
            this.isSpeaking = false;
            return;
        }
        
        // Set speaking flag immediately
        this.isSpeaking = true;
        
        // Stop any ongoing audio before starting new speech
        this.stopAllAudio(); await new Promise(resolve => setTimeout(resolve, 500));
        
        // Wait a moment to ensure all audio is stopped
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Use ElevenLabs if available, otherwise use browser speech
        if (this.elevenLabsKey && this.elevenLabsKey !== '' && this.elevenLabsKey !== 'your_elevenlabs_api_key_here') {
            console.log('Using ElevenLabs API key:', this.elevenLabsKey.substring(0, 20) + '...');
            try {
                await this.speakWithElevenLabs(text);
                console.log('ElevenLabs speech completed successfully');
            } catch (error) {
                console.log("ElevenLabs failed, using browser fallback");
                this.speakWithBrowser(text); // Enabled browser fallback
            }
        } else {
            console.log("Speech synthesis NOT available");
            console.log("ElevenLabs API key not found, using browser fallback");
            this.speakWithBrowser(text); // Enabled browser fallback
        }
    }

    stopAllAudio() {
        console.log('Stopping all audio sources...');
        
        // Stop current audio if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio.src = '';
            this.currentAudio = null;
        }
        
        // Stop all audio elements
        const allAudios = document.querySelectorAll('audio');
        allAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
        });
        
        // Cancel speech synthesis
        if ('speechSynthesis' in window) {
            console.log("Speech synthesis is available");
            speechSynthesis.cancel();
            speechSynthesis.pause();
        }
        
        // Clear any ongoing audio context
        if (window.audioContext) {
            window.audioContext.close();
        }
        
        this.isPlaying = false; console.log("Audio state: isPlaying = false");
        console.log('All audio sources stopped');
    }

    async speakWithElevenLabs(text) { 
        console.log('ElevenLabs speech function called');
        
        // Don't start if already playing
        if (this.isPlaying || this.isSpeaking) {
            // Removed redundant check
            return;
        }
        
        // Stop any existing audio before starting
        this.stopAllAudio(); await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenLabsKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status} - ${response.statusText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;
            
            // Set as current audio
            this.currentAudio = audio;
            this.isPlaying = true; console.log("Audio state: isPlaying = true");
            
            audio.onloadstart = () => {
                console.log('ElevenLabs audio loading started');
            };
            
            audio.oncanplay = () => {
                console.log('ElevenLabs audio ready to play');
            };
            
            audio.onplay = () => {
                console.log('ElevenLabs audio playing');
            };
            
            audio.onended = () => {
                console.log('ElevenLabs audio finished');
                this.isPlaying = false; console.log("Audio state: isPlaying = false");
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = (error) => {
                console.error('ElevenLabs audio error:', error);
                this.isPlaying = false; console.log("Audio state: isPlaying = false");
                this.currentAudio = null;
                throw new Error('Audio playback failed');
            };
            
            await audio.play();
            console.log('ElevenLabs audio playback started successfully');
            
        } catch (error) {
            console.error('ElevenLabs speech error:', error);
            this.isPlaying = false; console.log("Audio state: isPlaying = false");
            this.currentAudio = null;
            throw error;
        }
    }

    speakWithBrowser(text) {
        console.log("=== BROWSER SPEECH DEBUG ===");
        console.log("Text to speak:", text);
        console.log("Window object:", typeof window);
        console.log("SpeechSynthesis available:", 'speechSynthesis' in window);
        console.log("Browser speech function called with text:", text.substring(0, 50) + "...");
        if ('speechSynthesis' in window) {
            console.log("Speech synthesis is available");
            console.log('Using browser speech synthesis');
            
            // Cancel any ongoing speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;  // Slightly faster for better flow
            utterance.pitch = 1.1;  // Slightly higher for warmth
            utterance.volume = 1.0;
            
            // Try to use the best available English voice
            const voices = speechSynthesis.getVoices();
            let bestVoice = null;
            
            // Priority order for better voices
            const voicePreferences = [
                voice => voice.name.includes('Samantha') && voice.lang.includes('en'),
                voice => voice.name.includes('Alex') && voice.lang.includes('en'),
                voice => voice.name.includes('Victoria') && voice.lang.includes('en'),
                voice => voice.name.includes('Google') && voice.lang.includes('en'),
                voice => voice.name.includes('Natural') && voice.lang.includes('en'),
                voice => voice.lang.includes('en') && !voice.name.includes('Microsoft')
            ];
            
            for (const preference of voicePreferences) {
                bestVoice = voices.find(preference);
                if (bestVoice) {
                    console.log('Using browser voice:', bestVoice.name);
                    break;
                }
            }
            
            if (bestVoice) {
                utterance.voice = bestVoice;
            }
            
            utterance.onstart = () => {
                console.log('Browser speech started');
            };
            
            utterance.onend = () => {
                console.log('Browser speech ended');
            };
            
            utterance.onerror = (event) => {
                console.error('Browser speech error:', event.error);
            };
            
            speechSynthesis.speak(utterance);
        }
    }

    captureFrame() {
        if (!this.video || !this.video.videoWidth) {
            console.log('Video not ready for capture');
            return null;
        }
        
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0);
        
        return this.canvas.toDataURL('image/jpeg', 0.8);
    }

    async callOpenAIVision(imageData) {
        try {
            console.log('Calling OpenAI Vision API...');
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a visual assistant specifically designed for blind users. Your descriptions should help with navigation, safety, and spatial awareness. Focus on practical information that a blind person would need to move around safely and efficiently. Use clear, direct language and prioritize information about obstacles, pathways, and spatial relationships.'
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `You are a visual assistant for a blind person. Describe what you see in a way that helps them navigate and understand their environment. Focus on:

1. **Obstacles and safety**: Stairs, steps, walls, furniture edges, objects in the path
2. **Spatial information**: Distance to objects, room layout, open spaces vs. confined areas
3. **Navigation cues**: Doorways, hallways, pathways, exits
4. **Practical details**: What's within reach, what's on surfaces, object locations
5. **Environmental context**: Lighting conditions, room type, general atmosphere

Keep descriptions concise (2-3 sentences) and immediately actionable. Use spatial language like "to your left", "ahead of you", "within arm's reach".

Describe in English with clear, direct language suitable for someone who cannot see.`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: imageData
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('OpenAI API error:', response.status, errorText);
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const description = data.choices[0].message.content;
            
            console.log('OpenAI response:', description);
            return description;
            
        } catch (error) {
            console.error('OpenAI Vision API error:', error);
            throw error;
        }
    }

    async analyzeFrame() {
        if (!this.stream) {
            console.log('No camera stream available');
            this.speak('Camera not available. Please check camera permissions.');
            return;
        }
        
        try {
            console.log('Analyzing frame...');
            this.updateStatus('Analyzing...', 'analyzing');
            
            const imageData = this.captureFrame();
            if (!imageData) {
                throw new Error('Failed to capture image');
            }
            
            console.log('Image captured, calling OpenAI...');
            const description = await this.callOpenAIVision(imageData);
            
            console.log('OpenAI response received:', description);
            
            // Check if description is significantly different from last one
            if (this.isSignificantlyDifferent(description)) {
                this.displayDescription(description);
                this.speak(description);
                this.lastDescription = description;
            } else {
            console.log("Speech synthesis NOT available");
                console.log('Description too similar, not speaking');
            }
            
            this.updateStatus('Analysis complete', 'ready');
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.updateStatus('Analysis failed', 'error');
            // this.speak("Analysis failed. Please try again."); // Removed error message
        }
    }

    isSignificantlyDifferent(newDescription) {
        if (!this.lastDescription) return true;
        
        // Simple similarity check - if descriptions are very similar, don't repeat
        const similarity = this.calculateSimilarity(this.lastDescription, newDescription);
        return similarity < 0.8; // Speak if less than 80% similar
    }

    calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = new Set([...words1, ...words2]).size;
        
        return commonWords.length / totalWords;
    }

    analyzeLiveFrame() {
        if (!this.liveMode || this.isPlaying) {
            return;
        }
        
        this.analyzeFrame();
    }


    stopLiveMode() {
        if (!this.liveMode) return;
        
        this.liveMode = false;
        console.log('Live mode stopped');
        // this.speak("Live mode stopped."); // Removed live mode stop message
        
        if (this.liveInterval) {
            clearInterval(this.liveInterval);
            this.liveInterval = null;
        }
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.initializeApp = () => new BlindVisionApp();
}); 