package api

import (
	"crypto/tls"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	// "golang.org/x/crypto/bcrypt"

	"github.com/goteleport-interview/fs4/api/routes"
	"github.com/goteleport-interview/fs4/api/middleware"
	"github.com/goteleport-interview/fs4/api/utils"
	"github.com/rs/cors"
)

// Server serves the directory browser API and webapp.
type Server struct {
	handler http.Handler
}

// NewServer creates a directory browser server.
// It serves webassets from the provided filesystem.
func NewServer(webassets fs.FS) (*Server, error) {
	mux := http.NewServeMux()
	s := &Server{handler: mux}

	// API routes
	mux.Handle("/api/v1/auth/login", http.HandlerFunc(routes.LoginHandler))
	mux.Handle("/api/v1/auth/logout", http.HandlerFunc(routes.LogoutHandler))
	mux.Handle("/api/v1/auth/validate", http.HandlerFunc(routes.ValidateSessionHandler))
	mux.Handle("/api/v1/files", middleware.Auth(http.HandlerFunc(routes.FilesHandler)))
	// mux.Handle("/api/v1/auth/refresh", http.HandlerFunc(routes.RefreshTokenHandler))
	// mux.Handle("/temp/genpassword", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 	// get pw from url query
	// 	pw := r.URL.Query().Get("pw")
	// 	// generate hash
	// 	hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	// 	if err != nil {
	// 		utils.RespondWithError(w, "Failed to generate hash", http.StatusInternalServerError)
	// 		return
	// 	}
	// 	// respond with hash
	// 	utils.RespondWithJSON(w, map[string]string{"hash": string(hash)}, http.StatusOK)
	// }))

	// fall back to 404 for any unknown /api routes
	mux.Handle("/api/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		utils.RespondWithError(w, "Requested resource could not be found or does not exist", http.StatusNotFound)
	}))

	// web assets
	hfs := http.FS(webassets)
	files := http.FileServer(hfs)
	mux.Handle("/static/", files)
	mux.Handle("/favicon.ico", files)

	// fall back to index.html for all unknown routes
	index, err := extractIndexHTML(hfs)
	if err != nil {
		return nil, err
	}
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write(index); err != nil {
			log.Println("failed to serve index.html", err)
		}
	}))

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowCredentials: true,
		AllowedMethods: []string{"GET", "POST"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
	})

	s.handler = c.Handler(mux)
	return s, nil
}

func (s *Server) ListenAndServeTLS(addr string, cert tls.Certificate) error {
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion: tls.VersionTLS12,
		MaxVersion: tls.VersionTLS13,
	}

	server := &http.Server{
		Addr:				addr,
		Handler:		s.handler,
		TLSConfig:	tlsConfig,
	}

	// TODO: redirect http to https
	return server.ListenAndServeTLS("", "")
}

func extractIndexHTML(fs http.FileSystem) ([]byte, error) {
	f, err := fs.Open("index.html")
	if err != nil {
		return nil, fmt.Errorf("could not open index.html: %w", err)
	}
	defer f.Close()

	b, err := io.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("could not read index.html: %w", err)
	}

	return b, nil
}
