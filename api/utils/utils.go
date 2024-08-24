package utils

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Status string `json:"status"`
	Data interface{} `json:"data,omitempty"`
	Error *Error `json:"error,omitempty"`
}

type Error struct {
	Title string `json:"title"`
	Detail string `json:"detail"`
}

func RespondWithError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(Response{Status: "error", Error: &Error{Title: http.StatusText(code), Detail: message}})
}

func RespondWithJSON(w http.ResponseWriter, payload interface{}, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(Response{Status: "ok", Data: payload})
}
