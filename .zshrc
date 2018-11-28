# zshrc
# -----
# Created and maintained by Spencer Pollock
# Use at your discretion.
# Give credit where it is due.
# -----

# General Alias'
alias l='ls -l'
alias ll='ls -la'
alias c='clear'
alias p='pwd'
alias pd='pwd'
alias hy='history'
alias py='python'

# Git alias'
git config --global alias.tree log --graph --oneline --all
git config --global alias.fix commit --amend

#Prompt
PROMPT='%F{cyan}%n%f @ %m %F{cyan}%~ > %f'
RPROMPT=''
screenfetch
# Git Good Update Export
export PATH="$HOME/.gitgood/update:$PATH"
