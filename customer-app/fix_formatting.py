import re

with open('/Users/haythem_dhahri/Desktop/projects/website/TamaClothing/customer-app/App.tsx', 'r') as f:
    content = f.read()

# Fix Ar missing indentation for the first line
content = content.replace("accessoires: 'إكسسوارات',\npromotionTitle:", "accessoires: 'إكسسوارات',\n    promotionTitle:")

# Fix En missing indentation for the first line
content = content.replace("accessoires: 'Accessories',\npromotionTitle:", "accessoires: 'Accessories',\n    promotionTitle:")

with open('/Users/haythem_dhahri/Desktop/projects/website/TamaClothing/customer-app/App.tsx', 'w') as f:
    f.write(content)
