#!/bin/bash
mkdir ~/.backup
rsync -avq ~/.* ~/.backup/ --exclude ~/.backup
