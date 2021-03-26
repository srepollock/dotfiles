" Spencer's Settings
:set nu
:set relativenumber
:set mouse:a

:set cindent
:set smartindent
:set autoindent
:set expandtab
:set tabstop=4
:set shiftwidth=4

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

" Other settings? Don't know from where. Maybe oh_my_zsh?
set guifont=Inconsolata\ for\ Powerline:h15
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

