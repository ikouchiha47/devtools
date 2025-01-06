package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
)

const (
	PORT = ":8080" // Default port for the servers to communicate
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go [server|client]")
		os.Exit(1)
	}

	role := os.Args[1]

	if role == "server" {
		startServer()
	} else if role == "client" {
		startClient()
	} else {
		fmt.Println("Invalid role. Use 'server' or 'client'")
		os.Exit(1)
	}
}

func startServer() {
	listener, err := net.Listen("tcp", PORT)
	if err != nil {
		fmt.Printf("Error starting server: %v\n", err)
		os.Exit(1)
	}
	defer listener.Close()

	fmt.Printf("Server listening on port %s\n", PORT)

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Printf("Error accepting connection: %v\n", err)
			continue
		}

		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	defer conn.Close()

	fmt.Printf("New connection from %s\n", conn.RemoteAddr().String())

	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		message := scanner.Text()
		fmt.Printf("Received: %s\n", message)

		if strings.HasPrefix(message, "/broadcast ") {
			response := strings.TrimPrefix(message, "/broadcast ")
			fmt.Printf("Broadcasting message: %s\n", response)
			// Extend broadcasting functionality here
		} else if strings.HasPrefix(message, "/send ") {
			fmt.Println("Send command received.")
			// Handle send command logic here
		} else if strings.HasPrefix(message, "/grant file ") {
			fmt.Println("Grant file command received.")
			// Handle granting file logic here
		} else if strings.HasPrefix(message, "/grant dir ") {
			fmt.Println("Grant directory command received.")
			// Handle granting directory logic here
		} else {
			fmt.Fprintf(conn, "Unknown command\n")
		}
	}

	if err := scanner.Err(); err != nil {
		fmt.Printf("Error reading from connection: %v\n", err)
	}
}

func startClient() {
	conn, err := net.Dial("tcp", "127.0.0.1"+PORT)
	if err != nil {
		fmt.Printf("Error connecting to server: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	fmt.Println("Connected to server. Type commands to interact.")

	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Print("> ")
		input, err := reader.ReadString('\n')
		if err != nil {
			fmt.Printf("Error reading input: %v\n", err)
			continue
		}

		input = strings.TrimSpace(input)
		if input == "exit" {
			fmt.Println("Exiting.")
			break
		}

		fmt.Fprintln(conn, input)
	}
}
