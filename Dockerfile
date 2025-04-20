FROM ubuntu:latest

# Missing standard libraries
RUN apt update
RUN apt install sudo -y

RUN useradd -rm -d /home/xyz -s /bin/bash -g root -G sudo -u 1001 xyz
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /home/xyz
USER xyz 

COPY .dotfile_scripts/ .dotfile_scripts/
COPY starter/ starter/ 
COPY install .
RUN sudo chmod +x install .dotfile_scripts/*
RUN ./install
ENTRYPOINT ["zsh"]