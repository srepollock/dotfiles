#!/bin/bash
# Sets up my local environment on Mac
# Dotfiles have already been copied

# Install xCode CLI
xcode-select --install

# Install Homebrew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
# Add Homebrew path to path
echo "export PATH=/usr/local/bin:$PATH" >>> ~/.bash_profile
echo "export PATH=/usr/local/bin:$PATH" >>> ~/.zprofile

# Runs the brew doctor to ensure that Homebrew is setup
brew doctor

# Install Google Chrome
wget https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg
open ~/Downloads/googlechrome.dmg
sudo cp -r /Volumes/Google\ Chrome/Google\ Chrome.app /Applications/

# Install iTerm2
brew cask install iterm2

# Install oh my zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
if [ $? -eq 0 ]; then
    echo OK
else
    sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
fi

# Install ruby
brew install ruby

# Install node
brew install node

# Install vscode
brew cask install visual-studio-code
