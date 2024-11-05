// // ChatLib.js

// class ChatLib {
//     constructor(options) {
//       this.options = {
//         websocketUrl: options.websocketUrl || 'wss://your-websocket-server.com',
//         containerId: options.containerId || 'chat-container',
//         userId: options.userId || 'anonymous',
//         chatTitle: options.chatTitle || 'ChatApp',
//         chatDescription: options.chatDescription || 'Chat description',
//         chatIconUrl: options.chatIconUrl || 'https://via.placeholder.com/50',
//         chatIconSize: options.chatIconSize || 50,
//         chatFileTypes: options.chatFileTypes || ['image/jpeg', 'image/png', 'image/gif'],
//         chatMaxFileSize: options.chatFileSize || 2 * 1024 * 1024,
//       };
//       this.websocket = null;
//       this.messageCallbacks = [];
//       this.isChatboxOpen = false;
//     }
  

//     init() {
//       this.createChatInterface();
//       // this.connectWebSocket();
//     }

//     toggleChatbox() {
//       this.isChatboxOpen = !this.isChatboxOpen;
//       this.init();
//     }
  
//     createChatInterface() {
//       const existingChatContainer = document.getElementById("chat-container");
//       if (existingChatContainer) {
//         existingChatContainer.remove();
//       }
  
//       if (!this.isChatboxOpen) {
//         console.log('Chatbox is closed');
//         // Create and append the chat button when the chatbox is closed
//         const chatButtonContainer = document.createElement("div");
//         chatButtonContainer.className = "fixed bottom-0 right-0 mb-4 mr-4";
  
//         const chatButton = document.createElement("button");
//         chatButton.id = "open-chat";
//         chatButton.className = "bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 flex items-center";
//         chatButton.onclick = this.toggleChatbox.bind(this);
  
//         const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//         svgIcon.setAttribute("class", "w-6 h-6 mr-2");
//         svgIcon.setAttribute("fill", "none");
//         svgIcon.setAttribute("viewBox", "0 0 24 24");
//         svgIcon.setAttribute("stroke", "currentColor");
  
//         const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
//         svgPath.setAttribute("stroke-linecap", "round");
//         svgPath.setAttribute("stroke-linejoin", "round");
//         svgPath.setAttribute("stroke-width", "2");
//         svgPath.setAttribute("d", "M12 6v6m0 0v6m0-6h6m-6 0H6");
  
//         svgIcon.appendChild(svgPath);
  
//         const buttonText = document.createElement("span");
//         buttonText.textContent = "Chat with an Agent";
  
//         chatButton.appendChild(svgIcon);
//         chatButton.appendChild(buttonText);
  
//         chatButtonContainer.appendChild(chatButton);
//         document.body.appendChild(chatButtonContainer);
//       } else {
//         // Create and append the chatbox when it is opened
//         const chatContainer = document.createElement("div");
//         chatContainer.id = "chat-container";
//         chatContainer.className = "fixed bottom-5 right-4 w-96";
  
//         const chatBox = document.createElement("div");
//         chatBox.className = "bg-white shadow-md rounded-lg max-w-lg w-full";
  
//         const chatHeader = document.createElement("div");
//         chatHeader.className = "py-8 px-4 border-b bg-blue-500 text-white rounded-t-lg flex justify-between";
  
//         const chatTitleContainer = document.createElement("div");
//         chatTitleContainer.className = "pl-4 space-y-2";
  
//         const chatIcon = document.createElement("div");
//         chatIcon.innerHTML = `<img src="${this.options.chatIconUrl}" class='w-6 h-6' alt="chat_icon" />`; // Customize your chat icon
  
//         const chatTitle = document.createElement("p");
//         chatTitle.className = "text-xl font-semibold text-left";
//         chatTitle.textContent = this.options.chatTitle ; // Customize your chat title
  
//         const chatDescription = document.createElement("p");
//         chatDescription.className = "text-sm font-normal text-left";
//         chatDescription.textContent = this.options.chatDescription ; // Customize your chat description
  
//         chatTitleContainer.appendChild(chatIcon);
//         chatTitleContainer.appendChild(chatTitle);
//         chatTitleContainer.appendChild(chatDescription);
  
//         const closeButton = document.createElement("button");
//         closeButton.id = "close-chat";
//         closeButton.className = "self-start text-white hover:text-red-500 focus:outline-none focus:text-red-500";
//         closeButton.onclick = this.toggleChatbox.bind(this);
  
//         const closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//         closeIcon.setAttribute("class", "w-6 h-6");
//         closeIcon.setAttribute("fill", "none");
//         closeIcon.setAttribute("viewBox", "0 0 24 24");
//         closeIcon.setAttribute("stroke", "currentColor");
  
//         const closePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
//         closePath.setAttribute("stroke-linecap", "round");
//         closePath.setAttribute("stroke-linejoin", "round");
//         closePath.setAttribute("stroke-width", "2");
//         closePath.setAttribute("d", "M6 18L18 6M6 6l12 12");
  
//         closeIcon.appendChild(closePath);
//         closeButton.appendChild(closeIcon);
  
//         chatHeader.appendChild(chatTitleContainer);
//         chatHeader.appendChild(closeButton);
  
//         const chatContent = document.createElement("div");
//         chatContent.className = "min-h-[500px] bg-gray-100";
  
//         // Add chat content here, could be ChatboxLogin() or ChatboxChatArea() logic
  
//         chatBox.appendChild(chatHeader);
//         chatBox.appendChild(chatContent);
//         chatContainer.appendChild(chatBox);
//         document.body.appendChild(chatContainer);
//       }
//     }
  
//     connectWebSocket() {
//       this.websocket = new WebSocket(this.options.websocketUrl);
  
//       this.websocket.onopen = () => {
//         console.log('WebSocket connected');
//         this.sendSystemMessage({ type: 'join', userId: this.options.userId });
//       };
  
//       this.websocket.onmessage = (event) => {
//         const message = JSON.parse(event.data);
//         this.displayMessage(message);
//         this.messageCallbacks.forEach(callback => callback(message));
//       };
  
//       this.websocket.onclose = () => {
//         console.log('WebSocket disconnected');
//         // Implement reconnection logic here
//       };
//     }
  
//     sendMessage() {
//       const input = document.getElementById('chat-input');
//       const message = input.value.trim();
//       if (message) {
//         this.websocket.send(JSON.stringify({
//           type: 'chat',
//           userId: this.options.userId,
//           message: message
//         }));
//         input.value = '';
//       }
//     }
  
//     sendSystemMessage(message) {
//       this.websocket.send(JSON.stringify(message));
//     }
  
//     displayMessage(message) {
//       const chatMessages = document.getElementById('chat-messages');
//       const messageElement = document.createElement('div');
//       messageElement.textContent = `${message.userId}: ${message.message}`;
//       chatMessages.appendChild(messageElement);
//       chatMessages.scrollTop = chatMessages.scrollHeight;
//     }
  
//     onMessage(callback) {
//       this.messageCallbacks.push(callback);
//     }
//   }
  
//   // Export for use in browser and Node.js environments
// export default ChatLib;