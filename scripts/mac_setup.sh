#!/bin/bash

# 1. Setup the Documents folder
# 2. Backup the current dotfiles
# 3. Copy the Linux configuration

mkdir ~/Documents
mkdir ~/Documents/git
mkdir ~/Documents/media
mkdir ~/Documents/personal
mkdir ~/Documents/scripts

date=$(date -R)
backup_folder=".dotfiles_backup_${date}"

mkdir ~/${backup_folder}
echo "Moving current dotfiles to backup folder: ~/${backup_folder}"
rsync -avqh --progress ~/.* ~/${backup_folder} --exclude ~/${backup_folder} --remove-source-files
echo "Copying dotfiles to home for macOS"
rsync -avq --progress starter/macos/ ~/
