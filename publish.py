#!/usr/bin/env python
#-*- coding: utf-8 -*-

from config import *
from os import system, remove, listdir
from shutil import copy

v = vars()

copy("%(app)s.xpi" % v, "www/%(app)s.xpi" % v)
copy("%(app)s.xpi" % v, "www/%(updateFile)s" % v)

system("./www/update.rdf.build")

#system("svn add www/%(updateFile)s" % v)
#system("svn ci -m 'Published %(app)s %(version)s build' www/%(app)s.xpi www/%(updateFile)s www/update.rdf" % v)
