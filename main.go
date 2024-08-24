package main

import (
	"crypto/tls"
	"embed"
	"fmt"
	"io/fs"
	"log"

	"github.com/goteleport-interview/fs4/api"
)

const listenPort = 8081

//go:embed web/build
var assets embed.FS
//go:embed api/certs
var certs embed.FS

func main() {
	cert, err := certs.ReadFile("api/certs/localhost.pem")
	if err != nil {
		log.Fatalln("could not embed cert", err)
	}

	key, err := certs.ReadFile("api/certs/localhost-key.pem")
	if err != nil {
		log.Fatalln("could not embed key", err)
	}
	
	tlsCert, err := tls.X509KeyPair(cert, key)
	if err != nil {
		log.Fatalln("could not parse TLS keypair", err)
	}

	webassets, err := fs.Sub(assets, "web/build")
	if err != nil {
		log.Fatalln("could not embed webassets", err)
	}

	s, err := api.NewServer(webassets)
	if err != nil {
		log.Fatalln(err)
	}

	log.Println("Listening on port", listenPort)
	log.Fatalln(s.ListenAndServeTLS(fmt.Sprintf("localhost:%d", listenPort), tlsCert))
}
