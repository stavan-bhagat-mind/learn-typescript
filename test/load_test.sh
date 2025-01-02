#!/bin/bash

# Define the number of requests and concurrency level
NUM_REQUESTS=1000
CONCURRENCY=50

# Define the base URL
BASE_URL="http://localhost:3000"

# Define the endpoints to test
ENDPOINTS=(
  "/api/simple"
  "/api/compute/100000000000"
  "/api/users"
)

# Function to run ab for a given endpoint
run_ab() {
  local endpoint=$1
  ab -n $NUM_REQUESTS -c $CONCURRENCY $BASE_URL$endpoint
}

# Run ab for each endpoint concurrently
for endpoint in "${ENDPOINTS[@]}"; do
  run_ab $endpoint &
done

# Wait for all background jobs to finish
wait

echo "Load test completed."


# cmd-- # Make the script executable (only needs to be done once)
# brew install httpd
# chmod +x /Users/mind/Documents/demo/learnTypeScript/typescript/test/load_test.sh

# Run the script
# /Users/mind/Documents/demo/learnTypeScript/typescript/test/load_test.sh