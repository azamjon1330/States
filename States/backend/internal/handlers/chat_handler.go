package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"hospital-backend/internal/middleware"
	"hospital-backend/internal/models"
	"hospital-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type WSMessage struct {
	Type       string    `json:"type"`
	SenderID   string    `json:"sender_id"`
	SenderName string    `json:"sender_name"`
	ReceiverID string    `json:"receiver_id,omitempty"`
	RoomName   string    `json:"room_name,omitempty"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}

type Client struct {
	ID   uuid.UUID
	Name string
	Conn *websocket.Conn
	Send chan []byte
	Hub  *ChatHub
	mu   sync.Mutex
}

type ChatHub struct {
	clients    map[uuid.UUID]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewChatHub() *ChatHub {
	return &ChatHub{
		clients:    make(map[uuid.UUID]*Client),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *ChatHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client.ID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *ChatHub) SendToUser(userID uuid.UUID, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if client, ok := h.clients[userID]; ok {
		select {
		case client.Send <- message:
		default:
		}
	}
}

func (c *Client) readPump(hub *ChatHub, msgRepo *repository.MessageRepository) {
	defer func() {
		hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(4096)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, data, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}

		msg.SenderID = c.ID.String()
		msg.SenderName = c.Name
		msg.CreatedAt = time.Now()

		// Save to database
		chatMsg := &models.ChatMessage{
			ID:       uuid.New(),
			SenderID: c.ID,
			Content:  msg.Content,
			RoomName: msg.RoomName,
		}
		if msg.ReceiverID != "" {
			recvID, err := uuid.Parse(msg.ReceiverID)
			if err == nil {
				chatMsg.ReceiverID = &recvID
			}
		}
		msgRepo.Create(chatMsg)

		outData, _ := json.Marshal(msg)

		// Direct message or broadcast
		if msg.ReceiverID != "" {
			recvID, err := uuid.Parse(msg.ReceiverID)
			if err == nil {
				hub.SendToUser(recvID, outData)
			}
			hub.SendToUser(c.ID, outData)
		} else {
			hub.broadcast <- outData
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

type ChatHandler struct {
	msgRepo  *repository.MessageRepository
	userRepo *repository.UserRepository
	hub      *ChatHub
}

func NewChatHandler(msgRepo *repository.MessageRepository, userRepo *repository.UserRepository, hub *ChatHub) *ChatHandler {
	return &ChatHandler{msgRepo: msgRepo, userRepo: userRepo, hub: hub}
}

// GET /api/chat/ws
func (h *ChatHandler) WebSocket(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userName := c.GetString("user_name")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:   userID,
		Name: userName,
		Conn: conn,
		Send: make(chan []byte, 256),
		Hub:  h.hub,
	}

	h.hub.register <- client

	go client.writePump()
	go client.readPump(h.hub, h.msgRepo)
}

// GET /api/chat/messages?receiver_id=&room=
func (h *ChatHandler) GetMessages(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	receiverIDStr := c.Query("receiver_id")
	roomName := c.Query("room")
	page, limit := parsePage(c)

	if receiverIDStr != "" {
		receiverID, parseErr := uuid.Parse(receiverIDStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receiver_id"})
			return
		}
		messages, total, err := h.msgRepo.GetConversation(userID, receiverID, page, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": messages, "total": total})
		return
	}

	messages, total, err := h.msgRepo.GetRoomMessages(roomName, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": messages, "total": total})
}

// GET /api/chat/rooms
func (h *ChatHandler) GetRooms(c *gin.Context) {
	rooms, err := h.msgRepo.GetRooms()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rooms})
}

// GET /api/chat/users
func (h *ChatHandler) GetUsers(c *gin.Context) {
	users, _, err := h.userRepo.List("", 1, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	h.hub.mu.RLock()
	type UserWithStatus struct {
		models.User
		Online bool `json:"online"`
	}
	result := make([]UserWithStatus, len(users))
	for i, u := range users {
		_, online := h.hub.clients[u.ID]
		result[i] = UserWithStatus{User: u, Online: online}
	}
	h.hub.mu.RUnlock()

	c.JSON(http.StatusOK, gin.H{"data": result})
}
