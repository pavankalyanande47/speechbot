// speechbot.js - SpeechBot Widget for Client Websites with Text-to-Speech
class SpeechBot {
    constructor(website) {
        this.website = website;
        this.apiBaseUrl = 'https://fidgetingly-testable-christoper.ngrok-free.dev';
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isSpeaking = false;
        this.hasWelcomed = false;
        this.speechQueue = [];
        this.currentUtterance = null;
        this.isProcessingQueue = false;
        this.shouldBeListening = false;
        this.shouldBeListeningAfterSpeech = false;
        this.autoCloseTimeout = null;
        this.isHidingResponse = false;
        this.init();
    }

    init() {
        this.createWidget();
        this.setupSpeechRecognition();
        this.setupTextToSpeech();
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .speechbot-loading-dots {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                animation: speechbot-pulse 1.5s ease-in-out infinite;
                margin-right: 8px;
            }
            
            .speechbot-loading-dots:nth-child(2) {
                animation-delay: 0.2s;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            
            .speechbot-loading-dots:nth-child(3) {
                animation-delay: 0.4s;
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
            
            @keyframes speechbot-pulse {
                0%, 100% { 
                    opacity: 1; 
                    transform: scale(1); 
                }
                50% { 
                    opacity: 0.5; 
                    transform: scale(0.8); 
                }
            }
            
            .speechbot-pulse {
                animation: speechbot-button-pulse 2s infinite;
            }
            
            @keyframes speechbot-button-pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
                }
                70% {
                    box-shadow: 0 0 0 15px rgba(255, 107, 107, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
                }
            }
            
            .speaker-button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                margin-left: 10px;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .speaker-button:hover {
                background: #f0f0f0;
            }
            
            .speaker-button.speaking {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .speaker-button.speaking svg {
                fill: white;
            }
            
            .response-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .response-title {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .robo-icon {
                animation: float 3s ease-in-out infinite;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-5px) rotate(2deg); }
                50% { transform: translateY(-8px) rotate(0deg); }
                75% { transform: translateY(-5px) rotate(-2deg); }
            }
            
            .colorful-robo {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
                background-size: 400% 400%;
                animation: gradientShift 4s ease infinite;
            }
            
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.id = 'speechbot-widget-container';
        widget.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: Arial, sans-serif;
            ">
                <div id="speechbot-button" class="colorful-robo" style="
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
                    border: 3px solid white;
                    transition: all 0.3s ease;
                ">
                   <img 
    src="https://media.istockphoto.com/id/1957053641/vector/cute-kawaii-robot-character-friendly-chat-bot-assistant-for-online-applications-cartoon.jpg?s=612x612&w=0&k=20&c=Uf7lcu3I_ZNQvjBWxlFenRX7FuG_PKVJ4y1Y11aTZUc=" 
    alt="SpeechBot"
    class="robo-icon"
    style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"
/>
                </div>
                <div id="speechbot-response" style="
                    position: absolute;
                    bottom: 90px;
                    right: 0;
                    background: white;
                    border-radius: 15px;
                    padding: 15px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                    max-width: 320px;
                    min-width: 280px;
                    display: none;
                    border-left: 5px solid;
                    border-image: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c) 1;
                    z-index: 10001;
                ">
                    <div class="response-header">
                        <div class="response-title">
                            <strong style="color: #333; font-size: 14px; background: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">🤖 SpeechBot</strong>
                            <button id="speaker-button" class="speaker-button" title="Speak response" style="display: none;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#666">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                </svg>
                            </button>
                        </div>
                        <button id="close-response" style="
                            background: none;
                            border: none;
                            font-size: 18px;
                            cursor: pointer;
                            color: #666;
                            padding: 0;
                            width: 20px;
                            height: 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.3s ease;
                        ">×</button>
                    </div>
                    <div id="response-text" style="color: #333; font-size: 14px; line-height: 1.4; min-height: 20px;"></div>
                    <div style="margin-top: 10px; font-size: 11px; color: #888; text-align: right;">
                        Click the robot icon to ask more questions
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        document.getElementById('speechbot-button').addEventListener('click', () => {
            this.startConversation();
        });

        document.getElementById('close-response').addEventListener('click', () => {
            this.hideResponse();
        });

        document.getElementById('speaker-button').addEventListener('click', () => {
            this.toggleSpeech();
        });

        document.addEventListener('click', (e) => {
            const responseElement = document.getElementById('speechbot-response');
            const buttonElement = document.getElementById('speechbot-button');
            
            if (responseElement.style.display === 'block' && 
                !responseElement.contains(e.target) && 
                !buttonElement.contains(e.target)) {
                this.hideResponse();
            }
        });
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                console.log('✅ Speech recognition STARTED - Speak now!');
                this.isListening = true;
                this.updateButtonState();
                this.showResponse("🎤 Listening... Speak your question now!", false, false);
            };

