Set-Location "$PSScriptRoot\backend"
python -m scripts.reset_db
python -m scripts.dev_bootstrap
python -m scripts.smoke_test
