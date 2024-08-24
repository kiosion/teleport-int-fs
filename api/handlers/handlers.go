// Package handlers contains HTTP handlers for API routese.
package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/goteleport-interview/fs4/api/auth"
)

// AuthBackend is the interface for the authentication backend.
type AuthBackend interface {
	GetSessionByID(id string) (*auth.Session, error)
	CreateSession(username string) (*auth.Session, error)
	DeleteSession(id string) error
	UpdateSession(id string, session *auth.Session) error
	GetUser(username string) (*auth.User, error)
	AddUser(username, password string) error
}

// APIResponse is the response format for the API.
type APIResponse struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data,omitempty"`
	Error  *APIError   `json:"error,omitempty"`
}

// APIError is the error format for the API.
type APIError struct {
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

type sessionReply struct {
	Username string    `json:"username"`
	Expires  time.Time `json:"expires"`
}

type filesResponse struct {
	Name     string          `json:"name"`
	Size     int64           `json:"size"`
	Type     string          `json:"type"`
	Modified time.Time       `json:"modified"`
	Contents []filesResponse `json:"contents"`
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type pathRequest struct {
	Path string `json:"path"`
}

var (
	// ErrDirNotFound is returned when the requested directory is not found.
	ErrDirNotFound = errors.New("directory not found")
	// ErrInvalidPath is returned when the requested path is invalid or not allowed.
	ErrInvalidPath = errors.New("invalid path")
	// ErrDirRead is returned when the requested directory cannot be read.
	ErrDirRead = errors.New("failed to read directory")
	// ErrInvalidReqBody is returned when the request body cannot be parsed.
	ErrInvalidReqBody = errors.New("invalid request payload")
)

// LoginHandler is the handler for the /login endpoint.
func LoginHandler(w http.ResponseWriter, r *http.Request, backend AuthBackend) {
	var creds loginRequest
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		RespondWithError(w, ErrInvalidReqBody.Error(), http.StatusBadRequest)
		return
	}

	user, err := backend.GetUser(creds.Username)
	if err != nil {
		_ = bcrypt.CompareHashAndPassword([]byte("$2y$12$EXAMPLEHASHFALLBACK12345678901234567890"), []byte(creds.Password))
		RespondWithError(w, auth.ErrInvalidCredentials.Error(), http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(creds.Password)); err != nil {
		RespondWithError(w, auth.ErrInvalidCredentials.Error(), http.StatusUnauthorized)
		return
	}

	session, err := backend.CreateSession(creds.Username)
	if err != nil {
		RespondWithError(w, auth.ErrSessionCreation.Error(), http.StatusInternalServerError)
		return
	}

	auth.SetCookie(w, auth.CookieData{ID: session.ID, Expires: session.ExpiresAt})
	RespondWithJSON(w, sessionReply{Username: session.Username, Expires: session.ExpiresAt}, http.StatusOK)
}

// LogoutHandler is the handler for the /logout endpoint.
func LogoutHandler(w http.ResponseWriter, r *http.Request, backend AuthBackend) {
	cookie, err := r.Cookie(auth.SessionCookieName)
	if err != nil {
		RespondWithJSON(w, nil, http.StatusOK)
		return
	}

	err = backend.DeleteSession(cookie.Value)
	if err != nil {
		RespondWithError(w, "Failed to delete session", http.StatusInternalServerError)
		return
	}

	auth.SetCookie(w, auth.CookieData{ID: "", Expires: time.Unix(0, 0)})
	RespondWithJSON(w, nil, http.StatusOK)
}

// MeHandler is the handler for the /me endpoint.
func MeHandler(w http.ResponseWriter, r *http.Request) {
	session, ok := r.Context().Value(auth.SessionContextKey).(*auth.Session)

	if !ok || session == nil {
		RespondWithError(w, auth.ErrAuthRequired.Error(), http.StatusUnauthorized)
		return
	}

	RespondWithJSON(w, sessionReply{Username: session.Username, Expires: session.ExpiresAt}, http.StatusOK)
}

// FilesHandler is the handler for the /files endpoint.
// It returns the contents of a requested directory.
func FilesHandler(rootDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var pathReq pathRequest
		if err := json.NewDecoder(r.Body).Decode(&pathReq); err != nil {
			RespondWithError(w, ErrInvalidReqBody.Error(), http.StatusBadRequest)
			return
		}

		path, err := cleanPath(rootDir, pathReq.Path)
		if err != nil {
			if err.Error() == ErrInvalidPath.Error() {
				RespondWithError(w, err.Error(), http.StatusBadRequest)
				return
			}
			RespondWithError(w, ErrDirRead.Error(), http.StatusInternalServerError)
			return
		}

		contents, err := getDirContents(path)
		if err != nil {
			if err.Error() == ErrDirNotFound.Error() {
				RespondWithError(w, err.Error(), http.StatusBadRequest)
				return
			}
			RespondWithError(w, ErrDirRead.Error(), http.StatusInternalServerError)
			return
		}

		response := formatDirContents(path, contents)

		RespondWithJSON(w, response, http.StatusOK)
	}
}

func formatDirContents(path string, files []fs.DirEntry) filesResponse {
	var contents []filesResponse
	for _, entry := range files {
		file, err := entry.Info()
		if err != nil {
			continue
		}
		fileSize := file.Size()
		fileType := "file"

		if file.IsDir() {
			fileType = "dir"
			fileSize = 0
		}

		contents = append(contents, filesResponse{
			Name:     file.Name(),
			Modified: file.ModTime(),
			Type:     fileType,
			Size:     fileSize,
		})
	}

	var modifiedTime time.Time
	baseFile, err := os.Stat(path)
	if err != nil {
		modifiedTime = time.Time{}
	} else {
		modifiedTime = baseFile.ModTime()
	}

	return filesResponse{
		Name:     filepath.Base(path),
		Modified: modifiedTime,
		Type:     "dir",
		Size:     0,
		Contents: contents,
	}
}

func cleanPath(rootDir string, path string) (string, error) {
	decodedPath, err := url.QueryUnescape(path)
	if err != nil {
		return "", err
	}
	cleanPath := filepath.Join(rootDir, filepath.Clean(string(os.PathSeparator)+decodedPath))

	// Make sure the path is within the root dir
	if !strings.HasPrefix(cleanPath, filepath.Clean(rootDir)) {
		return "", ErrInvalidPath
	}

	return cleanPath, nil
}

func getDirContents(path string) ([]fs.DirEntry, error) {
	dir, err := os.Open(path)
	if err != nil {
		return nil, ErrDirNotFound
	}
	defer closeFile(dir)

	files, err := dir.ReadDir(-1)
	if err != nil {
		return nil, err
	}

	return files, nil
}

func closeFile(f *os.File) {
	if err := f.Close(); err != nil {
		log.Printf("Error closing file: %v", err)
	}
}

// RequireAuth is middleware for protected routes.
func RequireAuth(next http.Handler, backend AuthBackend) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(auth.SessionCookieName)

		if err != nil {
			RespondWithError(w, auth.ErrAuthRequired.Error(), http.StatusUnauthorized)
			return
		}

		session, err := backend.GetSessionByID(cookie.Value)
		if err != nil {
			RespondWithError(w, err.Error(), http.StatusUnauthorized)
			return
		}

		if session.ExpiresAt.Before(time.Now()) {
			_ = backend.DeleteSession(session.ID)
			auth.SetCookie(w, auth.CookieData{ID: "", Expires: time.Unix(0, 0)})
			RespondWithError(w, auth.ErrSessionExpired.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), auth.SessionContextKey, session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RespondWithError sends an error response to the client.
func RespondWithError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	err := json.NewEncoder(w).Encode(APIResponse{Status: "error", Error: &APIError{Title: http.StatusText(code), Detail: message}})
	if err != nil {
		log.Printf("Failed to send error response: %v", err)
	}
}

// RespondWithJSON sends a success JSON response to the client.
func RespondWithJSON(w http.ResponseWriter, payload interface{}, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	err := json.NewEncoder(w).Encode(APIResponse{Status: "ok", Data: payload})
	if err != nil {
		log.Printf("Failed to send JSON response: %v", err)
	}
}
