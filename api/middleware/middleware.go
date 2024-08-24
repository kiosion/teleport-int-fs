package middleware

import (
	"net/http"
	"github.com/goteleport-interview/fs4/api/auth"
	"github.com/goteleport-interview/fs4/api/utils"
)

func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, err := auth.GetSession(r)
		if err != nil {
			utils.RespondWithError(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
			utils.RespondWithError(w, "Authorization is required", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
