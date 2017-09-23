.PHONY: build clean run gactions-update gactions-test gen-mocks clean-mocks count-mocks

default: help

help: ## Show this help
	@echo "Harmony Home"
	@echo "======="
	@echo
	@echo "See README.md for full documentation."
	@echo
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -Ee 's/([a-z.]*):[^#]*##(.*)/\1##\2/' | sort | column -t -s "##"


clean: ## Remove build/test artifacts
	@touch .env .env.ci
	@docker-compose kill redis
	@docker-compose rm --force redis

clean-mocks:
	@find mocks/ -name "sample-*" -exec rm {} \;

count-mocks:
	@find mocks/ -name "sample-*" | wc -l

build: clean ## Build the docker image
	@docker-compose build web

run: clean build 
	@docker-compose up web

test: clean build
	@docker-compose run --rm web npm test

gen-mocks: clean-mocks 
	@docker-compose run --rm mock ./scripts/gactions-update.sh 
	@docker-compose run --rm mock ./scripts/gactions-test.sh
	@export CAPTURE=true; \
	export DEPLOY_DOMAIN=http://www.example.com; \
	docker-compose run --rm mock ./scripts/gen-mocks.sh

gactions-update: clean build
	export PACKAGE_GENERATOR=action.js; \
	docker-compose run --rm web ./scripts/gactions-update.sh

gactions-test: clean build
	export PACKAGE_GENERATOR=action.js; \
	docker-compose run --rm web ./scripts/gactions-test.sh

smarthome-update: clean build
	export PACKAGE_GENERATOR=action_ha.js; \
	docker-compose run --rm web ./scripts/gactions-update.sh

smarthome-test: clean build
	export PACKAGE_GENERATOR=action_ha.js; \
	docker-compose run --rm web ./scripts/gactions-test.sh
