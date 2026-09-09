#!/usr/bin/env bash
set -e

# ==============================================================================
# Palnadu.dev - Unified Run & Build Script
# Usage:
#   ./run.sh        -> Starts DB, prepares schema/seed, and launches dev servers
#   ./run.sh dev    -> Same as ./run.sh
#   ./run.sh build  -> Generates DB client and builds all apps for production
#   ./run.sh test   -> Runs automated test suite
#   ./run.sh db     -> Starts DB and syncs schema/seeds only
#   ./run.sh stop   -> Stops running Docker containers
# ==============================================================================

BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

log_info() {
  echo -e "${BLUE}[palnadu.dev]${RESET} $1"
}

log_success() {
  echo -e "${GREEN}[palnadu.dev]${RESET} $1"
}

log_warn() {
  echo -e "${YELLOW}[palnadu.dev]${RESET} $1"
}

log_error() {
  echo -e "${RED}[palnadu.dev]${RESET} $1"
}

ensure_env_files() {
  log_info "Verifying environment configuration files..."

  if [ ! -f apps/api/.env ]; then
    if [ -f apps/api/.env.example ]; then
      cp apps/api/.env.example apps/api/.env
      log_success "Created apps/api/.env from .env.example"
    else
      cat << 'EOF' > apps/api/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/palnadu_dev?schema=public"
JWT_SECRET="palnadu-dev-jwt-super-secret-key-production-ready-2024"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
EOF
      log_success "Generated default apps/api/.env"
    fi
  fi

  if [ ! -f apps/web/.env.local ]; then
    echo 'NEXT_PUBLIC_API_URL="http://localhost:4000"' > apps/web/.env.local
    log_success "Generated default apps/web/.env.local"
  fi

  if [ ! -f apps/admin/.env.local ]; then
    echo 'NEXT_PUBLIC_API_URL="http://localhost:4000"' > apps/admin/.env.local
    log_success "Generated default apps/admin/.env.local"
  fi
}

start_docker() {
  log_info "Checking Docker daemon status..."

  if ! docker info >/dev/null 2>&1; then
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "/Applications/Docker.app" ]; then
      log_warn "Docker daemon is not running. Attempting to start Docker Desktop..."
      open -a Docker
      
      echo -n "Waiting for Docker daemon to become responsive"
      for i in {1..30}; do
        if docker info >/dev/null 2>&1; then
          echo ""
          log_success "Docker daemon is now running!"
          break
        fi
        echo -n "."
        sleep 2
      done

      if ! docker info >/dev/null 2>&1; then
        echo ""
        log_error "Docker took too long to start. Please ensure Docker Desktop is open and try again."
        exit 1
      fi
    else
      log_error "Docker is not running. Please start Docker Desktop and run this script again."
      exit 1
    fi
  fi

  log_info "Starting database containers..."
  docker compose up -d postgres
  # Try starting redis container if port 6379 is not already occupied by local service
  docker compose up -d redis 2>/dev/null || true

  log_info "Waiting for PostgreSQL database to be healthy..."
  for i in {1..20}; do
    if docker compose exec -T postgres pg_isready -U postgres -d palnadu_dev >/dev/null 2>&1; then
      log_success "Database is ready and accepting connections."
      return 0
    fi
    sleep 1
  done

  log_warn "Postgres healthcheck timed out, proceeding with startup..."
}

setup_database() {
  log_info "Generating Prisma Client..."
  pnpm db:generate

  log_info "Syncing database schema with PostgreSQL..."
  pnpm db:push

  log_info "Seeding initial admin account and default records..."
  pnpm db:seed || log_warn "Seed step skipped or already populated."
}

cmd_build() {
  ensure_env_files
  log_info "Running production build for all packages and apps..."
  log_info "Step 1: Generating Prisma Client..."
  pnpm db:generate
  log_info "Step 2: Building monorepo via Turborepo..."
  pnpm turbo build
  log_success "Build completed successfully!"
}

cmd_test() {
  ensure_env_files
  log_info "Running test suites..."
  pnpm turbo test
}

cmd_db() {
  ensure_env_files
  start_docker
  setup_database
  log_success "Database setup and seeding completed successfully!"
}

cmd_stop() {
  log_info "Stopping Docker containers..."
  docker compose down
  log_success "Containers stopped."
}

cmd_dev() {
  ensure_env_files
  start_docker
  setup_database

  echo ""
  echo -e "${GREEN}${BOLD}====================================================${RESET}"
  echo -e "${GREEN}${BOLD}   Palnadu.dev local environment ready to start!   ${RESET}"
  echo -e "${GREEN}${BOLD}====================================================${RESET}"
  echo -e "  ${BOLD}Web (Public site):${RESET}      http://localhost:3000"
  echo -e "  ${BOLD}Admin Dashboard:${RESET}        http://localhost:3001"
  echo -e "    ├ Email:              admin@palnadu.dev"
  echo -e "    └ Password:           admin@palnadu2024"
  echo -e "  ${BOLD}REST API:${RESET}               http://localhost:4000/api"
  echo -e "  ${BOLD}PostgreSQL:${RESET}             localhost:5432"
  echo -e "  ${BOLD}Redis:${RESET}                  localhost:6379"
  echo -e "${GREEN}${BOLD}====================================================${RESET}"
  echo ""

  log_info "Starting development servers via Turborepo..."
  rm -rf apps/web/.next apps/admin/.next
  pnpm turbo dev
}

ACTION="${1:-dev}"

case "$ACTION" in
  dev|start)
    cmd_dev
    ;;
  build)
    cmd_build
    ;;
  test)
    cmd_test
    ;;
  db)
    cmd_db
    ;;
  stop|down)
    cmd_stop
    ;;
  help|-h|--help)
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev (default)   Start Docker DB, apply migrations/seeds, and run all apps in dev mode"
    echo "  build           Generate Prisma client and build all packages & apps for production"
    echo "  test            Run validation and test suites across all workspaces"
    echo "  db              Start Docker and run Prisma schema push & database seeding"
    echo "  stop            Stop Docker containers (Postgres & Redis)"
    echo "  help            Display this help message"
    ;;
  *)
    log_error "Unknown command: $ACTION"
    echo "Run './run.sh help' for usage instructions."
    exit 1
    ;;
esac
