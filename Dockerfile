FROM ubuntu:latest

# Useful libraries
RUN apt update
RUN apt install vim -y \
        curl -y \
        wget -y \
        git -y \
        zsh -y \
        rsync -y

RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

WORKDIR "/root"

COPY .dotfile_scripts/ .dotfile_scripts/
COPY starter/ starter/ 
COPY install .
RUN chmod +x -R install .dotfile_scripts
RUN ./install
ENTRYPOINT ["zsh"]