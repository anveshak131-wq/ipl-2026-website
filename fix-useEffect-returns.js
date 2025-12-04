#!/usr/bin/env node

/**
 * Script to automatically fix useEffect return value issues
 * Ensures all useEffect hooks with conditional returns also return undefined when condition is false
 */

const fs = require('fs');
const path = require('path');

// Find all TypeScript/JavaScript files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'out', 'dist', 'build'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/) && !file.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix useEffect return values in a file
function fixUseEffectReturns(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const originalContent = content;
  
  // Find all useEffect calls
  // Pattern: useEffect(() => { ... }, [deps])
  const lines = content.split('\n');
  const newLines = [];
  let inUseEffect = false;
  let useEffectStart = -1;
  let braceDepth = 0;
  let parenDepth = 0;
  let hasConditionalReturn = false;
  let lastReturnLine = -1;
  let useEffectIndent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect useEffect start
    if (trimmed.startsWith('useEffect') && !inUseEffect) {
      inUseEffect = true;
      useEffectStart = i;
      braceDepth = 0;
      parenDepth = 0;
      hasConditionalReturn = false;
      lastReturnLine = -1;
      useEffectIndent = line.match(/^(\s*)/)[1];
      newLines.push(line);
      continue;
    }
    
    if (inUseEffect) {
      // Track braces and parentheses
      for (const char of line) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }
      
      // Check for conditional returns (return inside if statement)
      if (trimmed.includes('if') && trimmed.includes('(')) {
        // This might be a conditional, mark that we need to check
        hasConditionalReturn = true;
      }
      
      if (trimmed.includes('return') && braceDepth > 1) {
        // Return inside a nested block (likely conditional)
        hasConditionalReturn = true;
        lastReturnLine = i;
      }
      
      newLines.push(line);
      
      // Check if useEffect is closing
      // useEffect ends when we have: }, [deps])
      if (braceDepth === 0 && parenDepth === 0 && trimmed.includes(']')) {
        // Check if we need to add return undefined
        if (hasConditionalReturn && lastReturnLine >= 0) {
          // Check if there's already a return undefined before the closing
          let hasReturnUndefined = false;
          for (let j = i; j >= useEffectStart; j--) {
            const checkLine = lines[j].trim();
            if (checkLine === 'return undefined;' || checkLine === 'return undefined') {
              hasReturnUndefined = true;
              break;
            }
            if (checkLine.startsWith('return') && checkLine.includes('undefined')) {
              hasReturnUndefined = true;
              break;
            }
            if (checkLine === '}') break;
          }
          
          if (!hasReturnUndefined) {
            // Find the line before the closing brace of the useEffect body
            // The pattern is: ... }, [deps])
            // We need to insert before the }, [ part
            for (let j = newLines.length - 1; j >= 0; j--) {
              const checkLine = newLines[j];
              if (checkLine.trim().match(/^}\s*,\s*\[/)) {
                // Insert return undefined before this line
                const indent = checkLine.match(/^(\s*)/)[1];
                newLines.splice(j, 0, indent + 'return undefined;');
                modified = true;
                break;
              }
            }
          }
        }
        
        inUseEffect = false;
        useEffectStart = -1;
      }
    } else {
      newLines.push(line);
    }
  }
  
  if (modified) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Alternative simpler approach: regex-based
function fixUseEffectReturnsRegex(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const originalContent = content;
  
  // Find useEffect(() => { ...body... }, [deps])
  // Must match: useEffect( ... ) with arrow function and dependency array
  // More precise pattern to avoid matching regular arrow functions
  const pattern = /(useEffect\s*\(\s*\(\)\s*=>\s*\{)([\s\S]*?)(\}\s*,\s*\[[^\]]*\]\s*\))/g;
  
  let matchIndex = 0;
  content = content.replace(pattern, (match, start, body, end) => {
    // Verify this is actually a useEffect call by checking the context
    // Look backwards to ensure it's not part of a variable assignment or regular function
    const currentIndex = content.indexOf(match, matchIndex);
    matchIndex = currentIndex + match.length;
    const beforeMatch = content.substring(Math.max(0, currentIndex - 100), currentIndex);
    
    // Skip if it looks like a variable assignment (not a direct useEffect call)
    if (beforeMatch.match(/[=:]\s*useEffect\s*$/)) {
      return match; // This is a variable assignment, not a direct useEffect call
    }
    
    // Skip if it's part of a function definition like "const func = () => { useEffect(...) }"
    // Check for patterns like: const/let/var name = ... useEffect
    if (beforeMatch.match(/(const|let|var|function)\s+\w+\s*[=:]\s*[^=]*useEffect\s*$/)) {
      return match;
    }
    
    // Most importantly: ensure it starts with "useEffect(" at the beginning of a statement
    // It should be preceded by whitespace, newline, semicolon, or be at the start
    const charBefore = currentIndex > 0 ? content[currentIndex - 1] : '';
    if (charBefore && !charBefore.match(/[\s\n;{}(]/)) {
      return match; // Not at the start of a statement
    }
    
    // Check if body has conditional returns
    const hasIfWithReturn = /if\s*\([^)]+\)\s*\{[\s\S]*?return\s+/.test(body);
    
    if (!hasIfWithReturn) {
      return match; // No conditional returns, skip
    }
    
    // Check if already has return undefined at the end
    const bodyTrimmed = body.trim();
    if (bodyTrimmed.match(/return\s+undefined\s*;?\s*$/)) {
      return match; // Already fixed
    }
    
    // Check if last statement is a return
    const lines = body.split('\n');
    let lastStatement = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed && !trimmed.match(/^[\s}]*$/)) {
        lastStatement = trimmed;
        break;
      }
    }
    
    if (lastStatement.match(/^return\s+/)) {
      return match; // Already has return
    }
    
    // Find the closing brace of the body
    const lastBraceIndex = body.lastIndexOf('}');
    if (lastBraceIndex > 0) {
      const beforeBrace = body.substring(0, lastBraceIndex);
      const afterBrace = body.substring(lastBraceIndex);
      
      // Get indentation from the last non-empty line
      const indentMatch = beforeBrace.match(/(\n|^)([ \t]+)[^\s]/);
      const indent = indentMatch ? indentMatch[2] : '  ';
      
      // Add return undefined before closing brace
      modified = true;
      return start + beforeBrace + '\n' + indent + 'return undefined;' + afterBrace + end;
    }
    
    return match;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('🔍 Finding all TypeScript/JavaScript files...');
const files = findFiles('./src');
console.log(`📁 Found ${files.length} files to check\n`);

let fixedCount = 0;
const fixedFiles = [];

files.forEach(file => {
  try {
    // Use regex approach (simpler and more reliable)
    if (fixUseEffectReturnsRegex(file)) {
      fixedCount++;
      fixedFiles.push(file);
      console.log(`✅ Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${fixedCount} file(s)`);
if (fixedFiles.length > 0) {
  console.log('\n📝 Fixed files:');
  fixedFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🎉 Done! Run `npm run build` to verify the fixes.');
