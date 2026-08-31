// Package config loads runtime configuration from environment variables.
package config

import (
	"os"
	"strings"
)

// Config holds all environment-driven settings for the API.
type Config struct {
	Port           string
	AllowedOrigins []string
}

// Load reads configuration from the environment, applying sane local-dev
// defaults when variables are unset.
func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		origins = "http://localhost:3000"
	}

	return Config{
		Port:           port,
		AllowedOrigins: strings.Split(origins, ","),
	}
}
