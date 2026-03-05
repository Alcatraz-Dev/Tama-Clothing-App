const fs = require('fs');

const FILES = [
  'src/widgets/CartHomeWidget.ios.tsx',
  'src/widgets/DealsWidget.ios.tsx',
  'src/widgets/OrderTrackingWidget.ios.tsx',
  'src/widgets/RecommendationsWidget.ios.tsx'
];

for (const file of FILES) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace colors
  content = content.replace(/const bgColor = isDark \? '[^']+' : '[^']+';/g, "const bgColor = { dynamic: { light: '#f2f2f7', dark: '#1c1c1e' } } as any;");
  content = content.replace(/const cardBgColor = isDark \? '[^']+' : '[^']+';/g, "const cardBgColor = { dynamic: { light: '#ffffff', dark: '#2c2c2e' } } as any;");
  content = content.replace(/const primaryColor = isDark \? '[^']+' : '[^']+';/g, "const primaryColor = { dynamic: { light: '#1c1c1e', dark: '#ffffff' } } as any;");
  content = content.replace(/const secondaryColor = isDark \? '[^']+' : '[^']+';/g, "const secondaryColor = { dynamic: { light: '#636366', dark: '#8E8E93' } } as any;");
  content = content.replace(/const activeColor = isDark \? '[^']+' : '[^']+';/g, "const activeColor = { dynamic: { light: '#1c1c1e', dark: '#ffffff' } } as any;");

  // Fix images
  if (file.includes('DealsWidget')) {
    content = content.replace(/\{deal\?\.imageUrl && \(\s*<RemoteImage source=\{\{ uri: deal\.imageUrl \}\}.*\s*\)\}/g, '');
    // Insert bolt icon into the ZStack instead
    content = content.replace(/<VStack modifiers=\{\[frame\(\{ maxWidth: 9999, height: 90, alignment: 'topTrailing' \}\)]\}>/g, 
      '<VStack modifiers={[frame({ maxWidth: 9999, height: 90, alignment: \'center\' })]}>\n                        <Image systemName="bolt.fill" modifiers={[font({ size: 40 }), foregroundStyle(\'#FFCC00\')]} />\n                    </VStack>\n                    <VStack modifiers={[frame({ maxWidth: 9999, height: 90, alignment: \'topTrailing\' })]}>');
      
    // Remove the remote images mapped in DealsWidget
    content = content.replace(/<RemoteImage source=\{\{ uri: deal\.imageUrl \}\}.*\/>/g, '<Image systemName="bolt.fill" modifiers={[font({ size: 24 }), foregroundStyle(\'#FFCC00\')]} />');
    content = content.replace(/const RemoteImage = Image as any;/g, '');
  }
  
  if (file.includes('Cart')) {
    content = content.replace(/const RemoteImage = Image as any;/g, '');
    content = content.replace(/<RemoteImage source=\{\{ uri: item\.image \}\}.*\/>/g, '<Image systemName="cart.fill" modifiers={[font({ size: 20 }), foregroundStyle(BEY3A_ACCENT)]} />');
    
  }

  if (file.includes('Recommendations')) {
    content = content.replace(/const RemoteImage = Image as any;/g, '');
    content = content.replace(/\{product\?\.imageUrl && \(\s*<RemoteImage source=\{\{ uri: product\.imageUrl \}\}.*\s*\)\}/g, '<Image systemName="sparkles" modifiers={[font({ size: 30 }), foregroundStyle(BEY3A_ACCENT)]} />');
  }

  fs.writeFileSync(file, content);
}
