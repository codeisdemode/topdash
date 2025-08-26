package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/disk"
	"github.com/shirou/gopsutil/mem"
	"github.com/shirou/gopsutil/net"
)

type Config struct {
	ServerID    string `json:"server_id"`
	APIToken    string `json:"api_token"`
	APIURL      string `json:"api_url"`
	Interval    int    `json:"interval"`
	SiteURL     string `json:"site_url"`
	ServerName  string `json:"server_name"`
}

type Metrics struct {
	ServerID     string  `json:"server_id"`
	CPUUsage     float64 `json:"cpu_usage"`
	MemoryUsage  float64 `json:"memory_usage"`
	DiskUsage    float64 `json:"disk_usage"`
	NetworkIn    float64 `json:"network_in"`
	NetworkOut   float64 `json:"network_out"`
	OSVersion    string  `json:"os_version"`
	SiteStatus   int     `json:"site_status"`
}

func main() {
	// Load configuration
	config, err := loadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Starting server monitoring agent for server: %s", config.ServerName)
	log.Printf("API URL: %s", config.APIURL)
	log.Printf("Interval: %d seconds", config.Interval)

	// Start monitoring loop
	ticker := time.NewTicker(time.Duration(config.Interval) * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		metrics, err := collectMetrics(config)
		if err != nil {
			log.Printf("Error collecting metrics: %v", err)
			continue
		}

		err = sendMetrics(config, metrics)
		if err != nil {
			log.Printf("Error sending metrics: %v", err)
		} else {
			log.Printf("Metrics sent successfully: CPU=%.1f%%, Memory=%.1f%%, Disk=%.1f%%", 
				metrics.CPUUsage, metrics.MemoryUsage, metrics.DiskUsage)
		}
	}
}

func loadConfig() (*Config, error) {
	config := &Config{
		ServerID:   os.Getenv("SERVER_ID"),
		APIToken:   os.Getenv("API_TOKEN"),
		APIURL:     getEnv("API_URL", "http://localhost:3001"),
		Interval:   getEnvInt("INTERVAL", 60),
		SiteURL:    os.Getenv("SITE_URL"),
		ServerName: getEnv("SERVER_NAME", "Unknown Server"),
	}

	if config.ServerID == "" || config.APIToken == "" {
		return nil, fmt.Errorf("SERVER_ID and API_TOKEN environment variables are required")
	}

	return config, nil
}

func collectMetrics(config *Config) (*Metrics, error) {
	// Get CPU usage
	cpuPercent, err := cpu.Percent(time.Second, false)
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU usage: %v", err)
	}

	// Get memory usage
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("failed to get memory usage: %v", err)
	}

	// Get disk usage
	diskInfo, err := disk.Usage("/")
	if err != nil {
		return nil, fmt.Errorf("failed to get disk usage: %v", err)
	}

	// Get network stats
	netStats, err := getNetworkStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get network stats: %v", err)
	}

	// Get site status
	siteStatus, err := checkSiteStatus(config.SiteURL)
	if err != nil {
		log.Printf("Site check failed: %v", err)
	}

	// Get OS version
	osVersion := getOSVersion()

	return &Metrics{
		ServerID:    config.ServerID,
		CPUUsage:    cpuPercent[0],
		MemoryUsage: memInfo.UsedPercent,
		DiskUsage:   diskInfo.UsedPercent,
		NetworkIn:   float64(netStats.BytesRecv),
		NetworkOut:  float64(netStats.BytesSent),
		OSVersion:   osVersion,
		SiteStatus:  siteStatus,
	}, nil
}

func getNetworkStats() (*net.IOCountersStat, error) {
	// Get network statistics
	netStats, err := net.IOCounters(false)
	if err != nil {
		return nil, err
	}
	
	if len(netStats) == 0 {
		return &net.IOCountersStat{}, nil
	}
	
	return &netStats[0], nil
}

func checkSiteStatus(url string) (int, error) {
	if url == "" {
		return 0, nil
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	return resp.StatusCode, nil
}

func getOSVersion() string {
	// Simple OS version detection
	// In production, you might want to read /etc/os-release
	return "Linux" // Simplified for demo
}

func sendMetrics(config *Config, metrics *Metrics) error {
	jsonData, err := json.Marshal(metrics)
	if err != nil {
		return fmt.Errorf("failed to marshal metrics: %v", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("POST", config.APIURL+"/api/v1/metrics", 
		strings.NewReader(string(jsonData)))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Token", config.APIToken)

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

// Helper functions for environment variables
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}