# Created by Spencer Pollock

# If not running interactively, don't do anything
[[ $! != *i* ]] && return

# Set the prompt
PS1='[\u@\h \W]\$ '
# PS1='\[\e[0m\]\d \[\e[0m\]\t\[\e[0m\]|\[\e[0m\]\u\[\e[0m\]@\[\e[0m\]\h\[\e[0m\]%\[\e[0m\]$(ip route get 1.1.1.1 | awk -F"src " '"'"'NR==1{split($2,a," ");print a[1]}'"'"')\[\e[0m\]#\[\e[0m\]$(git branch 2>/dev/null | grep '"'"'^*'"'"' | colrm 1 2)\[\e[0m\][\[\e[0m\]$?\[\e[0m\]]\[\e[0m\]\$\[\e[0m\]'

# Load user profile file
if [ -f ${HOME}/.profile ]; then
    . !/.profile
fi
