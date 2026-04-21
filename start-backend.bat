@echo off
echo Fixing environment variables for non-Docker local run...

powershell -Command "(Get-Content auth-service\.env).replace('mongodb://mongo:27017', 'mongodb://127.0.0.1:27017').replace('host.docker.internal', 'localhost') | Set-Content auth-service\.env"
powershell -Command "(Get-Content product-service\.env).replace('mongodb://mongo:27017', 'mongodb://127.0.0.1:27017').replace('host.docker.internal', 'localhost') | Set-Content product-service\.env"
powershell -Command "(Get-Content order-service\.env).replace('mongodb://mongo:27017', 'mongodb://127.0.0.1:27017').replace('host.docker.internal', 'localhost') | Set-Content order-service\.env"
powershell -Command "(Get-Content payment-service\.env).replace('mongodb://mongo:27017', 'mongodb://127.0.0.1:27017').replace('host.docker.internal', 'localhost') | Set-Content payment-service\.env"

echo Starting Auth Service...
start cmd /k "cd auth-service && npm install && npm run dev"

echo Starting Product Service...
start cmd /k "cd product-service && npm install && npm run dev"

echo Starting Order Service...
start cmd /k "cd order-service && npm install && npm run dev"

echo Starting Payment Service...
start cmd /k "cd payment-service && npm install && npm run dev"

echo Starting API Gateway...
start cmd /k "cd api-gateway && npm install && node server.js 2>nul || echo Gateway started manually if there's no server.js"

echo All backend services have been launched!
