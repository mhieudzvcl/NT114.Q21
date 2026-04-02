const fs = require('fs');
const path = require('path');

const mainJsxPath = path.join(__dirname, '..', 'apps', 'frontend-web', 'src', 'main.jsx');
const indexCssPath = path.join(__dirname, '..', 'apps', 'frontend-web', 'src', 'index.css');

let content = fs.readFileSync(mainJsxPath, 'utf8');

const startStr = "<style>{`";
const endStr = "`}</style>";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  let css = content.slice(startIdx + startStr.length, endIdx);
  if (css.startsWith('\n')) css = css.slice(1);
  
  // Ghi đè vào index.css
  fs.writeFileSync(indexCssPath, css, 'utf8');
  console.log("Wrote index.css");
  
  // Tìm và cắt component GlobalStyle
  const globalStyleStart = content.indexOf('/* ── GLOBAL STYLES ──');
  const globalStyleEnd = content.indexOf(');', endIdx) + 2;
  
  if (globalStyleStart !== -1 && globalStyleEnd !== -1) {
    const before = content.slice(0, globalStyleStart);
    let after = content.slice(globalStyleEnd);
    
    // Xoá khoảng trắng thừa ngay sau khi cắt
    after = after.replace(/^\r?\n+/, '\n');
    
    let newContent = before + "import './index.css';\n" + after;
    
    // Tìm và xoá thẻ <GlobalStyle /> bên trong App render
    newContent = newContent.replace(/[ \t]*<GlobalStyle \/>\r?\n/, '');
    
    fs.writeFileSync(mainJsxPath, newContent, 'utf8');
    console.log("Updated main.jsx");
  } else {
    console.log("Could not find GlobalStyle boundaries");
  }
} else {
  console.log("Could not find style template literal");
}
