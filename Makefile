docker-build:
	docker build -t srepollock/dotfiles .; docker run -it srepollock/dotfiles
clean-docker-build:
	docker build --no-cache -t srepollock/dotfiles .; docker run -it srepollock/dotfiles
