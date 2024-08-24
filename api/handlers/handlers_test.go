package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/goteleport-interview/fs4/api/auth"
)

type TestAPIResponse struct {
	Status string          `json:"status"`
	Data   json.RawMessage `json:"data,omitempty"`
	Error  *APIError       `json:"error,omitempty"`
}

func TestLoginHandler(t *testing.T) {
	backend := auth.NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		LoginHandler(w, r, backend)
	})

	t.Run("valid login", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]string{
			"username": "testuser",
			"password": "password",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(reqBody))
		recorder := httptest.NewRecorder()

		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected status OK, got %v", resp.Status)
		}

		var apiResp TestAPIResponse
		if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if apiResp.Status != "ok" {
			t.Errorf("expected status 'success', got '%s'", apiResp.Status)
		}

		var session sessionReply
		if err := json.Unmarshal(apiResp.Data, &session); err != nil {
			t.Fatalf("failed to unmarshal data: %v", err)
		}

		if session.Username != "testuser" {
			t.Errorf("expected username 'testuser', got '%s'", session.Username)
		}
	})

	t.Run("invalid login", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]string{
			"username": "testuser",
			"password": "wrongpassword",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(reqBody))
		recorder := httptest.NewRecorder()

		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusUnauthorized {
			t.Fatalf("expected status Unauthorized, got %v", resp.Status)
		}
	})
}

func TestLogoutHandler(t *testing.T) {
	backend := auth.NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		LogoutHandler(w, r, backend)
	})

	t.Run("valid logout", func(t *testing.T) {
		session, _ := backend.CreateSession("testuser")

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
		req.AddCookie(&http.Cookie{
			Name:     auth.SessionCookieName,
			Value:    session.ID,
			Expires:  session.ExpiresAt,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Path:     auth.SessionCookiePath,
		})
		recorder := httptest.NewRecorder()

		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected status OK, got %v", resp.Status)
		}
	})
}

func TestMeHandler(t *testing.T) {
	backend := auth.NewInMemoryBackend()
	err := backend.AddUser("testuser", "password")
	if err != nil {
		t.Fatalf("failed to add user: %v", err)
	}

	handler := RequireAuth(http.HandlerFunc(MeHandler), backend)

	t.Run("valid session", func(t *testing.T) {
		session, _ := backend.CreateSession("testuser")

		req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
		req.AddCookie(&http.Cookie{
			Name:     auth.SessionCookieName,
			Value:    session.ID,
			Expires:  session.ExpiresAt,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Path:     auth.SessionCookiePath,
		})
		recorder := httptest.NewRecorder()

		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected status OK, got %v", resp.Status)
		}

		var apiResp TestAPIResponse
		if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		var sessionReply sessionReply
		if err := json.Unmarshal(apiResp.Data, &sessionReply); err != nil {
			t.Fatalf("failed to unmarshal session reply: %v", err)
		}

		if sessionReply.Username != "testuser" {
			t.Errorf("expected username 'testuser', got '%s'", sessionReply.Username)
		}
	})

	t.Run("expired session", func(t *testing.T) {
		session, _ := backend.CreateSession("testuser")
		err := backend.UpdateSession(session.ID, &auth.Session{
			Username:  session.Username,
			ExpiresAt: time.Now().Add(-1 * time.Hour),
		})

		if err != nil {
			t.Fatalf("failed to update session: %v", err)
		}

		req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
		req.AddCookie(&http.Cookie{
			Name:     auth.SessionCookieName,
			Value:    session.ID,
			Expires:  session.ExpiresAt,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Path:     auth.SessionCookiePath,
		})
		recorder := httptest.NewRecorder()

		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusUnauthorized {
			t.Fatalf("expected status Unauthorized, got %v", resp.Status)
		}
	})
}

