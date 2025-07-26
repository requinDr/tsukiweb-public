import sys
from fontTools.subset import main as ss
import urllib.request
import os
import re

#assert 'Brotli' in sys.modules, \
#    "package 'brotli' is required to create the font"

fileDir = os.path.dirname(__file__)
tempPath = f"{fileDir}/tempFont.tff"
outputFile = f"{fileDir}/TwemojiCountryFlags.woff2"
version = "v0.7.0"
remoteUrl = f"https://github.com/mozilla/twemoji-colr/releases/download/{version}/Twemoji.Mozilla.ttf"
originalFontContent = urllib.request.urlopen(remoteUrl).read()
open(tempPath, 'wb').write(originalFontContent)

codes = [
"🇯🇵",
"🇬🇧",
"🇮🇹",
"🇧🇷",
"🇪🇸",
"🇷🇺",
"🇨🇳",
"🇨🇳",
"🇰🇷",
]
unicodes = set()
unicodePrefixRegexp = re.compile(r'\\U0+')
for code in codes :
    for char in code :
        unicode = unicodePrefixRegexp.sub('U+',
            char.encode("unicode_escape")
                .decode("utf-8")
                .upper()
        )
        unicodes.add(unicode)
print(unicodes)
sys.argv = [None, tempPath,
    '--no-subset-tables+=FFTM',
    f'--unicodes={",".join(unicodes)}',
    f'--output-file={outputFile}',
    '--flavor=woff2']
ss()  # this is what actually does the subsetting and writes the output file
os.remove(tempPath)
