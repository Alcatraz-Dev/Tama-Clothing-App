import re

with open('App.tsx', 'r') as f:
    text = f.read()

# 1. Dashboard permission
text = text.replace(
    "{['admin', 'editor', 'viewer'].includes(profileData?.role) && (",
    "{['admin', 'editor', 'viewer', 'brand_owner', 'support', 'nor_kam'].includes(profileData?.role) && ("
)

# 2. Duplicate button removal (Lines 4163-4234 roughly).
# Let's dynamically find it.
import sys

# Replace header backgrounds
text = text.replace(
    "backgroundColor: theme === 'dark' ? '#0A0A0A' : 'white'",
    "backgroundColor: theme === 'dark' ? '#0A0A0A' : '#eeeeee'"
)
text = text.replace(
    "backgroundColor: theme === 'dark' ? '#000' : 'white'",
    "backgroundColor: theme === 'dark' ? '#000' : '#eeeeee'"
)

with open('App.tsx', 'w') as f:
    f.write(text)

