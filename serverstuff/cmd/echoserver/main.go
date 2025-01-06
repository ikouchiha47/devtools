package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime/debug"
)

func main() {
	log.SetFlags(log.Lshortfile)

	appPort := os.Getenv("APP_PORT")
	if appPort == "" {
		appPort = "8081"
	}

	httpSrv := &http.Server{
		Addr: fmt.Sprintf(":%s", appPort),
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(500)
			fmt.Fprintln(w, "Hello! The server is running.")
		}),
	}

	defer func() {
		if e := recover(); e != nil {
			log.Printf("%s: %s", e, debug.Stack()) // line 20
		}
	}()

	http.HandleFunc("/failure", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		w.Write([]byte(`{"success": "failure overflow"}`))
	})

	// httpSrv.Handle("/success", func(w http.ResponseWriter, r *http.Request) {
	// 	b, err := httputil.DumpRequest(r, true)
	// 	if err != nil {
	// 		w.WriteHeader(420)
	// 		w.Write([]byte(`{"error": "such a failure"}`))
	// 	}
	//
	// 	log.Println(string(b))
	//
	// 	w.WriteHeader(404)
	// 	w.Write([]byte(`{"success": "not found! lol"}`))
	// })

	startServer := func() {
		go func() {
			fmt.Println("Starting the server...")
			if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				fmt.Printf("Error: %v\n", err)
			}
		}()
	}

	go func() {

		startServer()

		// ticker := time.NewTicker(15 * time.Second)
		// for {
		// 	select {
		// 	case <-ticker.C:
		// 		wakey := make(chan struct{})
		//
		// 		go func() {
		// 			defer close(wakey)
		// 			log.Println("shutting down server")
		// 			httpSrv.Shutdown(context.Background())
		// 		}()
		//
		// 		<-wakey
		//
		// 		log.Println("idling for 6 seconds")
		// 		time.Sleep(6 * time.Second)
		//
		// 		startServer()
		// 	}
		// }
	}()

	select {}
}
