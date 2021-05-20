#!/usr/bin/env python3

import os
from pyfiglet import Figlet

def font_art(text, font):
    cool_text = Figlet(font=font)
    return str(cool_text.renderText(text))
if __name__ == "__main__":
    print (os.popen('python3 -m pyfiglet --list_fonts').read().split('\n'))
    print (font_art(input("Text to Generate:"), input("Style to use:")))