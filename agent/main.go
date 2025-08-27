package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
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

const (
	Version = "1.1.0"
)

type Config struct {
	ServerID    string `json:"server_id"`
	APIToken    string `json:"api_token"`
	APIURL      string `json:"api_url"`
	Interval    int    `json:"interval"`
	SiteURL     string `json:"site_url"`
	ServerName  string `json:"server_name"`
	AgentVersion string `json:"agent_version"`
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

	// Check for updates on startup
	checkForUpdates(config)

	updateTicker := time.NewTicker(30 * time.Minute) // Check for updates every 30 minutes
	defer updateTicker.Stop()

	for {
		select {
		case <-ticker.C:
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

		case <-updateTicker.C:
			checkForUpdates(config)
		}
	}
}

func loadConfig() (*Config, error) {
	config := &Config{
		ServerID:     os.Getenv("SERVER_ID"),
		APIToken:     os.Getenv("API_TOKEN"),
		APIURL:       getEnv("API_URL", "http://localhost:3001"),
		Interval:     getEnvInt("INTERVAL", 60),
		SiteURL:      os.Getenv("SITE_URL"),
		ServerName:   getEnv("SERVER_NAME", "Unknown Server"),
		AgentVersion: Version,
	}

	if config.ServerID == "" || config.APIToken == "" {
		return nil, fmt.Errorf("SERVER_ID and API_TOKEN environment variables are required")
	}

	return config, nil
}

func collectMetrics(config *Config) (*Metrics, error) {
	// Get CPU usage - use 3-second average for more stable readings
	cpuPercent, err := cpu.Percent(3*time.Second, false)
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU usage: %v", err)
	}
	
	// If we get an unusually high reading (spike), take another measurement
	if len(cpuPercent) > 0 && cpuPercent[0] > 80.0 {
		time.Sleep(1 * time.Second)
		cpuPercent2, err := cpu.Percent(2*time.Second, false)
		if err == nil && len(cpuPercent2) > 0 {
			// Use the average of both measurements to smooth out spikes
			cpuPercent[0] = (cpuPercent[0] + cpuPercent2[0]) / 2
		}
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

func checkForUpdates(config *Config) {
	log.Printf("Checking for agent updates...")
	
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", config.APIURL+"/api/v1/agent/update-check", nil)
	if err != nil {
		log.Printf("Update check request error: %v", err)
		return
	}

	req.Header.Set("X-Agent-Token", config.APIToken)
	req.Header.Set("X-Server-ID", config.ServerID)
	req.Header.Set("X-Agent-Version", Version)

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Update check failed: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var updateInfo struct {
			UpdateAvailable bool   `json:"update_available"`
			LatestVersion   string `json:"latest_version"`
			DownloadURL     string `json:"download_url"`
			Checksum        string `json:"checksum"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&updateInfo); err != nil {
			log.Printf("Failed to decode update info: %v", err)
			return
		}

		if updateInfo.UpdateAvailable {
			log.Printf("Update available: %s -> %s", Version, updateInfo.LatestVersion)
			if err := performUpdate(updateInfo.DownloadURL, updateInfo.Checksum); err != nil {
				log.Printf("Update failed: %v", err)
			} else {
				log.Printf("Update completed successfully!")
				os.Exit(0) // Exit to allow service manager to restart
			}
		} else {
			log.Printf("Agent is up to date (v%s)", Version)
		}
	} else {
		log.Printf("Update check failed with status: %d", resp.StatusCode)
	}
}

func performUpdate(downloadURL, expectedChecksum string) error {
	log.Printf("Downloading update from: %s", downloadURL)
	
	// Download the new binary
	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("download failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download failed with status: %d", resp.StatusCode)
	}

	// Read the update data
	updateData, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read update data: %v", err)
	}

	// Verify checksum if provided
	if expectedChecksum != "" {
		hasher := sha256.New()
		hasher.Write(updateData)
		actualChecksum := fmt.Sprintf("%x", hasher.Sum(nil))
		
		if actualChecksum != expectedChecksum {
			return fmt.Errorf("checksum mismatch: expected %s, got %s", expectedChecksum, actualChecksum)
		}
	}

	// Get current executable path
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %v", err)
	}

	// Create backup of current binary
	backupPath := exePath + ".bak"
	if err := copyFile(exePath, backupPath); err != nil {
		return fmt.Errorf("failed to create backup: %v", err)
	}

	// Write new binary
	if err := os.WriteFile(exePath, updateData, 0755); err != nil {
		// Restore from backup if update fails
		if restoreErr := copyFile(backupPath, exePath); restoreErr != nil {
			log.Printf("CRITICAL: Failed to restore from backup: %v", restoreErr)
		}
		return fmt.Errorf("failed to write new binary: %v", err)
	}

	// Clean up backup
	os.Remove(backupPath)
	
	return nil
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0755)
}