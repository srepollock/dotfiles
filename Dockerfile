FROM ubuntu:latest

# Missing standard libraries
RUN apt update
RUN apt install sudo -y

RUN useradd -rm -d /home/xyz -s /bin/bash -g root -G sudo -u 1001 xyz
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Build from a subdirectory, not $HOME. The repo root and $HOME must differ or
# claude_install's source (<repo>/.claude) and destination ($HOME/.claude)
# resolve to the same path, and it silently installs nothing.
WORKDIR /home/xyz/dotfiles
USER xyz

COPY .dotfile_scripts/ .dotfile_scripts/
COPY starter/ starter/
COPY .claude/ .claude/
COPY claude-desktop/ claude-desktop/
COPY install .
# COPY lands files as root even under USER; the install script cleans up after
# itself as xyz, so hand the tree over first.
RUN sudo chown -R xyz:root /home/xyz/dotfiles \
    && sudo chmod +x install .dotfile_scripts/*
RUN ./install

# zsh is installed by linux_debian_installs; fall back to bash so the smoke
# test is still inspectable when that step fails.
ENTRYPOINT ["/bin/sh", "-c", "command -v zsh >/dev/null && exec zsh || exec bash"]