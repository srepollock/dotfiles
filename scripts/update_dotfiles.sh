#!/bin/bash
# Updates the dotfiles of this project with the current dotfiles in the user's directory

cp ~/.vimrc ~/Documents/git/dotfiles 
cp ~/.bashrc ~/Documents/git/dotfiles 
cp ~/.zshrc ~/Documents/git/dotfiles
cp ~/.zprofile ~/Documents/git/dotfiles
cp -r ~/.vscode ~/Documents/git/dotfiles
