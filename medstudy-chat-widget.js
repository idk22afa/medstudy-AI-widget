/**
 * MedStudy Chat Widget v2.3 - ИСПРАВЛЕНО
 * С историей диалога, sessionId и правильной отправкой
 */

const MedStudyChat = (function() {
  'use strict';
  
  let config = {};
  let isFormSubmitted = false;
  let userContact = null;
  let chatWidget = null;
  let messagesContainer = null;
  let sessionId = null; // Уникальный ID сессии
  let messageHistory = []; // История сообщений

  // Генерация уникального ID сессии
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Инициализация виджета
  function init(options) {
    config = {
      webhookUrl: options.webhookUrl || '',
      title: options.title || 'MedStudy Помощник',
      welcomeMessage: options.welcomeMessage || 'Привет! Чем могу помочь?',
      requireContact: options.requireContact !== false,
      contactFields: options.contactFields || {
        name: { required: true, placeholder: 'Ваше имя' },
        email: { required: true, placeholder: 'Email' },
        phone: { required: true, placeholder: 'Телефон' }
      },
      theme: {
        primaryColor: options.theme?.primaryColor || '#667eea',
        secondaryColor: options.theme?.secondaryColor || '#764ba2'
      }
    };

    if (!config.webhookUrl) {
      console.error('MedStudy Chat: webhookUrl обязателен!');
      return;
    }

    // Генерируем ID сессии при инициализации
    sessionId = generateSessionId();
    console.log('✅ MedStudy Chat: Инициализация с sessionId:', sessionId);
    
    createChatWidget();
  }

  // Создание виджета
  function createChatWidget() {
    const existing = document.getElementById('medstudy-chat-widget');
    if (existing) existing.remove();

    injectStyles();

    const chatButton = document.createElement('button');
    chatButton.id = 'medstudy-chat-button';
    chatButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>
      </svg>
    `;
    chatButton.addEventListener('click', toggleChat);
    document.body.appendChild(chatButton);

    chatWidget = document.createElement('div');
    chatWidget.id = 'medstudy-chat-widget';
    chatWidget.style.display = 'none';
    chatWidget.innerHTML = `
      <div class="chat-header">
        <span>${config.title}</span>
        <button class="chat-close" id="medstudy-close-chat">&times;</button>
      </div>
      <div class="chat-body" id="medstudy-chat-body">
        ${config.requireContact ? createContactFormHTML() : createChatHTML()}
      </div>
    `;
    document.body.appendChild(chatWidget);

    document.getElementById('medstudy-close-chat').addEventListener('click', closeChat);

    if (config.requireContact) {
      attachContactFormListeners();
    } else {
      attachChatListeners();
    }
  }

  function createContactFormHTML() {
    return `
      <div class="contact-form-container">
        <div class="contact-form-header">
          <h3>Заполните контакты</h3>
          <p>Чтобы начать диалог с консультантом</p>
        </div>
        <form id="medstudy-contact-form" class="contact-form">
          <div class="form-group">
            <input 
              type="text" 
              id="contact-name" 
              name="name"
              placeholder="${config.contactFields.name.placeholder}"
              ${config.contactFields.name.required ? 'required' : ''}
            />
          </div>
          <div class="form-group">
            <input 
              type="email" 
              id="contact-email" 
              name="email"
              placeholder="${config.contactFields.email.placeholder}"
              ${config.contactFields.email.required ? 'required' : ''}
            />
          </div>
          <div class="form-group">
            <input 
              type="tel" 
              id="contact-phone" 
              name="phone"
              placeholder="${config.contactFields.phone.placeholder}"
              ${config.contactFields.phone.required ? 'required' : ''}
            />
          </div>
          <button type="submit" class="submit-contact-btn">
            Начать диалог
          </button>
        </form>
      </div>
    `;
  }

  function createChatHTML() {
    return `
      <div class="chat-messages" id="medstudy-messages"></div>
      <div class="chat-input-container">
        <input 
          type="text" 
          id="medstudy-input" 
          placeholder="Напишите сообщение..."
          autocomplete="off"
        />
        <button id="medstudy-send-btn" class="send-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    `;
  }

  function attachContactFormListeners() {
    const form = document.getElementById('medstudy-contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();

      if (!name || !email || !phone) {
        alert('Пожалуйста, заполните все поля');
        return;
      }

      userContact = {
        name: name,
        email: email,
        phone: phone
      };
      
      isFormSubmitted = true;
      console.log('✅ Контакты сохранены:', userContact);

      const chatBody = document.getElementById('medstudy-chat-body');
      chatBody.innerHTML = createChatHTML();
      attachChatListeners();

      setTimeout(() => {
        addMessage(config.welcomeMessage, 'bot');
      }, 500);
    });
  }

  function attachChatListeners() {
    messagesContainer = document.getElementById('medstudy-messages');
    const input = document.getElementById('medstudy-input');
    const sendBtn = document.getElementById('medstudy-send-btn');

    if (!input || !sendBtn) {
      console.error('Элементы чата не найдены!');
      return;
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });

    input.focus();
  }

  // ИСПРАВЛЕННАЯ функция отправки с историей
  async function sendMessage() {
    const input = document.getElementById('medstudy-input');
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, 'user');
    
    // Сохраняем в историю
    messageHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    input.value = '';
    input.disabled = true;

    const typingId = showTypingIndicator();

    // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: отправляем только при первом сообщении или вообще не отправляем
    const requestData = {
      sessionId: sessionId,
      message: message,
      history: messageHistory.slice(-10), // Последние 10 сообщений
      timestamp: new Date().toISOString()
    };

    // Контакты отправляем ТОЛЬКО в первом сообщении
    if (messageHistory.filter(m => m.role === 'user').length === 1 && userContact) {
      requestData.contact = userContact;
      console.log('📤 Первое сообщение - отправляем контакты');
    }

    console.log('📤 Отправка в n8n:', requestData);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      removeTypingIndicator(typingId);

      console.log('📥 Ответ сервера:', response.status);

      if (!response.ok) {
        throw new Error('Ошибка сервера: ' + response.status);
      }

      const data = await response.json();
      console.log('✅ Данные ответа:', data);

      const botReply = data.response || data.reply || data.output || 'Извините, произошла ошибка.';

      // Добавляем ответ в историю
      messageHistory.push({
        role: 'assistant',
        content: botReply,
        timestamp: new Date().toISOString()
      });

      addMessage(botReply, 'bot');

    } catch (error) {
      clearTimeout(timeoutId);
      removeTypingIndicator(typingId);

      if (error.name === 'AbortError') {
        console.error('⏱️ Timeout: сервер не ответил за 15 секунд');
        addMessage('⏱️ Сервер не успел ответить. Попробуйте еще раз.', 'bot');
      } else {
        console.error('❌ Ошибка отправки:', error);
        addMessage('Извините, не удалось отправить сообщение. Проверьте соединение.', 'bot');
      }
    } finally {
      input.disabled = false;
      setTimeout(() => input.focus(), 100);
    }
  }

  function addMessage(text, sender) {
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'chat-message bot-message typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) indicator.remove();
  }

  function toggleChat() {
    if (chatWidget.style.display === 'none') {
      chatWidget.style.display = 'flex';
      document.getElementById('medstudy-chat-button').style.display = 'none';
      
      if (isFormSubmitted) {
        setTimeout(() => {
          const input = document.getElementById('medstudy-input');
          if (input) input.focus();
        }, 100);
      }
    }
  }

  function closeChat() {
    chatWidget.style.display = 'none';
    document.getElementById('medstudy-chat-button').style.display = 'flex';
  }

  function injectStyles() {
    if (document.getElementById('medstudy-chat-styles')) return;

    const style = document.createElement('style');
    style.id = 'medstudy-chat-styles';
    style.textContent = `
      #medstudy-chat-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${config.theme.primaryColor}, ${config.theme.secondaryColor});
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        transition: transform 0.3s;
      }
      #medstudy-chat-button:hover {
        transform: scale(1.1);
      }
      #medstudy-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 40px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: flex;
        flex-direction: column;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .chat-header {
        background: linear-gradient(135deg, ${config.theme.primaryColor}, ${config.theme.secondaryColor});
        color: white;
        padding: 20px;
        border-radius: 16px 16px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }
      .chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        line-height: 1;
      }
      .chat-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .contact-form-container {
        padding: 30px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
      }
      .contact-form-header h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        color: #333;
      }
      .contact-form-header p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #666;
      }
      .contact-form .form-group {
        margin-bottom: 16px;
      }
      .contact-form input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 15px;
        transition: border-color 0.3s;
        box-sizing: border-box;
      }
      .contact-form input:focus {
        outline: none;
        border-color: ${config.theme.primaryColor};
      }
      .submit-contact-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, ${config.theme.primaryColor}, ${config.theme.secondaryColor});
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
        margin-top: 8px;
      }
      .submit-contact-btn:hover {
        transform: translateY(-2px);
      }
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .chat-message {
        display: flex;
        max-width: 80%;
      }
      .user-message {
        align-self: flex-end;
      }
      .bot-message {
        align-self: flex-start;
      }
      .message-content {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .user-message .message-content {
        background: ${config.theme.primaryColor};
        color: white;
        border-radius: 12px 12px 4px 12px;
      }
      .bot-message .message-content {
        background: #f0f0f0;
        color: #333;
        border-radius: 12px 12px 12px 4px;
      }
      .typing-indicator .message-content {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
      }
      .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #999;
        animation: typing 1.4s infinite;
      }
      .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-10px); }
      }
      .chat-input-container {
        padding: 16px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 8px;
      }
      #medstudy-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e0e0e0;
        border-radius: 24px;
        font-size: 14px;
      }
      #medstudy-input:focus {
        outline: none;
        border-color: ${config.theme.primaryColor};
      }
      .send-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: ${config.theme.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      .send-btn:hover {
        transform: scale(1.1);
      }
      @media (max-width: 480px) {
        #medstudy-chat-widget {
          width: 100%;
          height: 100%;
          max-height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return {
    init: init
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MedStudyChat;
}
