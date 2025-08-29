class ChatbotService {
  constructor() {
    this.chatHistory = [];
    this.basePath = '/pw2425';
  }
  initializeHistory(initialBotMessage) {
    if (this.chatHistory.length === 0 && initialBotMessage) {
      this.chatHistory = [
        {
          role: 'model',
          parts: [{ text: initialBotMessage }],
        },
      ];
    }
  }

  async sendMessage(messageText) {
    if (!messageText) {
      throw new Error('Message text cannot be empty.');
    }

    this.chatHistory.push({
      role: 'user',
      parts: [{ text: messageText }],
    });
    console.log('History before send:', JSON.stringify(this.chatHistory));

    const token = localStorage.getItem('jwt');
    if (!token) {
      this.chatHistory.pop();
      throw new Error('Authentication error. Please log in again.');
    }

    try {
      const response = await fetch(`${this.basePath}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ history: this.chatHistory }),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          console.warn('Could not parse error response as JSON.');
        }
        this.chatHistory.pop();
        throw new Error(errorMsg);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.reply) {
        const botReplyText = result.data.reply;

        this.chatHistory.push({
          role: 'model',
          parts: [{ text: botReplyText }],
        });
        console.log('History after receive:', JSON.stringify(this.chatHistory));

        return botReplyText;
      } else {
        this.chatHistory.pop();
        throw new Error(result.message || 'Invalid response from chatbot API.');
      }
    } catch (error) {
      console.error('Chatbot Service sendMessage error:', error);
      if (
        this.chatHistory.length > 0 &&
        this.chatHistory[this.chatHistory.length - 1].role === 'user'
      ) {
        const lastUserMessage =
          this.chatHistory[this.chatHistory.length - 1].parts[0].text;
        if (lastUserMessage === messageText) {
          this.chatHistory.pop();
        }
      }
      throw error;
    }
  }

  clearHistory() {
    this.chatHistory = [];
    console.log('Chat History Cleared');
  }

  getHistory() {
    return this.chatHistory;
  }
}

export const chatbotService = new ChatbotService();
