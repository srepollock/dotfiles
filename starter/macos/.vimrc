" Spencer's Settings
:set nu
:set relativenumber
:set mouse:a
:set cursorline
:set cindent
:set smartindent
:set autoindent
:set expandtab
:set tabstop=4
:set shiftwidth=4
:set wildmode=longest,list,full
:set wildmenu
:set ignorecase
:set smartcase
:set hlsearch

" Setting some decent VIM settings for programming

:set ai                          " set auto-indenting on for programming
:set showmatch                   " automatically show matching brackets. works like it does in bbedit.
:set vb                          " turn on the "visual bell" - which is much quieter than the "audio blink"
:set ruler                       " show the cursor position all the time
:set laststatus=2                " make the last line where the status is two lines deep so you can see status always
:set backspace=indent,eol,start  " make that backspace key work the way it should
:set nocompatible                " vi compatible is LAME
:set background=dark             " Use colours that work well on a dark background (Console is usually black)
:set showmode                    " show the current mode
:set clipboard=unnamed           " set clipboard to unnamed to access the system clipboard under windows
:syntax on                       " turn syntax highlighting on by default
:set nofixendofline				 " turns off default eol fixing
:set ffs=unix                    " sets unix file formats
:set noeol                       " sets no eol by default
":set list " shows '$' for linux line endings

" Other settings? Don't know from where. Maybe oh_my_zsh?
" ----------------
" Fonts
" set guifont=Inconsolata\ for\ Powerline:h15
set guifont=Recursive\ Mono\ Casual\ Static\ Medium:h14
set encoding=utf-8
set termencoding=utf-8

let g:Powerline_symbols = 'fancy'
set fillchars+=stl:\ ,stlnc:\

if has("gui_running")
   let s:uname = system("uname")
   if s:uname == "Darwin\n"
      set guifont=Inconsolata\ for\ Powerline:h15
   endif
endif
