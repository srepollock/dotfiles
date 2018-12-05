" Spencer's Setting
" Some decent VIM ettings for programming

set nu                          " Turns on line numbers
set relativenumber              " Turns on relative numbers on the ruler. Great for jumping relative to the line number. numbers must be turned on first.
set mouse:a                     " Allows usage of the mouse for selecting
set cindent                     " 
set autoindent                  " For automatically indeting code based on braces and brackets
set expandtab                   " For tabbing-out commands
set tabstop=4                   " Sets the tabstop to 4 characters lenght
set shiftwidth=4                " 
set ai                          " set auto-indenting on for programming
set showmatch                   " automatically show matching brackets. works like it does in bbedit.
set vb                          " turn on the "visual bell" - which is much quieter than the "audio blink"
set ruler                       " show the cursor position all the time
set laststatus=2                " make the last line where the status is two lines deep so you can see status always
set backspace=indent,eol,start  " make that backspace key work the way it should
set nocompatible                " vi compatible is LAME
set background=dark             " Use colours that work well on a dark background (Console is usually black)
set showmode                    " show the current mode
set clipboard=unnamed           " set clipboard to unnamed to access the system clipboard under windows
syntax on                       " turn syntax highlighting on by default

" Font settings
" Don't know from where. Maybe oh_my_zsh?
let g:Powerline_symbols = 'fancy'
set encoding=utf-8
set fillchars+=stl:\ ,stlnc:\
set termencoding=utf-8
if has("gui_running")
    let s:uname = system("uname")
    if s:uname == "Darwin\n"
        set guifont=Inconsolata\ for\ Powerline:h15
    endif
endif

" Highlighting and syntax

" Character length rulers
highligh OverLength ctermbg=red ctermfg=white guibg=#592929
match OverLength /\%81v.\+/

" Trailing whitespace highlight
highlight ExtraWhitespace ctermbg=red guibg=red
match ExtraWhitespace /\s\+\%#\@<!$/
