// Package main is the entrypoint for the fs4 app.
package main

import (
	"crypto/tls"
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"os"

	"github.com/goteleport-interview/fs4/api"
	"github.com/goteleport-interview/fs4/api/auth"
)

var testUsers = map[string]string{
	"admin": "securePass!",
	"user":  "password123",
}

//go:embed web/build
var assets embed.FS

func main() {
	var listenPort int
	var baseDir string
	var certFileLoc string
	var keyFileLoc string

	flag.IntVar(&listenPort, "p", 8081, "port to listen on, default 8081")
	flag.StringVar(&baseDir, "d", "./files/", "directory to serve files from, default ./files/")
	flag.StringVar(&certFileLoc, "cert", "api/certs/localhost.pem", "location of cert file")
	flag.StringVar(&keyFileLoc, "key", "api/certs/localhost-key.pem", "location of key file")

	flag.Parse()

	cert, err := os.ReadFile(certFileLoc)
	if err != nil {
		log.Fatalln("Could not read cert", err)
	}

	key, err := os.ReadFile(keyFileLoc)
	if err != nil {
		log.Fatalln("Could not read key", err)
	}

	tlsCert, err := tls.X509KeyPair(cert, key)
	if err != nil {
		log.Fatalln("Could not parse TLS keypair", err)
	}

	webassets, err := fs.Sub(assets, "web/build")
	if err != nil {
		log.Fatalln("Could not embed webassets", err)
	}

	// check baseDir is dir and exists
	dirInfo, err := os.Stat(baseDir)
	if err != nil {
		log.Fatalf("Could not stat directory: %s\n", err)
	}
	if !dirInfo.IsDir() {
		log.Fatalf("Provided path is not a directory: %s\n", baseDir)
	}

	authBackend := auth.NewInMemoryBackend()

	// Add test users
	for user, pass := range testUsers {
		err := authBackend.AddUser(user, pass)
		if err != nil {
			log.Fatalf("Could not add user: %s\n", err)
		}
	}

	s, err := api.NewServer(webassets, baseDir, authBackend)
	if err != nil {
		log.Fatalln(err)
	}

	log.Printf("Listening on localhost:%d\n", listenPort)
	log.Printf("Serving files from %s\n", baseDir)
	log.Fatalln(s.ListenAndServeTLS(fmt.Sprintf("localhost:%d", listenPort), tlsCert))
}
