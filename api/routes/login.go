package routes

import (
	"encoding/json"
	"net/http"

	"github.com/goteleport-interview/fs4/api/auth"
	"github.com/goteleport-interview/fs4/api/utils"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		utils.RespondWithError(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err = auth.AuthenticateUser(req.Username, req.Password)
	if err != nil {
		utils.RespondWithError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	session, err := auth.GetSession(r)
	if err != nil {
		utils.RespondWithError(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	session.Values["authenticated"] = true
	session.Values["username"] = req.Username
	err = session.Save(r, w)
	if err != nil {
		utils.RespondWithError(w, "Failed to save session", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, nil, http.StatusOK)
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	session, err := auth.GetSession(r)
	if err != nil {
		utils.RespondWithError(w, "Failed to get session", http.StatusInternalServerError)
		return
	}

	session.Values["authenticated"] = false
	session.Options.MaxAge = -1
	err = session.Save(r, w)
	if err != nil {
		utils.RespondWithError(w, "Failed to save session", http.StatusInternalServerError)
		return
	}

	utils.RespondWithJSON(w, nil, http.StatusOK)
}

func ValidateSessionHandler(w http.ResponseWriter, r *http.Request) {
	session, err := auth.GetSession(r)
	if err != nil {
		utils.RespondWithError(w, "Failed to get session", http.StatusInternalServerError)
		return
	}

	auth, ok := session.Values["authenticated"].(bool)
	if !ok || !auth {
		utils.RespondWithError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	utils.RespondWithJSON(w, nil, http.StatusOK)
}

// func LoginHandler(w http.ResponseWriter, r *http.Request) {
// 	var creds User
// 	err := json.NewDecoder(r.Body).Decode(&creds)
// 	if err != nil {
// 		utils.RespondWithError(w, "Invalid request payload", http.StatusBadRequest)
// 		return
// 	}

// 	err = auth.AuthenticateUser(creds.Username, creds.Password)
// 	if err != nil {
// 		utils.RespondWithError(w, err.Error(), http.StatusUnauthorized)
// 		return
// 	}

// 	tokenString, err := auth.GenerateToken(creds.Username)
// 	if err != nil {
// 		utils.RespondWithError(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	utils.RespondWithJSON(w, map[string]string{"token": tokenString}, http.StatusOK)
// }
