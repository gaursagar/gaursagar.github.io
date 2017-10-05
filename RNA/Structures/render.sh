#!/bin/bash

for i in 0 100 10000;do
	cd all_$i;
	pymol render.py;
	cd ..;
done
