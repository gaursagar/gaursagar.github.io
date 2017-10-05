import pymol
from pymol import cmd
from pymol import util
import glob
import os

for i in glob.glob('*coor'):
    try:
        print (i)
        cmd.delete('all')
        filename = i.split('.')[0]
        amber = pymol.cmd.load(filename + '.coor')
        charmm = pymol.cmd.load(filename + '_minimized.pdb')
        if 'chhgg' not in i:
            qm = pymol.cmd.load(filename + '.xyz')
        cmd.zoom('all')
        cmd.color('red', filename + '.coor')
        cmd.color('green', filename + '_minimized')
        if 'chhgg' not in i:
            cmd.color('blue', filename)
        cmd.bg_color('white')
        cmd.set('ray_opaque_background', 0)
        cmd.set('line_width', 2.5)
        cmd.ray()
        cmd.png(filename, dpi=1000)
        cmd.hide('lines', filename + '.coor')
        cmd.set('line_width', 4)
        cmd.hide('lines', filename + '_minimized')
        cmd.color("grey50", "all")
        util.cnc("all")
        cmd.ray()
        cmd.png(filename + '_qm', dpi=1000)
        continue
	# cmd.delete(filename)
        orig = pymol.cmd.load(filename + '.pdb', 'original')
        cmd.zoom('all')
        cmd.color("grey50", "all")
        util.cnc("all")
        if 'chhgg' not in i:
            cmd.color("green", filename)
        # cmd.set('ray_opaque_background', 0)
        cmd.ray()
        cmd.png(filename + '_start', dpi=1000)
    except:
        raise
        pass


os.system("mogrify -trim *.png")

exit