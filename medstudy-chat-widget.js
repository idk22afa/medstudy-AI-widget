/**
 * MedStudy Chat Widget v2.0
 * AI консультант с обязательной формой контактов
 */

const MedStudyChat = (function() {
  'use strict';
  
  let config = {};
  let isFormSubmitted = false;
  let userContact = null;
  let chatWidget = null;
  let messagesContainer = null;

  // Инициализация виджета
  function init(options) {
    config = {
      webhookUrl: options.webhookUrl || '',
      title: options.title || 'MedStudy Помощник',
      welcomeMessage: options.welcomeMessage || 'Привет! Чем могу помочь?',
      requireContact: options.requireContact !== false, // По умолчанию true
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

    createChatWidget();
  }

  // Создание виджета
  function createChatWidget() {
    // Удаляем старый виджет если есть
    const existing = document.getElementById('medstudy-chat-widget');
    if (existing) existing.remove();

    // CSS стили
    injectStyles();

    // Кнопка открытия чата
    const chatButton = document.createElement('button');
    chatButton.id = 'medstudy-chat-button';
    chatButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>
      </svg>
    `;
    chatButton.addEventListener('click', toggleChat);
    document.body.appendChild(chatButton);

    // Окно чата
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

    // Обработчик закрытия
    document.getElementById('medstudy-close-chat').addEventListener('click', closeChat);

    // Если форма требуется
    if (config.requireContact) {
      attachContactFormListeners();
    } else {
      attachChatListeners();
    }
  }

  // HTML формы контактов
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

  // HTML чата
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

  // Обработчики формы контактов
  function attachContactFormListeners() {
    const form = document.getElementById('medstudy-contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();

      // Валидация
      if (!name || !email || !phone) {
        alert('Пожалуйста, заполните все поля');
        return;
      }

      // Сохраняем контакт
      userContact = { name, email, phone };
      isFormSubmitted = true;

      // Заменяем форму на чат
      const chatBody = document.getElementById('medstudy-chat-body');
      chatBody.innerHTML = createChatHTML();
      attachChatListeners();

      // Показываем приветствие
      setTimeout(() => {
        addMessage(config.welcomeMessage, 'bot');
      }, 500);
    });
  }

  // Обработчики чата
  function attachChatListeners() {
    messagesContainer = document.getElementById('medstudy-messages');
    const input = document.getElementById('medstudy-input');
    const sendBtn = document.getElementById('medstudy-send-btn');

    if (!input || !sendBtn) return;

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Отправка сообщения
  async function sendMessage() {
    const input = document.getElementById('medstudy-input');
    const message = input.value.trim();

    if (!message) return;

    // Показываем сообщение пользователя
    addMessage(message, 'user');
    input.value = '';

    // Показываем индикатор набора
    const typingId = showTypingIndicator();

    try {
      // Формируем данные для отправки
      const requestData = {
        message: message,
        contact: userContact || {},
        timestamp: new Date().toISOString()
      };

      // Отправляем в n8n
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      // Убираем индикатор
      removeTypingIndicator(typingId);

      if (!response.ok) {
        throw new Error('Ошибка сервера');
      }

      const data = await response.json();
      const botReply = data.response || 'Извините, произошла ошибка. Попробуйте позже.';

      // Показываем ответ бота
      addMessage(botReply, 'bot');

    } catch (error) {
      removeTypingIndicator(typingId);
      console.error('Ошибка отправки:', error);
      addMessage('Извините, не удалось отправить сообщение. Проверьте соединение.', 'bot');
    }
  }

  // Добавление сообщения
  function addMessage(text, sender) {
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    
    // Прокрутка вниз
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Индикатор набора
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

  // Переключение чата
  function toggleChat() {
    if (chatWidget.style.display === 'none') {
      chatWidget.style.display = 'flex';
      document.getElementById('medstudy-chat-button').style.display = 'none';
      
      // Фокус на input если чат открыт
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

  // Инъекция стилей
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
      
      /* Форма контактов */
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
      
      /* Чат */
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
      
      /* Мобильная адаптация */
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

// Экспорт для использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MedStudyChat;
}
