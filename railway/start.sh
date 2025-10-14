#!/bin/bash
set -e

echo "Starting Traccar GPS Server on Railway..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Start Traccar
echo "Starting Traccar server..."
cd /opt/traccar
exec java -Xms512m -Xmx512m -Djava.net.preferIPv4Stack=true -jar tracker-server.jar conf/traccar.xml
