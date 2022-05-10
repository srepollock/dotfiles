#!/bin/bash
# Usage: ./decrypt.sh /path/to/ransomware
cd $2
for d in $2
do
    wd = $(pwd)
    file = $(basename "${d%.*}")
    openssl rsautl -decrypt -inkey private.pem -in $d > "$wd/$file.tar.gz"
    tar -xzvf "$wd/$file.tar.gz"   
done
echo "Here you go"