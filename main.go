package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
)

var chatAPI = "https://chat.joelsiervas.online/"

func getMessages(w http.ResponseWriter, r *http.Request) {
	resp, _ := http.Get(chatAPI + "messages")
	io.Copy(w, resp.Body)
}

func postMessage(w http.ResponseWriter, r *http.Request) {
	resp, _ := http.Post(chatAPI+"messages", "application/json", r.Body)
	defer resp.Body.Close()
	io.Copy(w, resp.Body)
}

type PreviewData struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Image       string `json:"image"`
	URL         string `json:"url"`
}

func extractMeta(html, property string) string {
	patterns := []string{
		`(?i)<meta[^>]+property=["']` + regexp.QuoteMeta(property) + `["'][^>]+content=["']([^"']+)["']`,
		`(?i)<meta[^>]+content=["']([^"']+)["'][^>]+property=["']` + regexp.QuoteMeta(property) + `["']`,
		`(?i)<meta[^>]+name=["']` + regexp.QuoteMeta(property) + `["'][^>]+content=["']([^"']+)["']`,
		`(?i)<meta[^>]+content=["']([^"']+)["'][^>]+name=["']` + regexp.QuoteMeta(property) + `["']`,
	}
	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		match := re.FindStringSubmatch(html)
		if len(match) > 1 {
			return match[1]
		}
	}
	return ""
}

func extractTitle(html string) string {
	re := regexp.MustCompile(`(?i)<title[^>]*>([^<]+)</title>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func getLinkPreview(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	url := r.URL.Query().Get("url")
	if url == "" {
		http.Error(w, `{"error":"missing url"}`, http.StatusBadRequest)
		return
	}

	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, `{"error":"invalid url"}`, http.StatusBadRequest)
		return
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; ChatBot/1.0)")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, `{"error":"fetch failed"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 512*1024))
	body := string(bodyBytes)

	preview := PreviewData{URL: url}
	preview.Title = extractMeta(body, "og:title")
	if preview.Title == "" {
		preview.Title = extractTitle(body)
	}
	preview.Description = extractMeta(body, "og:description")
	if preview.Description == "" {
		preview.Description = extractMeta(body, "description")
	}
	preview.Image = extractMeta(body, "og:image")

	json.NewEncoder(w).Encode(preview)
}

func main() {
	http.Handle("GET /", http.FileServer(http.Dir("./static")))
	http.HandleFunc("GET /api/messages", getMessages)
	http.HandleFunc("POST /api/messages", postMessage)
	http.HandleFunc("GET /api/preview", getLinkPreview)
	fmt.Println("Servidor iniciado en http://localhost:8000")
	http.ListenAndServe("0.0.0.0:8000", nil)
}