func TestFilesHandler(t *testing.T) {
	t.Run("valid path", func(t *testing.T) {
		rootDir, err := os.MkdirTemp(os.TempDir(), "testfiles")
		if err != nil {
			t.Fatalf("failed to create temp dir: %v", err)
		}
		// nolint:errcheck
		defer os.RemoveAll(rootDir)

		subDir := filepath.Join(rootDir, "subdir")
		if err := os.Mkdir(subDir, 0755); err != nil {
			t.Fatalf("failed to create subdir: %v", err)
		}

		tmpFile := filepath.Join(subDir, "testfile.txt")
		if err := os.WriteFile(tmpFile, []byte("test content"), 0644); err != nil {
			t.Fatalf("failed to create temp file: %v", err)
		}

		reqBody, _ := json.Marshal(map[string]string{
			"path": "subdir",
		})

		req := httptest.NewRequest(http.MethodPost, "/api/v1/files", bytes.NewBuffer(reqBody))
		recorder := httptest.NewRecorder()

		handler := FilesHandler(rootDir)
		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected status OK, got %v", resp.Status)
		}

		var apiResp TestAPIResponse
		if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		var data map[string]interface{}
		if err := json.Unmarshal(apiResp.Data, &data); err != nil {
			t.Fatalf("failed to unmarshal data: %v", err)
		}

		contents, ok := data["contents"].([]interface{})
		if !ok {
			t.Fatalf("expected contents to be a list, got %T", data["contents"])
		}
		if len(contents) != 1 {
			t.Fatalf("expected 1 file, got %d", len(contents))
		}

		fileInfo, ok := contents[0].(map[string]interface{})
		if !ok {
			t.Fatalf("expected file info to be a map, got %T", contents[0])
		}
		if fileInfo["name"] != "testfile.txt" {
			t.Errorf("expected file name 'testfile.txt', got '%s'", fileInfo["name"])
		}
	})

	t.Run("invalid path", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]string{
			"path": "invalid",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/files", bytes.NewBuffer(reqBody))
		recorder := httptest.NewRecorder()

		handler := FilesHandler("")
		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("expected status BadRequest, got %v", resp.Status)
		}
	})

	t.Run("directory traversal", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]string{
			"path": "../../",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/files", bytes.NewBuffer(reqBody))
		recorder := httptest.NewRecorder()

		handler := FilesHandler("")
		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("expected status BadRequest, got %v", resp.Status)
		}
	})

	t.Run("subdir", func(t *testing.T) {
		rootDir, err := os.MkdirTemp(os.TempDir(), "testfiles")
		if err != nil {
			t.Fatalf("failed to create temp dir: %v", err)
		}
		// nolint:errcheck
		defer os.RemoveAll(rootDir)

		subDir := filepath.Join(rootDir, "subdir")
		if err := os.Mkdir(subDir, 0755); err != nil {
			t.Fatalf("failed to create subdir: %v", err)
		}

		tmpFile := filepath.Join(subDir, "testfile.txt")
		if err := os.WriteFile(tmpFile, []byte("test content"), 0644); err != nil {
			t.Fatalf("failed to create temp file: %v", err)
		}

		reqBody, _ := json.Marshal(map[string]string{
			"path": "subdir",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/files", bytes.NewBuffer(reqBody))
		recorder := httptest.NewRecorder()

		handler := FilesHandler(rootDir)
		handler.ServeHTTP(recorder, req)

		resp := recorder.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected status OK, got %v", resp.Status)
		}

		var apiResp TestAPIResponse
		if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		var data map[string]interface{}
		if err := json.Unmarshal(apiResp.Data, &data); err != nil {
			t.Fatalf("failed to unmarshal data: %v", err)
		}

		contents, ok := data["contents"].([]interface{})
		if !ok {
			t.Fatalf("expected contents to be a list, got %T", data["contents"])
		}
		if len(contents) != 1 {
			t.Fatalf("expected 1 file, got %d", len(contents))
		}

		fileInfo, ok := contents[0].(map[string]interface{})
		if !ok {
			t.Fatalf("expected file info to be a map, got %T", contents[0])
		}
		if fileInfo["name"] != "testfile.txt" {
			t.Errorf("expected file name 'testfile.txt', got '%s'", fileInfo["name"])
		}
	})
}

func TestCleanPath(t *testing.T) {
	rootDir := "testfiles"
	tests := []struct {
		name     string
		path     string
		expected string
	}{
		{"valid path", "subdir", filepath.Join(rootDir, "subdir")},
		{"invalid path traversal", "../../../../etc/passwd", filepath.Join(rootDir, "etc/passwd")},
		{"empty path", "", rootDir},
		{"root path", "/", rootDir},
		{"weird subdirs", "subdir/../subdir/./subdir", filepath.Join(rootDir, "subdir/subdir")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cleanPath, _ := cleanPath(rootDir, tt.path)
			if cleanPath != tt.expected {
				t.Fatalf("expected: %s, got: %s", tt.expected, cleanPath)
			}
		})
	}
}

func TestGetDirContents(t *testing.T) {
	rootDir, err := os.MkdirTemp(os.TempDir(), "testfiles")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	// nolint:errcheck
	defer os.RemoveAll(rootDir)

	subDir := filepath.Join(rootDir, "subdir")
	if err := os.Mkdir(subDir, 0755); err != nil {
		t.Fatalf("failed to create subdir: %v", err)
	}

	tmpFile := filepath.Join(subDir, "testfile.txt")
	if err := os.WriteFile(tmpFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}

	tests := []struct {
		name     string
		path     string
		expected int
		hasError bool
	}{
		{"valid dir", subDir, 1, false},
		{"invalid dir", filepath.Join(rootDir, "invalid"), 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			contents, err := getDirContents(tt.path)
			if (err != nil) != tt.hasError {
				t.Fatalf("expected error: %v, got: %v", tt.hasError, err)
			}
			if len(contents) != tt.expected {
				t.Fatalf("expected: %d, got: %d", tt.expected, len(contents))
			}
		})
	}
}

func TestFormatDirContents(t *testing.T) {
	rootDir, err := os.MkdirTemp(os.TempDir(), "testfiles")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	// nolint:errcheck
	defer os.RemoveAll(rootDir)

	tmpFile := filepath.Join(rootDir, "testfile.txt")
	if err := os.WriteFile(tmpFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}

	files, err := os.ReadDir(rootDir)
	if err != nil {
		t.Fatalf("failed to read dir: %v", err)
	}

	response := formatDirContents(rootDir, files)

	if response.Name != filepath.Base(rootDir) {
		t.Errorf("expected dir name '%s', got '%s'", filepath.Base(rootDir), response.Name)
	}

	if len(response.Contents) != 1 {
		t.Fatalf("expected 1 file, got %d", len(response.Contents))
	}

	fileInfo := response.Contents[0]
	if fileInfo.Name != "testfile.txt" {
		t.Errorf("expected file name 'testfile.txt', got '%s'", fileInfo.Name)
	}
	if fileInfo.Type != "file" {
		t.Errorf("expected file type 'file', got '%s'", fileInfo.Type)
	}
	if fileInfo.Size != 12 {
		t.Errorf("expected file size '12', got '%d'", fileInfo.Size)
	}
}
