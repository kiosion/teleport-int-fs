package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func TestAddUser(t *testing.T) {
	backend := NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	user, err := backend.GetUser("testuser")
	if err != nil {
		t.Fatalf("expected to find user, got error %v", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte("password")); err != nil {
		t.Fatalf("expected passwords to match, got error %v", err)
	}
}

func TestGetUser(t *testing.T) {
	backend := NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	_, err = backend.GetUser("nonexistentuser")
	if err != ErrUserNotFound {
		t.Fatalf("expected ErrUserNotFound, got %v", err)
	}

	user, err := backend.GetUser("testuser")
	if err != nil {
		t.Fatalf("expected to find user, got error %v", err)
	}

	if user.Username != "testuser" {
		t.Errorf("expected username 'testuser', got '%s'", user.Username)
	}
}

func TestCreateSession(t *testing.T) {
	backend := NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	session, err := backend.CreateSession("testuser")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if session.Username != "testuser" {
		t.Errorf("expected username 'testuser', got '%s'", session.Username)
	}

	storedSession, err := backend.GetSessionByID(session.ID)
	if err != nil {
		t.Fatalf("expected to find session, got error %v", err)
	}

	if storedSession.ID != session.ID {
		t.Errorf("expected session ID '%s', got '%s'", session.ID, storedSession.ID)
	}
}

func TestGetSessionByID(t *testing.T) {
	backend := NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	session, _ := backend.CreateSession("testuser")

	storedSession, err := backend.GetSessionByID(session.ID)
	if err != nil {
		t.Fatalf("expected to find session, got error %v", err)
	}

	if storedSession.Username != "testuser" {
		t.Errorf("expected username 'testuser', got '%s'", storedSession.Username)
	}

	_, err = backend.GetSessionByID("invalidsessionid")
	if err != ErrSessionNotFound {
		t.Fatalf("expected ErrSessionNotFound, got %v", err)
	}
}

func TestDeleteSession(t *testing.T) {
	backend := NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	session, _ := backend.CreateSession("testuser")

	err = backend.DeleteSession(session.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = backend.GetSessionByID(session.ID)
	if err != ErrSessionNotFound {
		t.Fatalf("expected ErrSessionNotFound, got %v", err)
	}
}

func TestSessionExpiration(t *testing.T) {
	backend := NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	session, _ := backend.CreateSession("testuser")

	err = backend.UpdateSession(session.ID, &Session{
		ID:        session.ID,
		Username:  session.Username,
		ExpiresAt: time.Now().Truncate(time.Second).Add(-1 * time.Hour),
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	_, err = backend.GetSessionByID(session.ID)
	if err != ErrSessionExpired {
		t.Fatalf("expected ErrSessionExpired, got %v", err)
	}
}

func TestSetCookie(t *testing.T) {
	recorder := httptest.NewRecorder()
	// convert exp time to utc, strip MS since cookie doesn't store them
	expirationTime := time.Now().Truncate(time.Second).Add(SessionMaxAge)
	cookieData := CookieData{
		ID:      "test-session-id",
		Expires: expirationTime,
	}

	SetCookie(recorder, cookieData)

	resp := recorder.Result()
	cookies := resp.Cookies()
	if len(cookies) != 1 {
		t.Fatalf("expected 1 cookie, got %d", len(cookies))
	}

	cookie := cookies[0]
	if cookie.Name != SessionCookieName {
		t.Errorf("expected cookie name to be '%v', got '%v'", SessionCookieName, cookie.Name)
	}
	if cookie.Value != "test-session-id" {
		t.Errorf("expected cookie value to be 'test-session-id', got '%s'", cookie.Value)
	}
	if !cookie.Expires.Equal(expirationTime) {
		t.Errorf("expected cookie expiration to be '%v', got '%v'", expirationTime, cookie.Expires)
	}
	if !cookie.HttpOnly {
		t.Error("expected cookie to be HttpOnly")
	}
	if cookie.Path != "/" {
		t.Errorf("expected cookie path to be '/', got '%s'", cookie.Path)
	}
	if cookie.SameSite != http.SameSiteStrictMode {
		t.Errorf("expected cookie SameSite to be 'Strict', got '%v'", cookie.SameSite)
	}
	if !cookie.Secure {
		t.Error("expected cookie to be Secure")
	}
}
