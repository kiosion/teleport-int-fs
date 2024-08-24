// Package api provides the HTTP server for the fs4 app.
package api

import (
	"crypto/tls"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"

	"github.com/goteleport-interview/fs4/api/handlers"

	"github.com/rs/cors"
)

// Server serves the directory browser API and webapp.
type Server struct {
	handler http.Handler
}

// NewServer creates a directory browser server.
// It serves webassets from the provided filesystem.
func NewServer(webassets fs.FS, baseDir string, authBackend handlers.AuthBackend) (*Server, error) {
	mux := http.NewServeMux()
	s := &Server{handler: mux}

	// API routes
	mux.Handle("POST /api/v1/auth/login", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlers.LoginHandler(w, r, authBackend)
	}))
	mux.Handle("POST /api/v1/auth/logout", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlers.LogoutHandler(w, r, authBackend)
	}))
	mux.Handle("GET /api/v1/auth/me", handlers.RequireAuth(http.HandlerFunc(handlers.MeHandler), authBackend))
	mux.Handle("POST /api/v1/files", handlers.RequireAuth(http.HandlerFunc(handlers.FilesHandler(baseDir)), authBackend))

	// Fall back to 404 for any unknown /api routes
	mux.Handle("/api/", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		handlers.RespondWithError(w, "Requested resource could not be found or does not exist", http.StatusNotFound)
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
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if _, err := w.Write(index); err != nil {
			log.Println("failed to serve index.html", err)
		}
	}))

	// CORS :)
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
	})

	s.handler = c.Handler(mux)
	return s, nil
}

// ListenAndServeTLS starts the server on the specified address.
func (s *Server) ListenAndServeTLS(addr string, cert tls.Certificate) error {
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
		MaxVersion:   tls.VersionTLS13,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,         // uint16 = 0xc02f
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,       // uint16 = 0xc02b
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,         // uint16 = 0xc030
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,       // uint16 = 0xc02c
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,   // uint16 = 0xcca8
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256, // uint16 = 0xcca9
		},
	}

	server := &http.Server{
		Addr:      addr,
		Handler:   s.handler,
		TLSConfig: tlsConfig,
	}

	return server.ListenAndServeTLS("", "")
}

func extractIndexHTML(fs http.FileSystem) ([]byte, error) {
	f, err := fs.Open("index.html")
	if err != nil {
		return nil, fmt.Errorf("could not open index.html: %w", err)
	}
	// nolint:errcheck
	defer f.Close()

	b, err := io.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("could not read index.html: %w", err)
	}

	return b, nil
}
