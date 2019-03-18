" Spencer's Setting
" Some decent VIM ettings for programming

" Indentation Options
set auto indent                 " New lines inherit the indentation of previous lines
set expand tab                  " Convert tabs to spaces
"set filetype indent on          " Enable indentation rules that are file-type specific
set ai                          " Turns on auto indentation
set shiftround                  " When shifting lines, round the indentation to the nearest multiple of 'shiftwidth'
set shiftwidth=4                " Tab spacing
set smarttab                    " Insert 'tabstop' number of spaces when the 'tab' key is pressed
set tabstop=4                   " Indent using 4 spaces

" Search Options
set hlsearch                    " Enables search highlihgting; `:noh` to turn off
set ignorecase                  " Ignore case when searching
set incsearch                   " Incremental search that shows partial matches
set smartcase                   " Automatically switch search to case-sensitive when search query contains an uppercase letter

" Performance Options
set complete-=i                 " Limit the file searched for auto-completes
set lazyredraw                  " Don't update screen during macro and script execution

" Text Rendering Options
set display+=lastline           " Always try to show a paragraph's last line
set encoding=utf-8              " Use an encoding that supports unicode
set linebreak                   " Avoid wrapping the line in the middle of a word
set scrolloff=1                 " The number of screen lines to keep above and below the cursor
set sidescrolloff=5             " The number of screen colums to keep to the left and right of the cursor
syntax enable                   " Enable syntax highlighting
set wrap                        " Enable line wrapping
" Character length rulers
highligh OverLength ctermbg=red ctermfg=white guibg=#592929
match OverLength /\%81v.\+/
" Trailing whitespace highlight
highlight ExtraWhitespace ctermbg=red guibg=red
match ExtraWhitespace /\s\+\%#\@<!$/

" User Interface Options
set showmode                    " Shows the current mode Vim is in
set laststatus=2                " Always display the status bar
set ruler                       " Always shows the cursor position
set wildmenu                    " Display command line's tab complete options as a menu
set tabpagemax=50               " Maximum number of tab pages that can be opened from the command line
"set colorscheme wombat256mod    " Changes color scheme
"set cursorline                  " Highlights the line the cursor is on with an underline
set nu                          " Turns on line numbers
set relativenumber              " Turns on relative numbers on the ruler. Great for jumping relative to the line number. numbers must be turned on first.
set noerrorbells                " Disable beep on errors
set visualbell                  " Screen flash on errors
set mouse=a                     " Enable mouse for scrolling and resizing
set title                       " Set's the window title to reflect the current file being edited
set background=dark             " Use colours that work well on a dark background (Console is usually black)
set showmatch                   " Show matching bracket when highlighting brackets

" Code Folding Options
set foldmethod=indent           " Fold based on indentation level
set foldnestmax=3               " Only fold up to three nested levels
set nofoldenable                " Disable folding by default

" Miscellaneous Options
set autoread                    " Automatically re-read files if unmodified inside Vim
set backspace=indent,eol,start  " Allow backspacing over indentation, line breaks and insertion start
"set backupdir=~/.cache/vim      " Directory to store backup files
set confirm                     " Display a confirm dialog when closing an unsaved file
set dir=~/.cache/vim            " Directory to store swap files
set formatoptions+=j            " Delete comment characters when joining lines
set hidden                      " Hide files in the background when joining
set nomodeline                  " Ignore file's mode lines, use vimrc configuration instead
set noswapfile                  " Disable swap files
set nrformats-=octal            " Interprets octal as decimal when incrementing numbers
set clipboard=unnamed           " Set clipbboard to unnamed to access the system clipboard under windows