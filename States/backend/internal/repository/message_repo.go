package repository

import (
	"hospital-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MessageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) Create(msg *models.ChatMessage) error {
	return r.db.Create(msg).Error
}

func (r *MessageRepository) GetConversation(userA, userB uuid.UUID, page, limit int) ([]models.ChatMessage, int64, error) {
	var messages []models.ChatMessage
	var total int64

	q := r.db.Model(&models.ChatMessage{}).Preload("Sender").
		Where(
			"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			userA, userB, userB, userA,
		)

	q.Count(&total)
	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at ASC").Find(&messages).Error
	return messages, total, err
}

func (r *MessageRepository) GetRoomMessages(roomName string, page, limit int) ([]models.ChatMessage, int64, error) {
	var messages []models.ChatMessage
	var total int64

	q := r.db.Model(&models.ChatMessage{}).Preload("Sender").
		Where("room_name = ?", roomName)

	q.Count(&total)
	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at ASC").Find(&messages).Error
	return messages, total, err
}

type ChatRoom struct {
	RoomName      string    `json:"room_name"`
	LastMessage   string    `json:"last_message"`
	LastMessageAt string    `json:"last_message_at"`
	SenderID      uuid.UUID `json:"sender_id"`
}

func (r *MessageRepository) GetRooms() ([]ChatRoom, error) {
	var rooms []ChatRoom
	err := r.db.Raw(`
		SELECT DISTINCT ON (room_name) room_name,
		       content as last_message,
		       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as last_message_at,
		       sender_id
		FROM chat_messages
		WHERE room_name != ''
		ORDER BY room_name, created_at DESC
	`).Scan(&rooms).Error
	return rooms, err
}

func (r *MessageRepository) GetDirectConversations(userID uuid.UUID) ([]models.ChatMessage, error) {
	var messages []models.ChatMessage
	err := r.db.Raw(`
		SELECT DISTINCT ON (LEAST(sender_id::text, receiver_id::text) || GREATEST(sender_id::text, receiver_id::text))
		       *
		FROM chat_messages
		WHERE (sender_id = ? OR receiver_id = ?) AND room_name = ''
		ORDER BY LEAST(sender_id::text, receiver_id::text) || GREATEST(sender_id::text, receiver_id::text), created_at DESC
	`, userID, userID).Scan(&messages).Error
	return messages, err
}

func (r *MessageRepository) MarkRead(senderID, receiverID uuid.UUID) error {
	return r.db.Model(&models.ChatMessage{}).
		Where("sender_id = ? AND receiver_id = ? AND read = false", senderID, receiverID).
		Update("read", true).Error
}
