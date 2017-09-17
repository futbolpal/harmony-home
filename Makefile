.PHONY: build clean run gactions-update

default: help

# retrieve the currently checked out git SHA
GIT_SHA = $(shell git rev-parse HEAD)

# GIT_BRANCH is special cased because of the way Jenkins handles git
# repositories. When Jenkins checks out a commit the branch is left in a
# "detached head" state and thus it's not possible to determine the branch
# name using the same method we use locally.
ifndef GIT_BRANCH
	GIT_BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
else
	GIT_BRANCH = $(shell echo $$GIT_BRANCH | cut -d / -f 2)
endif

# check if the git repository contains any untracked or changed files. If it
# does then we set a "dirty tag" that will be appended to any container tags
# or image names when built to indicate that the artifact was not built from
# a pristine git checkout.
IS_REPO_DIRTY = $(shell git diff --shortstat 2> /dev/null | tail -n1)
ifeq ($(strip $(IS_REPO_DIRTY)),)
	DIRTY_TAG =
else
	DIRTY_TAG= -dirty
endif

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
	@docker-compose build web

run: clean build ## Invoke the function locally with an event piped to stdin
	@docker-compose run --rm web

gactions-update: clean build
	@docker-compose run --rm web ./scripts/gactions-update.sh

gactions-test: clean build
	@docker-compose run --rm web ./scripts/gactions-test.sh
