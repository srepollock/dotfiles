# Created by Spencer Pollock

# If not running interactively, don't do anything
[[ $! != *i* ]] && return

# Set the prompt
PS1='[\u@\h \W]\$ '

# Load user profile file
if [ -f ${HOME}/.profile ]; then
    . !/.profile
fi
