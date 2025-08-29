import AuthService from '../services/AuthService.js';
import { chatbotService } from '../services/ChatbotService.js';
import { router } from '../router.js';

// klasa ku trashegojn te 3 dashboardat user specific
export default class DashboardView {
  constructor(role) {
    const urlParams = new URLSearchParams(window.location.search);
    this.userId = urlParams.get('user_id');
    this.role = role;
    this.userData = null;
    this.basePath = '/pw2425';
    this.chatHistory = [];
  }

  async loadUserData() {
    const token = localStorage.getItem('jwt');
    if (!this.userId || !token) {
      AuthService.logout();
      router.navigate('/login');
      return;
    }

    try {
      const response = await fetch(
        `${this.basePath}/api/users/${this.userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          AuthService.logout();
          router.navigate('/login');
          return;
        }
        throw new Error(`HTTP error! ${response.status}`);
      }

      this.userData = await response.json();
      console.log(this.userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      this.displayError('Could not load dashboard information.');
    }
  }

  displayError(message) {
    const errorElement = document.getElementById('dashboard-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? 'block' : 'none';
    }
  }

  addLogoutListener() {
    const logoutButton = document.getElementById('dashboard-logout-btn');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        AuthService.logout();
        router.navigate('/login');
      });
    }
  }

  async loadUserData() {
    const token = localStorage.getItem('jwt');
    if (!this.userId) {
      console.error('User ID is missing for loading user data.');
      this.displayError('Could not load user information: User ID missing.');
      AuthService.logout();
      router.navigate('/pw2425/login');
      return;
    }
    if (!token) {
      this.displayError('Authentication token not found. Please log in.');
      AuthService.logout();
      router.navigate('/pw2425/login');
      return;
    }

    try {
      const response = await fetch(
        `${this.basePath}/api/users/${this.userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to parse error response.' }));
        if (response.status === 401 || response.status === 403) {
          this.displayError(
            `Session expired or unauthorized (${response.status}). Please log in again.`
          );
          AuthService.logout();
          router.navigate('/pw2425/login');
        } else {
          this.displayError(
            `Error loading user data: ${
              errorData.message || response.statusText
            }`
          );
        }
        return;
      }

      const responseData = await response.json();
      if (
        !responseData ||
        responseData.success !== true ||
        !responseData.data
      ) {
        throw new Error(
          responseData.message ||
            'User data not found in response or request failed.'
        );
      }

      this.userData = responseData.data; 

      if (!this.userData || !this.userData.user_id) {
        throw new Error('User data received is invalid or incomplete.');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      this.displayError(
        `Could not load dashboard information: ${error.message}`
      );
    }
  }

  setupChatbot() {
    const chatIcon = document.getElementById('chatbot-icon');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const input = document.getElementById('chatbot-input');
    const messagesArea = document.getElementById('chatbot-messages');

    if (
      !chatIcon ||
      !chatWindow ||
      !closeBtn ||
      !sendBtn ||
      !input ||
      !messagesArea
    ) {
      console.warn('Chatbot UI elements not found. Chatbot setup skipped.');
      return;
    }

    // Initialize history
    const initialBotMessageDiv = messagesArea.querySelector(
      '.chatbot-message.bot'
    );
    if (initialBotMessageDiv) {
      chatbotService.initializeHistory(initialBotMessageDiv.textContent);
    }

    chatIcon.addEventListener('click', () => {
      chatWindow.classList.toggle('chatbot-hidden');
      if (!chatWindow.classList.contains('chatbot-hidden')) {
        input.focus();
      }
    });

    closeBtn.addEventListener('click', () => {
      chatWindow.classList.add('chatbot-hidden');
    });

    // send logic
    const handleSend = async () => {
      const messageText = input.value.trim();
      if (!messageText) return;

      // 1. Display user message locally
      const userMsgDiv = document.createElement('div');
      userMsgDiv.classList.add('chatbot-message', 'user');
      userMsgDiv.textContent = messageText;
      messagesArea.appendChild(userMsgDiv);
      input.value = ''; 
      messagesArea.scrollTop = messagesArea.scrollHeight;

      // 2. Add thinking indicator
      const thinkingDiv = document.createElement('div');
      thinkingDiv.classList.add('chatbot-message', 'bot', 'thinking');
      thinkingDiv.textContent = '...';
      messagesArea.appendChild(thinkingDiv);
      messagesArea.scrollTop = messagesArea.scrollHeight;

      // Minimum display time for thinking indicator
      const minDelay = 300;
      const delayPromise = new Promise((resolve) =>
        setTimeout(resolve, minDelay)
      );

      try {
        // 3. Call the service to send the message and wait for reply + delay
        const sendMessagePromise = chatbotService.sendMessage(messageText);
        const [botReplyText] = await Promise.all([
          sendMessagePromise,
          delayPromise,
        ]);
        messagesArea.removeChild(thinkingDiv);

        // 5. Display bot reply with typing effect and Markdown
        const botMsgDiv = document.createElement('div');
        botMsgDiv.classList.add('chatbot-message', 'bot');
        messagesArea.appendChild(botMsgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        await this.typeMessage(botMsgDiv, botReplyText); 
        botMsgDiv.innerHTML = this.parseMarkdown(botReplyText);
      } catch (error) {
        console.error('Error handling chat message:', error);
        const stillThinking = messagesArea.querySelector('.thinking');
        if (stillThinking) messagesArea.removeChild(stillThinking);

        const errorMsgDiv = document.createElement('div');
        errorMsgDiv.classList.add('chatbot-message', 'bot', 'error');
        messagesArea.appendChild(errorMsgDiv);
        await this.typeMessage(errorMsgDiv, `Error: ${error.message}`);
      } finally {
        // scroll
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });
  }

  parseMarkdown(text) {
    if (!text) return '';
    let escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    let html = escapedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return html;
  }

  //send message in chunks
  typeMessage(element, text, wordsPerChunk = 1.8, delay = 70) {
    return new Promise((resolve) => {
      const words = text.split(/(\s+)/).filter((word) => word.length > 0); // filtron empty strings
      let currentWordIndex = 0;
      element.textContent = '';
      const messagesArea = document.getElementById('chatbot-messages');

      function typeChunk() {
        if (currentWordIndex < words.length) {
          const endIndex = Math.min(
            currentWordIndex + wordsPerChunk,
            words.length
          );
          const chunk = words.slice(currentWordIndex, endIndex).join('');
          element.textContent += chunk;
          currentWordIndex = endIndex;

          if (messagesArea) {
            messagesArea.scrollTop = messagesArea.scrollHeight;
          }

          setTimeout(typeChunk, delay);
        } else {
          resolve();
        }
      }
      typeChunk();
    });
  }
}
