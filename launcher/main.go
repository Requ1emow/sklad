package main

import (
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
)

func runDetached(command string) error {
    cmd := exec.Command("cmd", "/C", "start", "", "cmd", "/K", command)
    return cmd.Run()
}

func main() {
    exePath, err := os.Executable()
    if err != nil {
        fmt.Println("Failed to resolve executable path:", err)
        os.Exit(1)
    }

    root := filepath.Dir(exePath)
    backendPath := filepath.Join(root, "backend")
    frontendPath := filepath.Join(root, "frontend")

    fmt.Println("Starting Auto Glass ERP...")

    dockerCmd := fmt.Sprintf("cd /d \"%s\" && docker compose up -d postgres", root)
    if err := runDetached(dockerCmd); err != nil {
        fmt.Println("Could not start PostgreSQL container:", err)
    }

    backendCmd := fmt.Sprintf("cd /d \"%s\" && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run db:init && npm run dev", backendPath)
    if err := runDetached(backendCmd); err != nil {
        fmt.Println("Could not start backend:", err)
        os.Exit(1)
    }

    frontendCmd := fmt.Sprintf("cd /d \"%s\" && if not exist node_modules npm install && npm run dev", frontendPath)
    if err := runDetached(frontendCmd); err != nil {
        fmt.Println("Could not start frontend:", err)
        os.Exit(1)
    }

    _ = exec.Command("cmd", "/C", "start", "", "http://localhost:5173").Run()
    fmt.Println("ERP launch commands were started in separate terminal windows.")
}
