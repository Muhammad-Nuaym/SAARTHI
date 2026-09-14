import sys
import os

build_dir = os.path.abspath(os.path.dirname(__file__))
if build_dir not in sys.path:
    sys.path.insert(0, build_dir)
