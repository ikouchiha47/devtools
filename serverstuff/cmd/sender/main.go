package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"textshare/utils"

	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/ext"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
)

func main() {
	targetPort := utils.Must(strconv.Atoi(os.Getenv("TARGET_PORT")))
	appPort := os.Getenv("APP_PORT")

	tracer.Start(
		tracer.WithServiceName("server1"),
		tracer.WithAnalytics(true),
	)
	defer tracer.Stop()

	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		span, ctx := tracer.StartSpanFromContext(context.Background(), "http.request",
			tracer.SpanType(ext.SpanTypeWeb),
		)
		defer span.Finish()

		client := &http.Client{}
		req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("http://localhost:%d/ping", targetPort), nil)
		if err != nil {
			log.Printf("Error creating request: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		// Inject span context into the request headers
		tracer.Inject(span.Context(), tracer.HTTPHeadersCarrier(req.Header))

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error making request to server2: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		w.WriteHeader(resp.StatusCode)
	})

	log.Println("Server is running on port", appPort)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", appPort), nil))
}
