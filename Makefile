.PHONY: install, build, lint, clean, test

install: SHELL:=/bin/bash
install:
	@cd web && yarn install

build: SHELL:=/bin/bash
build: install
build:
	@echo "Building..."
	@cd web && yarn run build
	@go build

lint: SHELL:=/bin/bash
lint: install
lint:
	@gofmt -s -w .
	@golangci-lint run
	@cd web && yarn run eslint "**/*.{ts,tsx}" --fix
	@cd web && yarn run prettier "**/*.{ts,tsx}" --write

test: SHELL:=/bin/bash
test: build
test:
	@go test -v ./...
	@cd web && yarn run test

clean: SHELL:=/bin/bash
clean:
	@rm -rf ./web/build
	@rm -rf ./web/playwright-report
	@rm ./fs4
