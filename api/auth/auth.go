package auth

import (
	"errors"
	"net/http"
	// "time"

	"golang.org/x/crypto/bcrypt"

	"github.com/gorilla/sessions"
)

// var jwtKey = []byte("secret_key")

var users = map[string]string{
	"user1": "$2a$10$./RuxhHzcOh1MlYn1N/6x.3mze3MX7RE1sHGhu99xpZFi5cNtNVie", // password123
	"admin": "$2a$10$5B3iKK3fmqk5TLkYrKsmt.yJI5wU8E6uo.Zd0Lc7bBCLDKnjEYI3O", // securepass!
}

var fallbackHashedPassword = "$6$bXb6Xc1FUKeqbe6U$ZBUPjexIU5PXc1tojIJhqyRz4ioeF0TkyTMXvPiTRjKHWU6V6ThgNPtgDtmfMe.cQfbbpaXwdfqfto6zO5j8s1"

var store = sessions.NewCookieStore([]byte("super_secret"))

func GetSession(r *http.Request) (*sessions.Session, error) {
	session, err := store.Get(r, "session-token")
	if err != nil {
		return nil, err
	}

	session.Options.HttpOnly = true
	session.Options.Secure = true
	session.Options.SameSite = http.SameSiteLaxMode

	return session, nil
}

func AuthenticateUser(username, password string) error {
	hashedPassword, ok := users[username]
	if !ok {
		hashedPassword = fallbackHashedPassword
	}

	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil || !ok {
		return errors.New("Invalid username or password")
	}

	return nil
}

// type Claims struct {
// 	Username string `json:"username"`
// 	jwt.StandardClaims
// }

// func GenerateToken(username string) (string, error) {
// 	expirationTime := time.Now().Add(30 * time.Minute)
// 	claims := &Claims{
// 		Username: username,
// 		StandardClaims: jwt.StandardClaims{
// 			ExpiresAt: expirationTime.Unix(),
// 		},
// 	}

// 	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
// 	tokenString, err := token.SignedString(jwtKey)

// 	if err != nil {
// 		return "", err
// 	}

// 	return tokenString, nil
// }

// func OldAuthenticateUser(username, password string) error {
// 	hashedPassword, ok := users[username]

// 	if !ok {
// 		hashedPassword = fallbackHashedPassword
// 	}

// 	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))

// 	if err != nil || !ok {
// 		return errors.New("Invalid username or password")
// 	}

// 	return nil
// }

// func ValidateToken(tokenString string) (*Claims, error) {
// 	claims := &Claims{}
// 	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
// 		return jwtKey, nil
// 	})

// 	if err != nil {
// 		if err == jwt.ErrSignatureInvalid {
// 			return nil, err
// 		}
// 		return nil, err
// 	}

// 	if !token.Valid {
// 		return nil, errors.New("Invalid token")
// 	}

// 	return claims, nil
// }
