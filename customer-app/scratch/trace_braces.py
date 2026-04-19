
import sys

def trace_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    import re
    def repl_with_newlines(match):
        return '\n' * match.group(0).count('\n')

    content = re.sub(r'/\*.*?\*/', repl_with_newlines, content, flags=re.DOTALL)
    content = re.sub(r'//.*?\n', '\n', content)
    content = re.sub(r'"([^"\\]|\\.)*"', '""', content)
    content = re.sub(r"'([^'\\]|\\.)*'", "''", content)
    content = re.sub(r'`([^`\\\\]|\\\\.)*`', repl_with_newlines, content, flags=re.DOTALL)
    
    depth = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        prev_depth = depth
        for char in line:
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
        
        if i+1 >= 3600 and i+1 <= 3780:
             print(f"Line {i+1}: Depth {depth} | {line.strip()}")
        
        if depth < 0:
            print(f"Negative depth at line {i+1}: {line.strip()}")
            return
    
    print(f"Final depth: {depth}")

if __name__ == "__main__":
    trace_balance(sys.argv[1])
