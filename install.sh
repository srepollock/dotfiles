#!/bin/bash

# 1. Setup git folder
# 2. Copy dotfiles
# 3. Check the environment
# 4. Run the script to install programs

mkdir ~/Documents
mkdir ~/Documents/git

./copy_dotfiles.sh

os=${OSTYPE//[0-9.-]*/}
case "$os" in
  darwin)
      # mac install
      ./scripts/mac_setup.sh
    ;;
  msys)
      # windows install
      echo "Windows is not supported"
    ;;
  linux)
      # linux install
      ./scripts/linux_setup.sh
    ;;
  *)
  echo "Unknown Operating system $OSTYPE"
  exit 1
esac
