DB_URL ?= postgres://app:app@localhost:5432/video_library_db?sslmode=disable

.PHONY: install dev build migrate migrate-down seed typecheck

install:
	npm install

dev:
	npm run dev

build:
	npm run build

migrate:
	migrate -path db/migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path db/migrations -database "$(DB_URL)" down

seed:
	DATABASE_URL=$(DB_URL) npm run seed

typecheck:
	npm run typecheck
