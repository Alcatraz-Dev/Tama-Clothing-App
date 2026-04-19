
import sys
import re

def find_unclosed_tags(filename, tag_name):
    with open(filename, 'r') as f:
        content = f.read()

    # Remove comments to avoid false positives
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*?\n', '\n', content)

    stack = []
    # Tokenize by tags - catch <View or </View but NOT <Animatable.View
    # Regex: </? (tag_name) (\s+|>|/>)
    pattern = r'<(/?[a-zA-Z0-9\.]+)'
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # We need to find tags but distinguish <View from <Animatable.View
        # Let's use a more precise regex
        # Opening: <View
        # Closing: </View
        tag_pattern = r'<(/?(\w+(\.\w+)?))'
        found = re.findall(tag_pattern, line)
        for full_tag, name, sub in found:
            if name == tag_name:
                stack.append(i + 1)
            elif name == '/' + tag_name:
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing {tag_name} at line {i+1}")
            
            # Check for self-closing in the original string at this position?
            # Simpler: just check if the line contains tag_name + ' />'
            if (f'<{tag_name} ' in line or f'<{tag_name}>' in line) and '/>' in line:
                # This logic is a bit weak for multi-line but let's try
                # Actually, if it has /> it shouldn't have been pushed or should be popped
                # Let's refine
                pass

    if stack:
        print(f"Unclosed {tag_name} tags starting at lines: {stack}")
    else:
        print(f"All {tag_name} tags are balanced.")

if __name__ == "__main__":
    find_unclosed_tags(sys.argv[1], 'View')
