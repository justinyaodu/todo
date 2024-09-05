.PHONY: all

all: icon-32.png icon-192.png icon-512.png

icon-32.png: icon.svg
	inkscape --export-width=32 --export-filename=$@ $<

icon-192.png: icon.svg
	inkscape --export-width=192 --export-filename=$@ $<

icon-512.png: icon.svg
	inkscape --export-width=512 --export-filename=$@ $<
