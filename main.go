package main

import (
	"fmt"
	"io"
	"net/http"
)

var chatAPi = "https://framework.dennisaldana.com/"

func getMessages(w http.ResponseWriter, r *http.Request) {
	resp, _ := http.Get(chatAPi + "messages")

	io.Copy(w, resp.Body)
}

func postMessage(w http.ResponseWriter, r *http.Request) {
	resp, _ := http.Post(chatAPi+"messages", "application/json", r.Body)
	defer resp.Body.Close()

	io.Copy(w, resp.Body)
}

func main() {
	http.Handle("GET /", http.FileServer(http.Dir("./static")))
	http.HandleFunc("GET /api/messages", getMessages)
	http.HandleFunc("POST /api/messages", postMessage)

	fmt.Println("Servidor iniciado en http://localhost:8000")
	http.ListenAndServe("0.0.0.0:8000", nil)
}
