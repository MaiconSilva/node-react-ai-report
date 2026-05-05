#!/bin/bash
set -e

echo "Starting SQL Server..."

# Start SQL Server in the background
/opt/mssql/bin/sqlservr &

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to be ready..."
sleep 30

# Keep checking if SQL Server is ready (using the new sqlcmd path)
for i in {1..30}; do
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SQL Server is ready!"
        break
    fi
    echo "SQL Server is not ready yet... waiting"
    sleep 2
done

# Run initialization scripts
echo "Running initialization scripts..."
for f in /docker-entrypoint-initdb.d/*.sql; do
    if [ -f "$f" ]; then
        echo "Executing $f..."
        /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i "$f"
    fi
done

echo "Initialization complete!"

# Bring SQL Server to foreground
wait
