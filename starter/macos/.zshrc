# Path to your oh-my-zsh installation.
export ZSH=/Users/Spencer/.oh-my-zsh

# Set name of the theme to load.
# Look in ~/.oh-my-zsh/themes/
# Optionally, if you set this to "random", it'll load a random theme each
# time that oh-my-zsh is loaded.
ZSH_THEME="agnoster"

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion. Case
# sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to change how often to auto-update (in days).
export UPDATE_ZSH_DAYS=7

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# The optional three formats: "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
#HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.  plugins=(git) 
# User configuration

export PATH="/Library/Frameworks/Python.framework/Versions/3.4/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/bin"
# export MANPATH="/usr/local/man:$MANPATH"

source $ZSH/oh-my-zsh.sh

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# ssh
# export SSH_KEY_PATH="~/.ssh/dsa_id"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

# redefine prompt_context for hiding user@hostname
prompt_context () { }

alias code="/Applications/Visual\ Studio\ Code.app/Contents/MacOS/Electron"

# Git Good Update Export
export PATH="$HOME/.gitgood/update:$PATH"

# ---MAC FILES---
# Add coreutils (brew install coreutils) to PATH
PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"
# Add gnubin ('g' commands) to your PATH
PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"
# Add coreutils (brew install coreutils) to MANPATH
MANPATH="/usr/local/opt/coreutils/libexec/gnuman:$MANPATH"
# MacVim as Vim Alias
alias vim='mvim -v'
#alias vim='nvim'

# Alias
alias change-zshrc='vim ~/.zshrc'
alias update-zshrc='source ~/.zshrc'
alias l='ls -l'
alias ll='ls -la'
alias c='clear'
alias pd='pwd'
alias cpp11='clang++ -std=c++11'
alias cpp14='clang++ -std=c++14'
alias py='python'
alias brewclean='brew cleanup --force -s && rm -rf $(brew --cache)'
alias change-vimrc="vim ~/.vimrc"