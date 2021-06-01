#!/usr/bin/env python3

import datetime
import argparse
import curses
import logging
import re
import shlex
import subprocess
import time
import os
import requests
import urllib.request
import time
from bs4 import BeautifulSoup

DEBUG=False
VERBOSE=False

def scrape(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    
    return soup 

def action_links(results):
    links = []
    for link in results.findAll('a'):
        links.append(link['href'])
    return links

'''
Main runners
'''
def get_args():
    '''
    Gets the arguments for the user

    Returns the arguments from the user in a Key,Value Namespace.
    '''
    description = '''
    Git Manager

    Used to handle all my git commit names, changelog, version number, and other minor git details.

    This is based on an NPM project and package, but I wanted something that's more extensible to projects than just NPM. Here is a project for just that.

    Created by Spencer Pollock (spencer@spollock.ca)
    '''
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('output', type=str, nargs=1, help='file to output resluts to.')
    parser.add_argument('-u', '--url', dest='url', type=str, nargs=1, help='The URL to scrape.')
    subparsers = parser.add_subparsers(help='''Action Subparsing''')
    parser_actions = subparsers.add_parser('action', help='''Action Subparser\nActions: -l/--links''')
    parser_actions.add_argument('-l', '--links', action='store_true', help='Gets all links from the page into a text file.')
    parser.add_argument('--debug', dest='debug', action='store_true', help='Runs the script in debug mode, no actions taken.')
    parser.add_argument('--verbose', dest='verbose', action='store_true', help='Runs the script in verbose mode.') 
    return parser.parse_args()

def main(args):
    '''
    Main function for running.
    '''
    global DEBUG
    global VERBOSE 
    DEBUG = args.debug
    VERBOSE = args.verbose
    if (DEBUG):
        print ('DEBUG is {}'.format(DEBUG))
    if (VERBOSE):
        print ('Verbose is {}'.format(VERBOSE))
        logging.debug('Verbose is {}'.format(VERBOSE))
        print ('Version is {}'.format(args.version))
        logging.debug('Version is {}'.format(args.version))
    scrape(args.url)

if __name__ == "__main__":
    logging.basicConfig(format='%(asctime)s - %(message)s', filename='.log'.format(datetime.datetime.today().replace(tzinfo=datetime.timezone.utc).timestamp()), level=logging.DEBUG, datefmt='%Y-%m-%d %H:%M:%S')
    args = get_args()
    main(args)
    logging.shutdown()
