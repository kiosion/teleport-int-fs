package routes

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"net/url"
	"io/fs"

	// "github.com/goteleport-interview/fs4/api/auth"
	"github.com/goteleport-interview/fs4/api/utils"
)

func FilesHandler(w http.ResponseWriter, r *http.Request) {
	// authHeader := r.Header.Get("Authorization")
	// if authHeader == "" {
	// 	utils.RespondWithError(w, "Authorization is required", http.StatusUnauthorized)
	// 	return
	// }

	// tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	// _, err := auth.ValidateToken(tokenString)
	// if err != nil {
	// 	utils.RespondWithError(w, err.Error(), http.StatusForbidden)
	// 	return
	// }

	path, err := CleanPath(r.URL.Query().Get("path"))
	if err != nil {
		if err.Error() == "Invalid path" {
			utils.RespondWithError(w, "Invalid path", http.StatusBadRequest)
			return
		}
		utils.RespondWithError(w, "Failed to read directory", http.StatusInternalServerError)
		return
	}

	contents, err := GetDirContents(path)
	if err != nil {
		if err.Error() == "Directory not found" {
			utils.RespondWithError(w, "Directory not found", http.StatusBadRequest)
			return
		}
		utils.RespondWithError(w, "Failed to read directory", http.StatusInternalServerError)
		return
	}

	response := FormatDirContents(path, contents)

	utils.RespondWithJSON(w, response, http.StatusOK)
}

func FormatDirContents(path string, files []os.FileInfo) map[string]interface{} {
	var contents []map[string]interface{}
	for _, file := range files {
		fileSize := file.Size()
		fileType := "file"
		
		// If file is a dir, size should be number of files in the directory
		if file.IsDir() {
			fileType = "dir"
			contentsDir, err := os.ReadDir(filepath.Join(path, file.Name()))
			if err == nil {
				fileSize = int64(len(contentsDir))
			}
		}

		contents = append(contents, map[string]interface{}{
				"name": file.Name(),
				"type": fileType,
				"size": fileSize,
		})
	}

	return map[string]interface{}{
		"name": filepath.Base(path),
		"type": "dir",
		"size": int64(len(contents)),
		"contents": contents,
	}
}

func CleanPath(path string) (string, error) {
	rootDir := "./files/"
	decodedPath, err := url.QueryUnescape(path)
	if err != nil {
		return "", err
	}
	cleanPath := filepath.Join(rootDir, filepath.Clean(decodedPath))

	// Make sure the path is within the root directory
	if !strings.HasPrefix(cleanPath, filepath.Clean(rootDir)) {
		return "", errors.New("Invalid path")
	}

	return cleanPath, nil
}

func GetDirContents(path string) ([]fs.FileInfo, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return nil, err
	}

	relPath := filepath.Join(cwd, path)
	dir, err := os.Open(relPath)
	if err != nil {
		return nil, errors.New("Directory not found")
	}
	defer dir.Close()

	files, err := dir.Readdir(-1)
	if err != nil {
		return nil, err
	}

	return files, nil
}
