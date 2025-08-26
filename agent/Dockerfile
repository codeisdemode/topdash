FROM golang:1.21-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod and sum files
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy source code
COPY *.go ./

# Build the application
RUN go build -o server-monitoring-agent .

# Run the application
CMD ["./server-monitoring-agent"]