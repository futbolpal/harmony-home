.PHONY: build clean run gactions-update gactions-test

default: help

####################################################
# Shared functions used by the targets that follow #
####################################################

# Check that given variables are set and all have non-empty values,
# die with an error otherwise.
#
# Params:
#   1. Variable name(s) to test.
#   2. (optional) Error message to print.
check_defined = \
	$(strip $(foreach 1,$1, \
		$(call __check_defined,$1,$(strip $(value 2)))))
__check_defined = \
	$(if $(value $1),, \
		$(error Undefined variable $1$(if $2, ($2))))


ensure-variables:
	@:$(call check_defined, PROJECT_ID, Google actions project id)


help: ## Show this help
	@echo "Harmony Home"
	@echo "======="
	@echo
	@echo "See README.md for full documentation."
	@echo
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -Ee 's/([a-z.]*):[^#]*##(.*)/\1##\2/' | sort | column -t -s "##"


clean: ## Remove build/test artifacts
	@touch .env 
	@docker-compose kill redis
	@docker-compose rm --force redis

build: clean ## Build the docker image
	env > .env
	@docker-compose build web

run: clean build ## Invoke the function locally with an event piped to stdin
	@docker-compose run --rm web

gactions-update: ensure-variables clean build
	@docker-compose run --rm web ./scripts/gactions-update.sh

gactions-test: ensure-variables clean build
	@docker-compose run --rm web ./scripts/gactions-test.sh
