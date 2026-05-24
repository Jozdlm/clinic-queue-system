package websockets

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jozdlm/hospital-system/internal/network"
)

func HandleWebSocket(hub *Hub, ctx *gin.Context) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		network.Error(ctx, http.StatusInternalServerError, "Could not upgrade to WebSocket")
		return
	}

	client := NewClient(hub, conn)
	hub.Register <- client

	go client.ReadPump()
	go client.WritePump()
}
