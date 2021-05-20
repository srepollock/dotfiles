# Language
export LANG='en_US.UTF-8'
export LC_ALL='en_US.UTF-8'

# ---MAC FILES---
# Add coreutils (brew install coreutils) to PATH
PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"
# Add gnubin ('g' commands) to your PATH
PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"
# Add coreutils (brew install coreutils) to MANPATH
MANPATH="/usr/local/opt/coreutils/libexec/gnuman:$MANPATH"

# Alias
# Change dotfiles
alias change-zshrc='vim ~/.zshrc'
alias change-vimrc="vim ~/.vimrc"
alias change-alias='vim ~/.profile'
alias update-zshrc='source ~/.zshrc'

# General CLI navigation
alias l='ls -l'
alias ll='ls -la'
alias c='clear'
alias pd='pwd'

# Dist sizes
alias disksize='df -h'
alias dirsize='du -hh | tail -n 1'

# Script Compilation
alias cpp11='clang++ -std=c++11'
alias cpp14='clang++ -std=c++14'
alias py='python'
alias py2='python2'
alias py3='python3'

# Zips
alias extract='tar -xzvf '
alias createzip='tar -czf '

# Shell helpers
alias find_text_in_directory="grep -r -i -Hn" # Then pass {string insensitive} {path/glob/to/dir/**/*.{filetype}
alias path='echo -e ${PATH//:/\\n}'

# --MAC ALIAS'--
alias brewclean='brew cleanup --force -s && rm -rf $(brew --cache)'
# macOS has no `md5sum`, so use `md5` as a fallback
command -v md5sum > /dev/null || alias md5sum="md5"
# macOS has no `sha1sum`, so use `shasum` as a fallback
command -v sha1sum > /dev/null || alias sha1sum="shasum"
# Set vim as MacVim from a brew install
alias vim='mvim -v'
# Visual Studio Code
alias code="/Applications/Visual\ Studio\ Code.app/Contents/MacOS/Electron"


# Stuff I never really use but cannot delete either because of http://xkcd.com/530/
alias stfu="osascript -e 'set volume output muted true'"
alias pumpitup="osascript -e 'set volume output volume 100'"

# Git alias
alias last_commit="git rev-parse head"
alias git-tree='git log --graph --oneline --all'


# IP addresses
alias ip="dig +short myip.opendns.com @resolver1.opendns.com"
alias localip="ipconfig getifaddr en0"

export PATH