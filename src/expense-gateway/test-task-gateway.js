import { io } from "socket.io-client";
import {SOCKET_EVENTS} from "../common/constants/events.constants.ts";

const socket = io("http://localhost:3000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTc1OTgwODU0MCwiZXhwIjoxNzU5ODk0OTQwfQ.oQGxWmGT-MDhWogpZKRV0Z9ZyvqXlHnwp2SpNtpZ67c", // nếu bạn đang dùng WsJwtGuard
  },
});

// Khi connect
socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit('message', 'Hello server!');

});

// Lắng nghe sự kiện
socket.on("tasksStatusUpdated", (data) => {
  console.log("Task status updated:", data);
});

socket.on("userAssignedToTask", (data)=> {
  console.log("User assigned to task:", data);
})

socket.on('message', (data) => {
  console.log('Message from server:', data);
})

socket.on(SOCKET_EVENTS.RECURRING_EXPENSE.EXECUTED, (data) => {
    console.log('Receive Recurring', JSON.stringify(data, null,2) );
})

socket.on(SOCKET_EVENTS.EXPENSE.CREATED, (data) => {
    console.log('Receive Expense Created', JSON.stringify(data, null,2) );
})