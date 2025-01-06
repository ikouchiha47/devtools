// Server 2: Extracting Datadog Span
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime/debug"

	// ddtrace "gopkg.in/DataDog/dd-trace-go.v1/ddtrace"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/ext"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
)

func main() {
	appPort := os.Getenv("APP_PORT")
	if appPort == "" {
		appPort = "8081"
	}

	tracer.Start(
		tracer.WithServiceName("server2"),
		tracer.WithAnalytics(true),
	)
	defer tracer.Stop()

	defer func() {
		if e := recover(); e != nil {
			log.Printf("%s: %s", e, debug.Stack()) // line 20
		}
	}()

	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		// Extract the span context from the incoming request
		ctx, err := tracer.Extract(tracer.HTTPHeadersCarrier(r.Header))
		if err != nil {
			log.Printf("Error extracting span context: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		fmt.Println(r.Header)

		span := tracer.StartSpan("http.response",
			tracer.SpanType(ext.SpanTypeWeb),
			tracer.ChildOf(ctx),
		)
		defer span.Finish()

		log.Println("Received request with propagated trace")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Span context received and traced successfully"))
	})

	log.Println("Receiver is running on port", appPort)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", appPort), nil))
}
