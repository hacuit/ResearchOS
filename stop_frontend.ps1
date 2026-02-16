Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Output "stopped_node_processes"
