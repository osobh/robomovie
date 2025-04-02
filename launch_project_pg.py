#!/usr/bin/env python3

import subprocess
import socket
import sys
import re
from pathlib import Path
import getpass # To securely get password if needed

# --- Configuration ---
BASE_HOST_PORT = 5433  # Starting port number to check for availability
BASE_DATA_DIR = Path("./postgres_data") # Base directory to store all project data folders
DEFAULT_DB_PASSWORD = "changeme" # Default password if not prompting
# Set to True to securely prompt for password, False to use DEFAULT_DB_PASSWORD
PROMPT_FOR_PASSWORD = False
POSTGRES_IMAGE = "postgres:16" # Use a specific version for stability (e.g., postgres:16, postgres:15) or "postgres:latest"

# --- Helper Functions ---

def is_docker_running():
    """Checks if the Docker daemon is responsive."""
    try:
        # Use 'docker info' as a lightweight command to check daemon status
        subprocess.run(
            ["docker", "info"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5 # Add a timeout
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
        print(f"Error checking Docker status: {e}", file=sys.stderr)
        print("Please ensure Docker Desktop or Docker Engine is installed and running.", file=sys.stderr)
        return False

def sanitize_name(name):
    """
    Sanitizes the project name to be suitable for directory and Docker container names.
    - Lowercase
    - Allows alphanumeric and hyphens
    - Replaces spaces and underscores with hyphens
    - Removes other invalid characters
    - Ensures it starts and ends with an alphanumeric character
    """
    # Replace spaces/underscores with hyphens
    name = re.sub(r'[\s_]+', '-', name)
    # Keep only lowercase alphanumeric and hyphens
    name = re.sub(r'[^a-z0-9-]+', '', name.lower())
    # Remove leading/trailing hyphens
    name = name.strip('-')
    # Ensure name is not empty after sanitization
    if not name:
        raise ValueError("Sanitized project name cannot be empty.")
    # Ensure it doesn't start with a hyphen (should be covered by strip, but double-check)
    if name.startswith('-'):
         raise ValueError("Sanitized project name cannot start with a hyphen.") # Should not happen with strip
    return name

def find_available_port(start_port):
    """Finds an available TCP port on localhost, starting from start_port."""
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                # Try binding to the port on localhost
                s.bind(("127.0.0.1", port))
                # If bind succeeds, the port is available
                return port
            except OSError:
                # Port is likely in use, try the next one
                print(f"Port {port} is in use, trying next...")
                port += 1
            except Exception as e:
                print(f"Unexpected error checking port {port}: {e}", file=sys.stderr)
                # Handle potential unexpected errors, maybe stop searching after too many attempts
                if port > start_port + 100: # Limit search range
                    raise RuntimeError("Could not find an available port after 100 attempts.") from e
                port += 1


def check_container_exists(container_name):
    """Checks if a Docker container with the given name already exists."""
    try:
        # List containers (running and stopped) filtering by exact name
        # The ^/name$ pattern ensures exact match in docker filters
        result = subprocess.run(
            ["docker", "ps", "-a", "--filter", f"name=^/{container_name}$", "--format", "{{.Names}}"],
            check=True,
            capture_output=True,
            text=True,
        )
        return container_name in result.stdout.strip().splitlines()
    except subprocess.CalledProcessError as e:
        print(f"Error checking for existing container '{container_name}': {e}", file=sys.stderr)
        # Decide how to handle docker command errors - here we assume it doesn't exist
        return False
    except FileNotFoundError:
        # Docker command not found (should have been caught by is_docker_running)
        print("Error: 'docker' command not found.", file=sys.stderr)
        return False # Treat as not existing, though the script should have exited earlier

# --- Main Logic ---

def main():
    print("--- PostgreSQL Project Launcher (Docker) ---")

    if not is_docker_running():
        sys.exit(1) # Exit if Docker isn't running

    # 1. Get and sanitize Project Name
    while True:
        try:
            project_name_raw = input("Enter the project name: ").strip()
            if not project_name_raw:
                print("Project name cannot be empty.")
                continue
            project_name = sanitize_name(project_name_raw)
            print(f"Using sanitized project name: {project_name}")
            break
        except ValueError as e:
            print(f"Invalid project name: {e}. Please use alphanumeric characters, spaces, or hyphens.")
        except EOFError:
            print("\nOperation cancelled.")
            sys.exit(0)


    # 2. Define Container Name and Data Directory Path
    container_name = f"{project_name}-postgres"
    project_data_dir = BASE_DATA_DIR / project_name
    absolute_data_path = project_data_dir.resolve() # Docker needs absolute path for volume mount

    # 3. Check if container already exists
    if check_container_exists(container_name):
        print(f"\nError: A Docker container named '{container_name}' already exists.", file=sys.stderr)
        print("You might want to stop/remove it first ('docker stop/rm {}')".format(container_name))
        print("Or, if the container is stopped, start it ('docker start {}')".format(container_name))
        sys.exit(1)

    # 4. Create Data Directory if it doesn't exist
    try:
        print(f"Ensuring data directory exists: {absolute_data_path}")
        project_data_dir.mkdir(parents=True, exist_ok=True)
        # Consider setting permissions if needed, though Docker often handles this
        # os.chmod(absolute_data_path, 0o700) # Example: Restrict permissions
    except OSError as e:
        print(f"Error creating directory {absolute_data_path}: {e}", file=sys.stderr)
        sys.exit(1)

    # 5. Find Available Host Port
    try:
        host_port = find_available_port(BASE_HOST_PORT)
        print(f"Found available host port: {host_port}")
    except (RuntimeError, OSError) as e:
        print(f"Error finding available port: {e}", file=sys.stderr)
        sys.exit(1)

    # 6. Get Database Password
    db_password = DEFAULT_DB_PASSWORD
    if PROMPT_FOR_PASSWORD:
        try:
            db_password = getpass.getpass(f"Enter password for postgres user [default: {DEFAULT_DB_PASSWORD}]: ")
            if not db_password:
                db_password = DEFAULT_DB_PASSWORD
                print(f"Using default password.")
        except EOFError:
            print("\nOperation cancelled.")
            sys.exit(0)
    else:
        print(f"Using default password defined in script. CHANGE THIS IN PRODUCTION!")


    # 7. Construct and Run Docker Command
    docker_command = [
        "docker", "run",
        "--name", container_name,          # Assign a specific name
        "-e", f"POSTGRES_PASSWORD={db_password}", # Set the postgres user password
        # You can also set POSTGRES_USER and POSTGRES_DB here if needed
        # "-e", "POSTGRES_USER=myuser",
        # "-e", "POSTGRES_DB=mydatabase",
        "-p", f"{host_port}:5432",         # Map host port to container port 5432
        "-v", f"{absolute_data_path}:/var/lib/postgresql/data", # Mount local data dir
        "-d",                              # Run in detached mode (background)
        POSTGRES_IMAGE                     # Specify the image and version
    ]

    print("\nAttempting to start PostgreSQL container...")
    print(f"Command: {' '.join(docker_command)}") # Show the command being run

    try:
        result = subprocess.run(docker_command, check=True, capture_output=True, text=True)
        container_id = result.stdout.strip()
        print(f"\nSuccess! PostgreSQL container started.")
        print(f"  Container Name: {container_name}")
        print(f"  Container ID:   {container_id[:12]}...") # Show short ID
        print(f"  Data Volume:    {absolute_data_path} -> /var/lib/postgresql/data")
        print("\n--- Connection Details ---")
        print(f"  Host:     localhost (or 127.0.0.1)")
        print(f"  Port:     {host_port}")
        print(f"  User:     postgres") # Default user unless changed with -e POSTGRES_USER
        print(f"  Password: {'*' * len(db_password) if db_password else '(none)'} ({'Prompted' if PROMPT_FOR_PASSWORD else 'Default/Specified'})")
        print(f"  Database: postgres") # Default database unless changed with -e POSTGRES_DB
        print("\nUse a tool like psql, DBeaver, pgAdmin, or your application to connect.")
        print(f"Example psql command:")
        print(f"  psql -h localhost -p {host_port} -U postgres -W")
        print("\nTo stop the container: docker stop {}".format(container_name))
        print("To remove the container (data remains in local folder): docker rm {}".format(container_name))
        print("To view logs: docker logs {}".format(container_name))

    except FileNotFoundError:
         # Should have been caught by is_docker_running, but belt-and-suspenders
        print("Error: 'docker' command not found. Is Docker installed and in your PATH?", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"\nError starting Docker container '{container_name}':", file=sys.stderr)
        print(f"Return Code: {e.returncode}", file=sys.stderr)
        print(f"Command: {' '.join(e.cmd)}", file=sys.stderr)
        print(f"Stderr: {e.stderr.strip()}", file=sys.stderr)
        print(f"Stdout: {e.stdout.strip()}", file=sys.stderr)
        print("\nPlease check the Docker error message above.", file=sys.stderr)
        print("Possible issues: Port conflict (rare if check worked), volume mount issues, image pull failure, insufficient resources.", file=sys.stderr)
        # Attempt to clean up created directory if container failed to start? Maybe not, user might want to debug.
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)