/**
 * MedStudy AI Chat Widget v2.0
 * С встроенной формой сбора контактов
 * Standalone version for easy integration
 */

(function() {
    'use strict';

    const MedStudyChat = {
        config: {
            webhookUrl: '',
            theme: {
                primaryColor: '#667eea',
                secondaryColor: '#764ba2',
                position: 'bottom-right'
            },
            welcomeMessage: 'Привет! 👋 Я AI-ассистент MedStudy. Чем могу помочь?',
            placeholder: 'Напишите сообщение...',
            title: 'MedStudy Помощник',
            requireContact: true,
            contactFields: {
                name: true,
                email: true,
                phone: true
            }
        },

        conversationHistory: [],
        elements: {},
        userContact: null,
        leadId: null,

        init: function(options = {}) {
            // Merge config
            this.config = { ...this.config, ...options };
            
            if (!this.config.webhookUrl) {
                console.error('MedStudyChat: webhookUrl is required');
                return;
            }

            // Check if user already provided contact
            this.userContact = this.getStoredContact();

            // Inject CSS
            this.injectStyles();
            
            // Create HTML structure
            this.createWidget();
            
            // Bind events
            this.bindEvents();
        },

        injectStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                .medstudy-chat-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                }

                .medstudy-chat-widget * {
                    box-sizing: border-box;
                }

                .medstudy-chat-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, ${this.config.theme.primaryColor} 0%, ${this.config.theme.secondaryColor} 100%);
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s ease;
                }

                .medstudy-chat-button:hover {
                    transform: scale(1.1);
                }

                .medstudy-chat-button svg {
                    width: 28px;
                    height: 28px;
                    fill: white;
                }

                .medstudy-chat-window {
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 380px;
                    height: 600px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }

                .medstudy-chat-window.active {
                    display: flex;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .medstudy-chat-header {
                    background: linear-gradient(135deg, ${this.config.theme.primaryColor} 0%, ${this.config.theme.secondaryColor} 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .medstudy-chat-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .medstudy-close-button {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Contact Form Styles */
                .medstudy-contact-form {
                    display: flex;
                    flex-direction: column;
                    padding: 30px;
                    flex: 1;
                    justify-content: center;
                }

                .medstudy-contact-form.hidden {
                    display: none;
                }

                .medstudy-form-title {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #333;
                }

                .medstudy-form-subtitle {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 24px;
                }

                .medstudy-form-group {
                    margin-bottom: 16px;
                }

                .medstudy-form-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                    margin-bottom: 6px;
                }

                .medstudy-form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }

                .medstudy-form-input:focus {
                    outline: none;
                    border-color: ${this.config.theme.primaryColor};
                }

                .medstudy-form-input.error {
                    border-color: #ef4444;
                }

                .medstudy-form-error {
                    color: #ef4444;
                    font-size: 12px;
                    margin-top: 4px;
                    display: none;
                }

                .medstudy-form-error.active {
                    display: block;
                }

                .medstudy-form-button {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, ${this.config.theme.primaryColor} 0%, ${this.config.theme.secondaryColor} 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.3s;
                    margin-top: 8px;
                }

                .medstudy-form-button:hover {
                    opacity: 0.9;
                }

                .medstudy-form-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Chat Styles */
                .medstudy-chat-container {
                    display: none;
                    flex-direction: column;
                    flex: 1;
                }

                .medstudy-chat-container.active {
                    display: flex;
                }

                .medstudy-chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    background: #f8f9fa;
                }

                .medstudy-message {
                    margin-bottom: 16px;
                    display: flex;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .medstudy-message.user {
                    justify-content: flex-end;
                }

                .medstudy-message-content {
                    max-width: 75%;
                    padding: 12px 16px;
                    border-radius: 12px;
                    word-wrap: break-word;
                    line-height: 1.5;
                }

                .medstudy-message.bot .medstudy-message-content {
                    background: white;
                    color: #333;
                    border-bottom-left-radius: 4px;
                }

                .medstudy-message.user .medstudy-message-content {
                    background: linear-gradient(135deg, ${this.config.theme.primaryColor} 0%, ${this.config.theme.secondaryColor} 100%);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .medstudy-chat-input-area {
                    padding: 16px;
                    background: white;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    gap: 8px;
                }

                .medstudy-chat-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid #e0e0e0;
                    border-radius: 24px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.3s;
                }

                .medstudy-chat-input:focus {
                    border-color: ${this.config.theme.primaryColor};
                }

                .medstudy-send-button {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, ${this.config.theme.primaryColor} 0%, ${this.config.theme.secondaryColor} 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.3s;
                }

                .medstudy-send-button:hover {
                    opacity: 0.9;
                }

                .medstudy-send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .medstudy-send-button svg {
                    width: 20px;
                    height: 20px;
                    fill: white;
                }

                .medstudy-typing-indicator {
                    display: none;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 12px;
                    width: fit-content;
                    margin: 0 20px 16px;
                }

                .medstudy-typing-indicator.active {
                    display: block;
                }

                .medstudy-typing-indicator span {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${this.config.theme.primaryColor};
                    margin: 0 2px;
                    animation: typing 1.4s infinite;
                }

                .medstudy-typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .medstudy-typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }

                @media (max-width: 768px) {
                    .medstudy-chat-window {
                        width: calc(100vw - 20px);
                        height: calc(100vh - 100px);
                        bottom: 70px;
                        right: 10px;
                    }
                }
            `;
            document.head.appendChild(style);
        },

        createWidget: function() {
            const container = document.createElement('div');
            container.className = 'medstudy-chat-widget';
            container.innerHTML = `
                <button class="medstudy-chat-button" id="medstudyChatButton">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                </button>

                <div class="medstudy-chat-window" id="medstudyChatWindow">
                    <div class="medstudy-chat-header">
                        <h3>${this.config.title}</h3>
                        <button class="medstudy-close-button" id="medstudyCloseButton">&times;</button>
                    </div>
                    
                    <!-- Contact Form -->
                    <div class="medstudy-contact-form" id="medstudyContactForm">
                        <div class="medstudy-form-title">Давайте познакомимся! 👋</div>
                        <div class="medstudy-form-subtitle">Оставьте контакты чтобы мы могли связаться с вами</div>
                        
                        <div class="medstudy-form-group">
                            <label class="medstudy-form-label" for="medstudyName">Ваше имя *</label>
                            <input 
                                type="text" 
                                id="medstudyName" 
                                class="medstudy-form-input" 
                                placeholder="Например: Артем"
                                required
                            />
                            <div class="medstudy-form-error" id="medstudyNameError">Пожалуйста, введите ваше имя</div>
                        </div>

                        <div class="medstudy-form-group">
                            <label class="medstudy-form-label" for="medstudyEmail">Email *</label>
                            <input 
                                type="email" 
                                id="medstudyEmail" 
                                class="medstudy-form-input" 
                                placeholder="например@email.com"
                                required
                            />
                            <div class="medstudy-form-error" id="medstudyEmailError">Пожалуйста, введите корректный email</div>
                        </div>

                        <div class="medstudy-form-group">
                            <label class="medstudy-form-label" for="medstudyPhone">Телефон *</label>
                            <input 
                                type="tel" 
                                id="medstudyPhone" 
                                class="medstudy-form-input" 
                                placeholder="+420 123 456 789"
                                required
                            />
                            <div class="medstudy-form-error" id="medstudyPhoneError">Пожалуйста, введите номер телефона</div>
                        </div>

                        <button class="medstudy-form-button" id="medstudyFormSubmit">
                            Начать диалог
                        </button>
                    </div>

                    <!-- Chat Container -->
                    <div class="medstudy-chat-container" id="medstudyChatContainer">
                        <div class="medstudy-chat-messages" id="medstudyChatMessages">
                            <div class="medstudy-message bot">
                                <div class="medstudy-message-content">
                                    ${this.config.welcomeMessage}
                                </div>
                            </div>
                        </div>

                        <div class="medstudy-typing-indicator" id="medstudyTypingIndicator">
                            <span></span><span></span><span></span>
                        </div>
                        
                        <div class="medstudy-chat-input-area">
                            <input 
                                type="text" 
                                class="medstudy-chat-input" 
                                id="medstudyChatInput" 
                                placeholder="${this.config.placeholder}"
                                autocomplete="off"
                            />
                            <button class="medstudy-send-button" id="medstudySendButton">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(container);

            // Store element references
            this.elements = {
                chatButton: document.getElementById('medstudyChatButton'),
                chatWindow: document.getElementById('medstudyChatWindow'),
                closeButton: document.getElementById('medstudyCloseButton'),
                contactForm: document.getElementById('medstudyContactForm'),
                chatContainer: document.getElementById('medstudyChatContainer'),
                chatMessages: document.getElementById('medstudyChatMessages'),
                chatInput: document.getElementById('medstudyChatInput'),
                sendButton: document.getElementById('medstudySendButton'),
                typingIndicator: document.getElementById('medstudyTypingIndicator'),
                formSubmit: document.getElementById('medstudyFormSubmit'),
                nameInput: document.getElementById('medstudyName'),
                emailInput: document.getElementById('medstudyEmail'),
                phoneInput: document.getElementById('medstudyPhone')
            };

            // If user already provided contact, skip form
            if (this.userContact) {
                this.showChat();
            }
        },

        bindEvents: function() {
            const { chatButton, chatWindow, closeButton, chatInput, sendButton, formSubmit } = this.elements;

            chatButton.addEventListener('click', () => this.toggleChat());
            closeButton.addEventListener('click', () => this.closeChat());
            sendButton.addEventListener('click', () => this.sendMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
            formSubmit.addEventListener('click', () => this.submitContactForm());

            // Enter key on form inputs
            [this.elements.nameInput, this.elements.emailInput, this.elements.phoneInput].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.submitContactForm();
                });
            });
        },

        toggleChat: function() {
            const { chatWindow, chatInput } = this.elements;
            chatWindow.classList.toggle('active');
            if (chatWindow.classList.contains('active')) {
                if (this.userContact) {
                    setTimeout(() => chatInput.focus(), 100);
                } else {
                    setTimeout(() => this.elements.nameInput.focus(), 100);
                }
            }
        },

        closeChat: function() {
            this.elements.chatWindow.classList.remove('active');
        },

        validateEmail: function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        validatePhone: function(phone) {
            // Accepts various phone formats
            const re = /^[\d\s\+\-\(\)]{9,20}$/;
            return re.test(phone);
        },

        submitContactForm: function() {
            const name = this.elements.nameInput.value.trim();
            const email = this.elements.emailInput.value.trim();
            const phone = this.elements.phoneInput.value.trim();

            let hasError = false;

            // Validate name
            if (!name) {
                this.elements.nameInput.classList.add('error');
                document.getElementById('medstudyNameError').classList.add('active');
                hasError = true;
            } else {
                this.elements.nameInput.classList.remove('error');
                document.getElementById('medstudyNameError').classList.remove('active');
            }

            // Validate email
            if (!email || !this.validateEmail(email)) {
                this.elements.emailInput.classList.add('error');
                document.getElementById('medstudyEmailError').classList.add('active');
                hasError = true;
            } else {
                this.elements.emailInput.classList.remove('error');
                document.getElementById('medstudyEmailError').classList.remove('active');
            }

            // Validate phone
            if (!phone || !this.validatePhone(phone)) {
                this.elements.phoneInput.classList.add('error');
                document.getElementById('medstudyPhoneError').classList.add('active');
                hasError = true;
            } else {
                this.elements.phoneInput.classList.remove('error');
                document.getElementById('medstudyPhoneError').classList.remove('active');
            }

            if (hasError) return;

            // Store contact
            this.userContact = { name, email, phone };
            this.storeContact({ name, email, phone });

            // Send initial contact to webhook
            this.sendContactToWebhook({ name, email, phone });

            // Show chat
            this.showChat();
        },

        showChat: function() {
            this.elements.contactForm.classList.add('hidden');
            this.elements.chatContainer.classList.add('active');
            setTimeout(() => this.elements.chatInput.focus(), 100);
        },

        storeContact: function(contact) {
            try {
                localStorage.setItem('medstudy_user_contact', JSON.stringify(contact));
            } catch (e) {
                console.warn('Could not store contact:', e);
            }
        },

        getStoredContact: function() {
            try {
                const stored = localStorage.getItem('medstudy_user_contact');
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                return null;
            }
        },

        async sendContactToWebhook(contact) {
            try {
                const response = await fetch(this.config.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'new_lead',
                        contact: contact,
                        timestamp: new Date().toISOString(),
                        source: 'medstudy-website'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.leadId = data.leadId || null;
                }
            } catch (error) {
                console.error('Error sending contact:', error);
            }
        },

        async sendMessage() {
            const { chatInput, sendButton, typingIndicator } = this.elements;
            const message = chatInput.value.trim();
            
            if (!message) return;

            // Add user message
            this.addMessage(message, 'user');
            chatInput.value = '';
            sendButton.disabled = true;

            // Show typing indicator
            typingIndicator.classList.add('active');
            this.scrollToBottom();

            try {
                const response = await fetch(this.config.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'message',
                        message: message,
                        contact: this.userContact,
                        leadId: this.leadId,
                        conversationHistory: this.conversationHistory,
                        timestamp: new Date().toISOString(),
                        source: 'medstudy-website'
                    })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                
                typingIndicator.classList.remove('active');
                
                // Extract response from various possible formats
                const botReply = data.response || data.message || data.output || 'Извините, произошла ошибка.';
                this.addMessage(botReply, 'bot');

            } catch (error) {
                console.error('MedStudyChat Error:', error);
                typingIndicator.classList.remove('active');
                this.addMessage('Извините, произошла ошибка при отправке сообщения. Попробуйте позже.', 'bot');
            }

            sendButton.disabled = false;
        },

        addMessage: function(text, sender) {
            const { chatMessages } = this.elements;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `medstudy-message ${sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'medstudy-message-content';
            contentDiv.textContent = text;
            
            messageDiv.appendChild(contentDiv);
            chatMessages.appendChild(messageDiv);
            
            // Save to history
            this.conversationHistory.push({
                role: sender === 'user' ? 'user' : 'assistant',
                content: text,
                timestamp: new Date().toISOString()
            });

            this.scrollToBottom();
        },

        scrollToBottom: function() {
            const { chatMessages } = this.elements;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    // Expose to global scope
    window.MedStudyChat = MedStudyChat;

})();
