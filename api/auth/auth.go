// Package auth contains authentication logic and the in-memory backend implementation.
package auth

import (
	"errors"
	"net/http"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"
)

// Session represents a user session.
type Session struct {
	ID        string
	Username  string
	ExpiresAt time.Time
}

// User represents user credentials.
type User struct {
	Username     string
	PasswordHash string
}

// CookieData represents the data to be stored in a Session cookie.
type CookieData struct {
	ID      string
	Expires time.Time
}

// InMemoryBackend is an in-memory implementation of the AuthBackend interface.
type InMemoryBackend struct {
	users    map[string]User
	sessions map[string]Session
	mutex    sync.Mutex
}

type contextKey string

// SessionContextKey is a context key for accessing the session within handlers.
const SessionContextKey contextKey = "session"

// SessionCookieName is the name of the session cookie.
const SessionCookieName = "session_id"

// SessionCookiePath is the path of the session cookie.
const SessionCookiePath = "/"

// SessionMaxAge is the maximum age of a session.
const SessionMaxAge = 30 * time.Minute // 30min expiry

// NewInMemoryBackend creates a new in-memory backend instance.
func NewInMemoryBackend() *InMemoryBackend {
	return &InMemoryBackend{
		users:    make(map[string]User),
		sessions: make(map[string]Session),
	}
}

var (
	// ErrUserNotFound is returned when a user is not found.
	ErrUserNotFound = errors.New("user not found")
	// ErrInvalidCredentials is returned when invalid credentials are provided.
	ErrInvalidCredentials = errors.New("invalid username or password")
	// ErrAuthRequired is returned when authorization is required.
	ErrAuthRequired = errors.New("authorization required")
	// ErrSessionNotFound is returned when a session is not found.
	ErrSessionNotFound = errors.New("session not found")
	// ErrSessionExpired is returned when a session has expired.
	ErrSessionExpired = errors.New("session expired")
	// ErrSessionCreation is returned when a session cannot be created.
	ErrSessionCreation = errors.New("session creation failed")
)

// GetSessionByID retrieves a session by its ID.
func (b *InMemoryBackend) GetSessionByID(id string) (*Session, error) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	session, exists := b.sessions[id]
	if !exists {
		return nil, ErrSessionNotFound
	}

	if session.ExpiresAt.Before(time.Now().Truncate(time.Second)) {
		delete(b.sessions, id)
		return nil, ErrSessionExpired
	}

	return &session, nil
}

// CreateSession creates a new session for a user.
func (b *InMemoryBackend) CreateSession(username string) (*Session, error) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	sessionID := uuid.NewString()
	session := Session{
		ID:        sessionID,
		Username:  username,
		ExpiresAt: time.Now().Truncate(time.Second).Add(SessionMaxAge),
	}

	b.sessions[sessionID] = session
	return &session, nil
}

// DeleteSession removes a session by its ID.
func (b *InMemoryBackend) DeleteSession(id string) error {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	delete(b.sessions, id)
	return nil
}

// UpdateSession replaces a given session with a new one.
func (b *InMemoryBackend) UpdateSession(id string, session *Session) error {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	b.sessions[id] = *session
	return nil
}

// GetUser retrieves a user by their username.
func (b *InMemoryBackend) GetUser(username string) (*User, error) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	user, exists := b.users[username]
	if !exists {
		return nil, ErrUserNotFound
	}

	return &user, nil
}

// AddUser adds a new user to the backend.
func (b *InMemoryBackend) AddUser(username, password string) error {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	b.users[username] = User{
		Username:     username,
		PasswordHash: string(hashedPassword),
	}
	return nil
}

// SetCookie is a helper for consistent cookie creation
func SetCookie(w http.ResponseWriter, data CookieData) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    data.ID,
		Expires:  data.Expires,
		HttpOnly: true,
		Path:     SessionCookiePath,
		SameSite: http.SameSiteStrictMode,
		Secure:   true,
	})
}