            this.recognition.onend = () => {
                console.log('🔴 Speech recognition ENDED');
                this.isListening = false;
                this.updateButtonState();
                
                // Only restart if we're supposed to be listening and not speaking
                if (this.shouldBeListening && !this.isSpeaking) {
                    console.log('🔄 Restarting speech recognition...');
                    setTimeout(() => {
                        if (this.shouldBeListening && !this.isSpeaking) {
                            this.startListening();
                        }
                    }, 100);
                }
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎯 User said:', transcript);
                this.shouldBeListening = false; // Stop auto-restart
                this.showResponse('🎯 Finding the best answer for you...', true);
                this.processQuery(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                this.isListening = false;
                this.shouldBeListening = false;
                this.updateButtonState();
                
                let errorMessage = 'Sorry, I encountered an issue. Please try again.';
                if (event.error === 'not-allowed') {
                    errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
                } else if (event.error === 'no-speech') {
                    errorMessage = 'No speech detected. Please speak your question.';
                    // Auto-restart for no-speech errors only if not speaking
                    setTimeout(() => {
                        if (!this.isSpeaking) {
                            this.startListening();
                        }
                    }, 1000);
                } else if (event.error === 'audio-capture') {
                    errorMessage = 'No microphone found. Please check your audio settings.';
                } else if (event.error === 'network') {
                    errorMessage = 'Network error. Please check your internet connection.';
                }
                
                this.showResponse(errorMessage, false, true);
            };

            console.log('✅ Speech recognition setup completed');
        } else {
            const errorMessage = 'Speech recognition is not supported in your browser. Please use Google Chrome for the best experience.';
            this.showResponse(errorMessage, false, true);
        }
    }

    setupTextToSpeech() {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported in this browser');
            return;
        }

        this.loadVoices();

        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = this.loadVoices.bind(this);
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        this.preferredVoice = this.voices.find(voice => 
            voice.name.includes('Samantha') ||
            voice.name.includes('Victoria') ||
            (voice.lang.includes('en') && voice.name.toLowerCase().includes('female'))
        ) || this.voices[0];
    }

    // Add speech to queue and process
    speakWithIndianEnglishStyle(text, isAnswer = false) {
        if (!this.synthesis) {
            return;
        }

        // Don't add speech if we're in the process of hiding the response
        if (this.isHidingResponse) {
            console.log('🚫 Skipping speech - response is being hidden');
            return;
        }

        // Add to queue with metadata
        this.speechQueue.push({ 
            text, 
            isAnswer,
            timestamp: Date.now()
        });
        
        console.log(`📝 Added to speech queue: "${text.substring(0, 30)}..." (Queue length: ${this.speechQueue.length})`);
        
        // If this is an answer, automatically add the follow-up message to the queue
        if (isAnswer) {
            console.log('➕ Auto-adding follow-up message for answer');
            this.speechQueue.push({ 
                text: "Click on the robot icon to ask me more questions.", 
                isAnswer: false 
            });
        }
        
        // If not currently processing queue, start processing
        if (!this.isProcessingQueue) {
            this.processSpeechQueue();
        }
    }

    // Process speech queue one item at a time
    processSpeechQueue() {
        if (this.speechQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }

        if (this.isSpeaking) {
            console.log('⏳ Already speaking, waiting for current speech to finish...');
            return;
        }

        // Don't process speech if we're hiding the response
        if (this.isHidingResponse) {
            console.log('🚫 Skipping speech processing - response is being hidden');
            this.speechQueue = []; // Clear queue
            this.isProcessingQueue = false;
            return;
        }

        this.isProcessingQueue = true;
        const speechItem = this.speechQueue[0];
        const { text, isAnswer } = speechItem;

        this.stopListening(); // Stop listening when speaking starts

        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.voice = this.preferredVoice;
        utterance.rate = 0.90;
        utterance.pitch = 1.10;
        utterance.volume = 0.88;
        
        if (text.length > 80) {
            utterance.rate = 0.87;
        }

        utterance.onstart = () => {
            // Check again if we're hiding response
            if (this.isHidingResponse) {
                this.synthesis.cancel();
                return;
            }
            this.isSpeaking = true;
            this.currentUtterance = utterance;
            this.updateSpeakerButton(true);
            console.log('🔊 Started speaking:', text.substring(0, 50) + '...');
            
            // Reset auto-close timeout when speech starts
            this.resetAutoCloseTimeout();
        };

        utterance.onend = () => {
            // Check if we're hiding response
            if (this.isHidingResponse) {
                console.log('🚫 Speech ended but response is hidden, skipping further processing');
                this.speechQueue = [];
                this.isProcessingQueue = false;
                return;
            }

            console.log('🔇 Finished speaking:', text.substring(0, 30) + '...');
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateSpeakerButton(false);
            
            // Remove the completed speech from queue
            const completedItem = this.speechQueue.shift();
            console.log(`✅ Removed from queue. Remaining: ${this.speechQueue.length}`);
            
            // Small delay before processing next item
            setTimeout(() => {
                if (this.speechQueue.length > 0 && !this.isHidingResponse) {
                    console.log('🔄 Processing next item in queue...');
                    this.processSpeechQueue();
                } else {
                    console.log('🏁 Speech queue empty');
                    this.isProcessingQueue = false;
                    
                    // Handle post-speech actions only when queue is completely empty
                    if (!this.isHidingResponse) {
                        this.handlePostSpeechActions(isAnswer);
                    }
                }
            }, 500);
        };

        utterance.onerror = (event) => {
            console.error('❌ Speech synthesis error:', event.error, 'for text:', text.substring(0, 30) + '...');
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateSpeakerButton(false);
            
            // Only remove from queue if it's not because we're hiding response
            if (!this.isHidingResponse) {
                const failedItem = this.speechQueue.shift();
                console.log(`🗑️ Removed failed speech from queue. Remaining: ${this.speechQueue.length}`);
            }
            
            // Continue with next in queue if any
            setTimeout(() => {
                if (this.speechQueue.length > 0 && !this.isHidingResponse) {
                    console.log('🔄 Processing next item after error...');
                    this.processSpeechQueue();
                } else {
                    this.isProcessingQueue = false;
                    if (!this.isHidingResponse) {
                        this.handlePostSpeechActions(isAnswer);
                    }
                }
            }, 500);
        };

        // Ensure any current speech is fully stopped
        this.synthesis.cancel();
        
        // Increased delay to ensure clean state
        setTimeout(() => {
            try {
                console.log('🎯 Speaking queue item...');
                this.synthesis.speak(utterance);
            } catch (error) {
                console.error('❌ Failed to speak utterance:', error);
                // If speaking fails, remove the item and continue
                if (!this.isHidingResponse) {
                    this.speechQueue.shift();
                    setTimeout(() => {
                        this.processSpeechQueue();
                    }, 500);
                }
            }
        }, 200);
    }

    // Handle actions after speech completes
    handlePostSpeechActions(isAnswer) {
        const responseElement = document.getElementById('speechbot-response');
        
        // Don't proceed if response is hidden or being hidden
        if (responseElement.style.display === 'none' || this.isHidingResponse) {
            console.log('🚫 Response hidden, skipping post-speech actions');
            this.shouldBeListeningAfterSpeech = false;
            return;
        }
        
        console.log('📋 Handling post-speech actions, isAnswer:', isAnswer, 'shouldBeListeningAfterSpeech:', this.shouldBeListeningAfterSpeech);
        
        if (this.shouldBeListeningAfterSpeech && this.speechQueue.length === 0) {
            // Only restart listening when queue is completely empty
            console.log('🎤 Restarting listening after speech completion');
            setTimeout(() => {
                this.startListening();
            }, 1000);
        }
        
        // Reset the flag
        this.shouldBeListeningAfterSpeech = false;
    }

    // Reset auto-close timeout when speech activity happens
    resetAutoCloseTimeout() {
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
        }
        
        const responseElement = document.getElementById('speechbot-response');
        if (responseElement.style.display === 'block') {
            // Set new timeout only if response is visible
            this.autoCloseTimeout = setTimeout(() => {
                // Only auto-close if not speaking AND queue is empty
                if (!this.isSpeaking && this.speechQueue.length === 0 && responseElement.style.display === 'block') {
                    console.log('⏰ Auto-closing response after timeout');
                    this.hideResponse();
                } else {
                    // If there's still speech in queue, reset the timeout again
                    console.log('⏱️ Speech still in progress, extending auto-close timeout');
                    this.resetAutoCloseTimeout();
                }
            }, 15000); // 15 seconds
        }
    }

    stopSpeech() {
        if (this.synthesis) {
            console.log('🛑 Stopping all speech');
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateSpeakerButton(false);
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.shouldBeListening = false;
            this.updateButtonState();
        }
    }

    startListening() {
        if (!this.recognition || this.isSpeaking) {
            console.log('Cannot start listening: recognition not available or currently speaking');
            return;
        }

        try {
            console.log('🎙️ Starting speech recognition...');
            this.recognition.start();
            this.shouldBeListening = true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            // Retry after a short delay if not speaking
            setTimeout(() => {
                if (!this.isSpeaking) {
                    this.startListening();
                }
            }, 500);
        }
    }

    toggleSpeech() {
        if (this.isSpeaking) {
            this.stopSpeech();
        } else {
            const responseText = document.getElementById('response-text').textContent;
            if (responseText && !responseText.includes('Finding the best answer') && !responseText.includes('Listening')) {
                this.speakWithIndianEnglishStyle(responseText, false);
            }
        }
    }

    updateSpeakerButton(speaking) {
        const speakerButton = document.getElementById('speaker-button');
        if (speaking) {
            speakerButton.classList.add('speaking');
            speakerButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M6 6h4l5-5v16l-5-5H6V6zm10 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
            `;
        } else {
            speakerButton.classList.remove('speaking');
            speakerButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#666">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
            `;
        }
    }

    startConversation() {
        if (!this.recognition) {
            const errorMessage = 'Voice recognition is not available. Please use Google Chrome.';
            this.showResponse(errorMessage, false, true);
            return;
        }

        let speakMessage;
        let displayMessage;
        
        if (!this.hasWelcomed) {
            speakMessage = "Hello! I will help you know more about this organization. Please ask your question now.";
            displayMessage = "Hello! I will help you know more about this organization. Please ask your question.";
            this.hasWelcomed = true;
            this.shouldBeListeningAfterSpeech = true;
        } else {
            speakMessage = "I'm listening";
            displayMessage = "I'm listening. Please ask your question.";
            this.shouldBeListeningAfterSpeech = true;
        }

        this.showResponse(displayMessage, false, false);
        
        // Clear any existing queue and start fresh
        this.speechQueue = [];
        this.isProcessingQueue = false;
        this.isHidingResponse = false; // Reset hiding flag
        this.speakWithIndianEnglishStyle(speakMessage, false);
    }

    updateButtonState() {
        const button = document.getElementById('speechbot-button');
        if (this.isListening) {
            button.style.animation = 'gradientShift 1s ease infinite, speechbot-button-pulse 2s infinite';
            button.style.transform = 'scale(1.1)';
        } else {
            button.style.animation = 'gradientShift 4s ease infinite';
            button.style.transform = 'scale(1)';
        }
    }

    async processQuery(question) {
        try {
            console.log('🔍 Processing question:', question);
            
            const response = await fetch(`${this.apiBaseUrl}/speechbot/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    website: this.website,
                    question: question
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Received response:', data);
            
            if (data.answer) {
                if (data.answer.includes('Client not found') || data.answer.includes('not found')) {
                    const notAvailableMessage = "Sorry, voice assistance is not available for this organization.";
                    this.showResponse(notAvailableMessage, false, true);
                    // Clear queue and add error message (no follow-up for errors)
                    this.speechQueue = [];
                    this.speakWithIndianEnglishStyle(notAvailableMessage, false);
                } else if (data.answer.includes('Subscription expired')) {
                    const expiredMessage = "Sorry, the subscription for this organization has expired.";
                    this.showResponse(expiredMessage, false, true);
                    // Clear queue and add error message (no follow-up for errors)
                    this.speechQueue = [];
                    this.speakWithIndianEnglishStyle(expiredMessage, false);
                } else {
                    this.showResponse(data.answer, false, true);
                    // Clear any existing queue and add the answer (with follow-up)
                    this.speechQueue = [];
                    this.speakWithIndianEnglishStyle(data.answer, true); // isAnswer: true will auto-add follow-up
                }
            } else {
                throw new Error('No answer received from server');
            }
        } catch (error) {
            console.error('❌ Error processing query:', error);
            let errorMessage = 'Sorry, I\'m having trouble connecting at the moment. ';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Voice assistance is not available for this organization.';
            } else {
                errorMessage = 'Sorry, this feature is not available for this organization.';
            }
            
            this.showResponse(errorMessage, false, true);
            // Clear queue and add error message (no follow-up for errors)
            this.speechQueue = [];
            this.speakWithIndianEnglishStyle(errorMessage, false);
        }
    }

    showResponse(text, isThinking = false, autoClose = false) {
        const responseElement = document.getElementById('speechbot-response');
        const responseText = document.getElementById('response-text');
        const speakerButton = document.getElementById('speaker-button');
        
        if (isThinking) {
            responseText.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div class="speechbot-loading-dots"></div>
                    <div class="speechbot-loading-dots"></div>
                    <div class="speechbot-loading-dots"></div>
                    <span style="margin-left: 8px;">${text}</span>
                </div>
            `;
            speakerButton.style.display = 'none';
        } else {
            responseText.textContent = text;
            if (!text.includes('Finding the best answer') && 
                !text.includes('Listening') && 
                !text.includes('I\'m listening') &&
                !text.includes('I will help you') &&
                !text.includes('not available')) {
                speakerButton.style.display = 'block';
            } else {
                speakerButton.style.display = 'none';
            }
        }
        
        responseElement.style.display = 'block';
        this.isHidingResponse = false; // Reset hiding flag when showing response

        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
        }

        if (autoClose && !isThinking) {
            this.autoCloseTimeout = setTimeout(() => {
                // Only auto-close if not speaking AND queue is empty
                if (!this.isSpeaking && this.speechQueue.length === 0) {
                    this.hideResponse();
                } else {
                    // If there's still speech in queue, reset the timeout
                    this.resetAutoCloseTimeout();
                }
            }, 15000);
        }
    }

    hideResponse() {
        const responseElement = document.getElementById('speechbot-response');
        responseElement.style.display = 'none';
        
        // Set flag to indicate we're hiding the response
        this.isHidingResponse = true;
        
        this.stopSpeech();
        this.stopListening();
        
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
        }
    }
}

function initSpeechBot(website) {
    if (!window.speechBot) {
        window.speechBot = new SpeechBot(website);
        console.log('🎉 SpeechBot initialized for website:', website);
    } else {
        console.log('ℹ️ SpeechBot already initialized');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const script = document.querySelector('script[data-website]');
    if (script) {
        const website = script.getAttribute('data-website');
        initSpeechBot(website);
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpeechBot, initSpeechBot };
}
