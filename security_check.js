#!/usr/bin/env node

/**
 * Security Check Script for Trading Journal Application
 * Run this script before publishing to GitHub to ensure no sensitive data is exposed
 */

import fs from 'fs';
import path from 'path';

const SENSITIVE_PATTERNS = [
  // Hardcoded URLs
  { pattern: /localhost:5001/g, description: 'Hardcoded localhost:5001 URL' },
  { pattern: /localhost:5173/g, description: 'Hardcoded localhost:5173 URL' },
  { pattern: /127\.0\.0\.1/g, description: 'Hardcoded localhost IP' },
  
  // Hardcoded secrets
  { pattern: /test_secret_key/g, description: 'Hardcoded JWT secret key' },
  { pattern: /dev_secret_key/g, description: 'Hardcoded development secret key' },
  
  // Hardcoded database paths
  { pattern: /\.\/trading_journal\.db/g, description: 'Hardcoded database file path' },
  { pattern: /\.\/uploads/g, description: 'Hardcoded uploads directory' },
  
  // Hardcoded ports
  { pattern: /port = 5001/g, description: 'Hardcoded port number' },
  { pattern: /PORT = 5001/g, description: 'Hardcoded PORT constant' },
  
  // API keys or tokens (generic patterns) - only flag actual hardcoded values, not variable assignments
  { pattern: /api_key\s*[:=]\s*['"][^'"]{5,}['"]/gi, description: 'Potential hardcoded API key' },
  { pattern: /password\s*[:=]\s*['"][^'"]{5,}['"]/gi, description: 'Potential hardcoded password' },
  { pattern: /secret\s*[:=]\s*['"][^'"]{5,}['"]/gi, description: 'Potential hardcoded secret' },
  // More specific patterns to avoid false positives for tokens
  { pattern: /const\s+token\s*=\s*['"][^'"]{5,}['"]/gi, description: 'Hardcoded token constant' },
  { pattern: /let\s+token\s*=\s*['"][^'"]{5,}['"]/gi, description: 'Hardcoded token variable' },
  { pattern: /var\s+token\s*=\s*['"][^'"]{5,}['"]/gi, description: 'Hardcoded token variable' },
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.env/,
  /\.env\.local/,
  /\.env\.example/,
  /trading_journal\.db/,
  /uploads\//,
  /logs\.txt/,
  /package-lock\.json/,
  /\.log$/,
  /SECURITY\.md/,
  /security_check\.js/,
  /dist\//,
  /build\//,
  /\.next\//,
  /coverage\//,
  /\.nyc_output\//,
  /\.cache\//,
  /\.parcel-cache\//,
];

const IGNORE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.zip', '.tar', '.gz', '.rar',
  '.exe', '.dll', '.so', '.dylib',
];

function shouldIgnoreFile(filePath) {
  // Check ignore patterns
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(filePath)) {
      return true;
    }
  }
  
  // Check ignore extensions
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORE_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  return false;
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    for (const { pattern, description } of SENSITIVE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          description,
          matches: matches.length,
          lines: content.split('\n').map((line, index) => {
            if (pattern.test(line)) {
              return { lineNumber: index + 1, content: line.trim() };
            }
            return null;
          }).filter(Boolean)
        });
      }
    }
    
    return issues;
  } catch (error) {
    return [{ description: `Error reading file: ${error.message}` }];
  }
}

function scanDirectory(dirPath, results = []) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldIgnoreFile(fullPath)) {
          scanDirectory(fullPath, results);
        }
      } else if (stat.isFile()) {
        if (!shouldIgnoreFile(fullPath)) {
          const issues = scanFile(fullPath);
          if (issues.length > 0) {
            results.push({
              file: fullPath,
              issues
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return results;
}

function main() {
  console.log('🔍 Security Check for Trading Journal Application\n');
  console.log('Scanning for potential security issues...\n');
  
  const results = scanDirectory('.');
  
  if (results.length === 0) {
    console.log('✅ No security issues found! Your codebase appears to be secure.');
    console.log('\n📋 Remember to:');
    console.log('   - Create production .env files');
    console.log('   - Remove development database and upload files');
    console.log('   - Generate strong JWT secrets');
    console.log('   - Review SECURITY.md for complete checklist');
  } else {
    console.log(`❌ Found ${results.length} file(s) with potential security issues:\n`);
    
    for (const result of results) {
      console.log(`📁 ${result.file}`);
      for (const issue of result.issues) {
        console.log(`   ⚠️  ${issue.description}`);
        if (issue.matches) {
          console.log(`      Found ${issue.matches} match(es)`);
        }
        if (issue.lines) {
          for (const line of issue.lines) {
            console.log(`      Line ${line.lineNumber}: ${line.content}`);
          }
        }
      }
      console.log('');
    }
    
    console.log('🚨 Please fix these issues before publishing to GitHub!');
    console.log('📖 See SECURITY.md for detailed guidance.');
  }
}

// Run the security check
main();
