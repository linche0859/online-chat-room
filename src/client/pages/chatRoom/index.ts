import './index.css';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';
import { User } from '@/services/User';

type ChatMessage = {
  user: User;
  message: string;
  time: string;
};

const clientIO = io();
const url = new URL(location.href);
const userName = url.searchParams.get('user_name');
const roomName = url.searchParams.get('room_name');

const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
const headerRoomName = document.getElementById(
  'header-room-name'
) as HTMLParagraphElement;
const messageInput = document.getElementById(
  'message-input'
) as HTMLInputElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const chatBoard = document.getElementById('chat-board') as HTMLDivElement;

let userId: string;

const setUserId = (id: string) => {
  userId = id;
};
const backHandler = () => {
  location.href = '/main/main.html';
};
const submitHandler = () => {
  clientIO.emit('chat', messageInput.value);
};
const keypressHandler = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    submitHandler();
  }
};
const renderMessageHandler = (data: ChatMessage) => {
  const chatBox = document.createElement('div');
  const isMe = data.user.id === userId;
  const time = dayjs(data.time).format('HH:mm');
  chatBox.classList.add(...['flex', 'mb-4', 'items-end']);
  chatBox.classList.add(isMe ? 'justify-end' : 'justify-start');
  chatBox.innerHTML = isMe
    ? `
    <p class="text-xs text-gray-700 mr-4">${time}</p>
    <div>
      <p class="text-xs text-white mb-1 text-right">${data.user.userName}</p>
      <p
        class="mx-w-[50%] break-all bg-white px-4 py-2 rounded-bl-full rounded-br-full rounded-tl-full"
      >
        ${data.message}
      </p>
    </div>
  `
    : `
      <div>
        <p class="text-xs text-gray-700 mb-1">${data.user.userName}</p>
        <p
          class="mx-w-[50%] break-all bg-gray-800 px-4 py-2 rounded-tr-full rounded-br-full rounded-tl-full text-white"
        >
        ${data.message}
        </p>
      </div>
      <p class="text-xs text-gray-700 ml-4">${time}</p>
    `;
  messageInput.value = '';
  chatBoard.appendChild(chatBox);
  chatBoard.scrollTop = chatBoard.scrollHeight;
};
const renderRoomNotifyHandler = (message: string) => {
  const notifyBox = document.createElement('div');
  notifyBox.classList.add(...['flex', 'justify-center', 'mb-4', 'items-end']);
  notifyBox.innerHTML = `<p class="text-gray-700 text-sm">${message}</p>`;
  chatBoard.appendChild(notifyBox);
  chatBoard.scrollTop = chatBoard.scrollHeight;
};

backBtn.addEventListener('click', backHandler);
submitBtn.addEventListener('click', submitHandler);
messageInput.addEventListener('keypress', keypressHandler);

if (userName && roomName) {
  headerRoomName.innerText = roomName || '-';
  // 設定使用者編號
  clientIO.on('user-id', setUserId);
  // 進入聊天室
  clientIO.emit('join', { userName, roomName });
  clientIO.on(
    'join',
    ({ userName, roomName }: { userName: string; roomName: string }) => {
      const message = `${userName} 加入 ${roomName} 聊天室`;
      renderRoomNotifyHandler(message);
    }
  );
  // 接收聊天訊息
  clientIO.on('chat', renderMessageHandler);
  // 離開聊天室
  clientIO.on(
    'leave',
    ({ userName, roomName }: { userName: string; roomName: string }) => {
      const message = `${userName} 離開 ${roomName} 聊天室`;
      renderRoomNotifyHandler(message);
    }
  );
} else backHandler();
