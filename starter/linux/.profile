# Language
export LANG='en_US.UTF-8'
export LC_ALL='en_US.UTF-8'

# Alias
# Change dotfiles
alias change-zshrc='vim ~/.zshrc'
alias update-zshrc='source ~/.zshrc'
alias change-vimrc='vim ~/.vimrc'
alias change-alias='vim ~/.profile'

# General CLI navigation
alias l='ls -l'
alias ll='ls -la'
alias c='clear'
alias pd='pwd'

# Disk sizes
alias disksize='df -h'
alias dirsize='du -h | tail -n 1'

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

# Git
alias restore-clean="git reset head --hard; git clean -df"
alias last_commit="git rev-parse head"

# IP addresses
alias ip="dig +short myip.opendns.com @resolver1.opendns.com"
alias localip="ipconfig getifaddr en0"

export PATH