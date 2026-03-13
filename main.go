package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Message struct {
	ID   int    `json:"id"`
	User string `json:"user"`
	Text string `json:"text"`
}

var messages = []Message{}

func getMessages(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(messages)
}

func postMessage(w http.ResponseWriter, r *http.Request) {
	var msg Message
	json.NewDecoder(r.Body).Decode(&msg)

	messages = append(messages, msg)
	json.NewEncoder(w).Encode(messages)
}

func main() {
	http.HandleFunc("GET /messages", getMessages)
	http.HandleFunc("POST /messages", postMessage)

	fmt.Println("Chat API listening on 0.0.0:3000")
	http.ListenAndServe(":3000", nil)
}
